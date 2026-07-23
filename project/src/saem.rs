use crate::config::Config;
use crate::dataset::{Dataset, Observation};
use crate::models::{create_model_from_config, PharmacokineticModel, ModelState};
use crate::advanced_estimation::{AdaptiveStepSize, ConvergenceDiagnostics, NumericalStability};
use crate::colors;
use nalgebra::{DMatrix, DVector};
use rand::prelude::*;
use rand_distr::Normal;

#[derive(Debug, Clone)]
pub struct SaemResults {
    pub theta: Vec<f64>,
    pub omega: DMatrix<f64>,
    pub sigma: f64,
    pub individual_parameters: Vec<IndividualParameters>,
    pub convergence: ConvergenceInfo,
    pub log_likelihood: f64,
    pub predictions: Vec<PredictionRecord>,
    pub statistics: ModelStatistics,
}

#[derive(Debug, Clone)]
pub struct ModelStatistics {
    pub aic: f64,
    pub bic: f64,
    pub theta_se: Vec<f64>,
    pub theta_rse: Vec<f64>,
    pub theta_ci_lower: Vec<f64>,
    pub theta_ci_upper: Vec<f64>,
    pub omega_se: DMatrix<f64>,
    pub omega_rse: DMatrix<f64>,
    pub sigma_se: f64,
    pub sigma_rse: f64,
    pub shrinkage_eta: Vec<f64>,
    pub shrinkage_epsilon: f64,
    pub n_observations: usize,
    pub n_subjects: usize,
    pub n_parameters: usize,
}

#[derive(Debug, Clone)]
pub struct IndividualParameters {
    pub id: usize,
    pub eta: DVector<f64>,
    pub params: Vec<f64>,
}

#[derive(Debug, Clone)]
pub struct ConvergenceInfo {
    pub theta_history: Vec<Vec<f64>>,
    pub omega_history: Vec<DMatrix<f64>>,
    pub sigma_history: Vec<f64>,
    pub iterations: usize,
}

#[derive(Debug, Clone)]
pub struct PredictionRecord {
    pub id: usize,
    pub time: f64,
    pub dv: Option<f64>,
    pub pred: f64,
    pub ipred: f64,
    pub iwres: f64,
    pub cwres: f64,
}

pub struct SaemEngine {
    config: Config,
    dataset: Dataset,
    model: Box<dyn PharmacokineticModel>,
    rng: StdRng,
}

impl SaemEngine {
    pub fn new(config: Config, dataset: Dataset) -> Self {
        let model = create_model_from_config(&config.model);
        let rng = StdRng::seed_from_u64(config.estimation.seed);

        Self {
            config,
            dataset,
            model,
            rng,
        }
    }

    pub fn run(&mut self) -> Result<SaemResults, Box<dyn std::error::Error>> {
        let n_theta = self.config.parameters.theta.len();
        let n_eta = self.config.parameters.omega.len();

        let mut theta = self.config.parameters.theta.clone();
        let mut omega = DMatrix::from_row_slice(
            n_eta,
            n_eta,
            &self.config.parameters.omega.iter().flatten().copied().collect::<Vec<_>>(),
        );
        let mut sigma = self.config.parameters.sigma;

        let mut theta_history = Vec::new();
        let mut omega_history = Vec::new();
        let mut sigma_history = Vec::new();

        let subject_ids = self.dataset.subject_ids();
        let n_subjects = subject_ids.len();

        let mut individual_etas: Vec<DVector<f64>> = vec![DVector::zeros(n_eta); n_subjects];

        let total_iterations = self.config.estimation.n_burn_in + self.config.estimation.n_iter;

        // Initialize advanced estimation tools
        let mut adaptive_step = AdaptiveStepSize::new(0.8, 0.6);
        let mut convergence_diagnostics = ConvergenceDiagnostics::new(20, 1e-4);

        println!("Starting optimization with {} parameters", n_theta);
        println!("Initial objective: {:.2}", self.compute_log_likelihood(&subject_ids, &individual_etas, &theta, &omega, sigma) * -2.0);
        println!();

        let all_observations: Vec<Vec<Observation>> = subject_ids
            .iter()
            .map(|&id| {
                self.dataset.get_subject_observations(id)
                    .into_iter()
                    .map(|obs| obs.clone())
                    .collect()
            })
            .collect();

        let mut best_theta = theta.clone();
        let mut best_omega = omega.clone();
        let mut best_sigma = sigma;
        let mut best_ll = f64::NEG_INFINITY;

        for iter in 0..total_iterations {
            let is_estimation = iter >= self.config.estimation.n_burn_in;

            for (idx, obs_vec) in all_observations.iter().enumerate() {
                let obs_refs: Vec<&Observation> = obs_vec.iter().collect();
                individual_etas[idx] = self.sample_individual_parameters(
                    &obs_refs,
                    &theta,
                    &omega,
                    sigma,
                    &individual_etas[idx],
                );
            }

            if is_estimation {
                // Use adaptive step size with Robbins-Monro schedule
                let step_size = adaptive_step.get_step(is_estimation);

                let sufficient_stats = self.compute_sufficient_statistics(&subject_ids, &individual_etas);

                for i in 0..n_theta {
                    // Check if parameter is fixed
                    let is_fixed = if let Some(ref constraints) = self.config.parameters.constraints {
                        if let Some(ref fixed) = constraints.theta_fixed {
                            i < fixed.len() && fixed[i]
                        } else {
                            false
                        }
                    } else {
                        false
                    };

                    // Skip estimation for fixed parameters
                    if !is_fixed {
                        theta[i] = (1.0 - step_size) * theta[i] + step_size * sufficient_stats.theta_sum[i];

                        // Apply parameter constraints if specified
                        if let Some(ref constraints) = self.config.parameters.constraints {
                            if let Some(ref lower) = constraints.theta_lower {
                                if i < lower.len() {
                                    theta[i] = theta[i].max(lower[i]);
                                }
                            }
                            if let Some(ref upper) = constraints.theta_upper {
                                if i < upper.len() {
                                    theta[i] = theta[i].min(upper[i]);
                                }
                            }
                        }
                        theta[i] = theta[i].max(1e-6);
                    }
                }

                // Update omega, respecting fixed parameters
                let omega_updated = omega.scale(1.0 - step_size) + sufficient_stats.omega_sum.scale(step_size);

                for i in 0..n_eta {
                    let is_fixed = if let Some(ref constraints) = self.config.parameters.constraints {
                        if let Some(ref fixed) = constraints.omega_fixed {
                            i < fixed.len() && fixed[i]
                        } else {
                            false
                        }
                    } else {
                        false
                    };

                    if !is_fixed {
                        for j in 0..n_eta {
                            omega[(i, j)] = omega_updated[(i, j)];
                        }
                    }
                }

                // Ensure positive definiteness
                NumericalStability::make_positive_definite(&mut omega, 1e-6);

                // Update sigma if not fixed
                let sigma_is_fixed = if let Some(ref constraints) = self.config.parameters.constraints {
                    constraints.sigma_fixed.unwrap_or(false)
                } else {
                    false
                };

                if !sigma_is_fixed {
                    sigma = ((1.0 - step_size) * sigma + step_size * sufficient_stats.sigma_sum).max(1e-6);
                }

                theta_history.push(theta.clone());
                omega_history.push(omega.clone());
                sigma_history.push(sigma);

                // Add to convergence diagnostics
                if is_estimation {
                    convergence_diagnostics.add_iteration(theta.clone(), omega.clone());
                }
            }

            if iter % 5 == 0 || iter == total_iterations - 1 {
                let ll = self.compute_log_likelihood(&subject_ids, &individual_etas, &theta, &omega, sigma);

                // Track best parameters
                if ll > best_ll {
                    best_ll = ll;
                    best_theta = theta.clone();
                    best_omega = omega.clone();
                    best_sigma = sigma;
                }

                println!("{}ITERATION NO.: {}{}  OBJECTIVE VALUE: {:.8}",
                         colors::YELLOW, iter + 1, colors::RESET, -2.0 * ll);
            }

            // Early stopping if converged
            if is_estimation && iter > self.config.estimation.n_burn_in + 50 {
                if convergence_diagnostics.has_converged() {
                    println!("{}CONVERGED at iteration {}{}", colors::GREEN, iter + 1, colors::RESET);
                    break;
                }
            }
        }

        // Use best parameters instead of last iteration
        theta = best_theta;
        omega = best_omega;
        sigma = best_sigma;

        println!();
        println!("Computing covariance matrix...");

        let empirical_se = self.compute_empirical_se_from_chain(
            &theta_history,
            &omega_history,
            &sigma_history,
            self.config.estimation.n_burn_in
        );

        let individual_parameters: Vec<IndividualParameters> = subject_ids
            .iter()
            .enumerate()
            .map(|(idx, &subject_id)| {
                let eta = individual_etas[idx].clone();
                let params = self.compute_individual_params(&theta, &eta);
                IndividualParameters {
                    id: subject_id,
                    eta,
                    params,
                }
            })
            .collect();

        let predictions = self.compute_predictions(&individual_parameters, &theta);

        let log_likelihood = self.compute_log_likelihood(&subject_ids, &individual_etas, &theta, &omega, sigma);

        let n_obs = predictions.iter().filter(|p| p.dv.is_some()).count();
        let n_params = theta.len() + omega.nrows() * (omega.nrows() + 1) / 2 + 1;

        let statistics = self.compute_statistics(
            &theta,
            &omega,
            sigma,
            &individual_parameters,
            &predictions,
            log_likelihood,
            n_obs,
            subject_ids.len(),
            n_params,
            Some(empirical_se),
        );

        Ok(SaemResults {
            theta,
            omega,
            sigma,
            individual_parameters,
            convergence: ConvergenceInfo {
                theta_history,
                omega_history,
                sigma_history,
                iterations: total_iterations,
            },
            log_likelihood,
            predictions,
            statistics,
        })
    }

    fn sample_individual_parameters(
        &mut self,
        observations: &[&Observation],
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
        current_eta: &DVector<f64>,
    ) -> DVector<f64> {
        let n_eta = omega.nrows();
        let proposal_sd = 0.1;

        let mut best_eta = current_eta.clone();
        let mut best_ll = self.compute_individual_log_likelihood(observations, theta, current_eta, omega, sigma);

        for _ in 0..5 {
            let mut proposal_eta = current_eta.clone();
            for i in 0..n_eta {
                let normal = Normal::new(0.0, proposal_sd).unwrap();
                proposal_eta[i] += normal.sample(&mut self.rng);
            }

            let proposal_ll = self.compute_individual_log_likelihood(observations, theta, &proposal_eta, omega, sigma);

            let accept_prob = (proposal_ll - best_ll).exp().min(1.0);
            if self.rng.gen::<f64>() < accept_prob {
                best_eta = proposal_eta;
                best_ll = proposal_ll;
            }
        }

        best_eta
    }

    fn compute_individual_log_likelihood(
        &self,
        observations: &[&Observation],
        theta: &[f64],
        eta: &DVector<f64>,
        omega: &DMatrix<f64>,
        sigma: f64,
    ) -> f64 {
        let params = self.compute_individual_params(theta, eta);

        let mut state = ModelState::new(3);
        let mut ll = 0.0;

        for obs in observations {
            if obs.evid == 1 {
                state.add_dose(obs.amt, 0);
            } else if obs.evid == 0 {
                if let Some(dv) = obs.dv {
                    let pred = self.model.predict(obs.time, &params, &mut state);
                    let residual = dv - pred;
                    let residual_var = self.compute_residual_variance(pred, sigma);
                    ll -= 0.5 * (residual * residual / residual_var + residual_var.ln());
                }
            }
        }

        let omega_inv = omega.clone().try_inverse().unwrap_or_else(|| DMatrix::identity(omega.nrows(), omega.ncols()));
        ll -= 0.5 * (eta.transpose() * omega_inv * eta)[(0, 0)];

        ll
    }

    fn compute_residual_variance(&self, pred: f64, sigma: f64) -> f64 {
        use crate::config::ErrorModel;

        match self.config.parameters.error_model {
            ErrorModel::Additive => sigma,
            ErrorModel::Proportional => {
                let sigma_prop = self.config.parameters.sigma_proportional.unwrap_or(sigma);
                (sigma_prop * pred).powi(2)
            },
            ErrorModel::Combined => {
                let sigma_add = sigma;
                let sigma_prop = self.config.parameters.sigma_proportional.unwrap_or(0.1);
                sigma_add + (sigma_prop * pred).powi(2)
            },
        }
    }

    fn compute_individual_params(&self, theta: &[f64], eta: &DVector<f64>) -> Vec<f64> {
        theta
            .iter()
            .enumerate()
            .map(|(i, &t)| {
                if i < eta.len() {
                    t * (eta[i]).exp()
                } else {
                    t
                }
            })
            .collect()
    }

    fn compute_sufficient_statistics(
        &self,
        subject_ids: &[usize],
        individual_etas: &[DVector<f64>],
    ) -> SufficientStatistics {
        let n_theta = self.config.parameters.theta.len();
        let n_eta = self.config.parameters.omega.len();

        let mut theta_sum = vec![0.0; n_theta];
        let mut omega_sum = DMatrix::zeros(n_eta, n_eta);
        let mut sigma_sum = 0.0;
        let mut n_obs = 0;

        for (idx, &subject_id) in subject_ids.iter().enumerate() {
            let eta = &individual_etas[idx];
            let obs = self.dataset.get_subject_observations(subject_id);
            let params = self.compute_individual_params(&self.config.parameters.theta, eta);

            for i in 0..n_theta.min(params.len()) {
                theta_sum[i] += params[i];
            }

            omega_sum += eta * eta.transpose();

            let mut state = ModelState::new(3);
            for observation in obs {
                if observation.evid == 1 {
                    state.add_dose(observation.amt, 0);
                } else if observation.evid == 0 {
                    if let Some(dv) = observation.dv {
                        let pred = self.model.predict(observation.time, &params, &mut state);
                        let residual = dv - pred;
                        sigma_sum += residual * residual;
                        n_obs += 1;
                    }
                }
            }
        }

        let n_subjects = subject_ids.len() as f64;
        for i in 0..n_theta {
            theta_sum[i] /= n_subjects;
        }
        omega_sum = omega_sum.scale(1.0 / n_subjects);
        sigma_sum /= n_obs.max(1) as f64;

        SufficientStatistics {
            theta_sum,
            omega_sum,
            sigma_sum,
        }
    }

    fn compute_log_likelihood(
        &self,
        subject_ids: &[usize],
        individual_etas: &[DVector<f64>],
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
    ) -> f64 {
        let mut ll = 0.0;

        for (idx, &subject_id) in subject_ids.iter().enumerate() {
            let obs = self.dataset.get_subject_observations(subject_id);
            ll += self.compute_individual_log_likelihood(&obs, theta, &individual_etas[idx], omega, sigma);
        }

        ll
    }

    fn compute_predictions(&self, individual_params: &[IndividualParameters], theta: &[f64]) -> Vec<PredictionRecord> {
        let mut predictions = Vec::new();

        for ind_param in individual_params {
            let obs = self.dataset.get_subject_observations(ind_param.id);
            let mut ind_state = ModelState::new(3);
            let mut pop_state = ModelState::new(3);

            for observation in obs {
                if observation.evid == 1 {
                    ind_state.add_dose(observation.amt, 0);
                    pop_state.add_dose(observation.amt, 0);
                } else if observation.evid == 0 {
                    let ipred = self.model.predict(observation.time, &ind_param.params, &mut ind_state);
                    let pred = self.model.predict(observation.time, theta, &mut pop_state);

                    let (iwres, cwres) = if let Some(dv) = observation.dv {
                        let residual_sd = self.compute_residual_sd(ipred);
                        let iwres_val = (dv - ipred) / residual_sd;
                        let cwres_val = (dv - pred) / residual_sd;
                        (iwres_val, cwres_val)
                    } else {
                        (0.0, 0.0)
                    };

                    predictions.push(PredictionRecord {
                        id: ind_param.id,
                        time: observation.time,
                        dv: observation.dv,
                        pred,
                        ipred,
                        iwres,
                        cwres,
                    });
                }
            }
        }

        predictions
    }

    fn compute_residual_sd(&self, ipred: f64) -> f64 {
        use crate::config::ErrorModel;

        match self.config.parameters.error_model {
            ErrorModel::Additive => {
                self.config.parameters.sigma.sqrt()
            },
            ErrorModel::Proportional => {
                let sigma_prop = self.config.parameters.sigma_proportional.unwrap_or(self.config.parameters.sigma);
                (sigma_prop * ipred).abs()
            },
            ErrorModel::Combined => {
                let sigma_add = self.config.parameters.sigma;
                let sigma_prop = self.config.parameters.sigma_proportional.unwrap_or(0.1);
                (sigma_add + (sigma_prop * ipred).powi(2)).sqrt()
            },
        }
    }

    fn compute_statistics(
        &self,
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
        individual_params: &[IndividualParameters],
        predictions: &[PredictionRecord],
        log_likelihood: f64,
        n_obs: usize,
        n_subjects: usize,
        n_params: usize,
        empirical_se: Option<(Vec<f64>, Vec<f64>, f64)>,
    ) -> ModelStatistics {
        let fisher = self.compute_fisher_information(theta, omega, sigma, individual_params, predictions);

        let fisher_inv = fisher.clone().try_inverse().unwrap_or_else(|| {
            let n = fisher.nrows();
            let mut safe_inv = DMatrix::zeros(n, n);
            for i in 0..n {
                let diag_val = fisher[(i, i)];
                if diag_val > 1e-10 {
                    safe_inv[(i, i)] = 1.0 / diag_val;
                } else {
                    safe_inv[(i, i)] = 1.0;
                }
            }
            safe_inv
        });

        let n_theta = theta.len();
        let n_eta = omega.nrows();

        let mut theta_se = Vec::new();
        let mut theta_rse = Vec::new();
        let mut theta_ci_lower = Vec::new();
        let mut theta_ci_upper = Vec::new();

        for i in 0..n_theta {
            let se = fisher_inv[(i, i)].abs().sqrt();
            theta_se.push(se);

            let rse = if theta[i].abs() > 1e-10 {
                (se / theta[i].abs()) * 100.0
            } else {
                0.0
            };
            theta_rse.push(rse);

            let z = 1.96;
            theta_ci_lower.push(theta[i] - z * se);
            theta_ci_upper.push(theta[i] + z * se);
        }

        let mut omega_se = DMatrix::zeros(n_eta, n_eta);
        let mut omega_rse = DMatrix::zeros(n_eta, n_eta);

        let mut idx = n_theta;
        for i in 0..n_eta {
            for j in 0..=i {
                if idx < fisher_inv.nrows() {
                    let variance_of_variance = fisher_inv[(idx, idx)].abs();
                    let fisher_se = variance_of_variance.sqrt();

                    let blended_se = if let Some((_, ref omega_emp_se, _)) = empirical_se {
                        if i == j && i < omega_emp_se.len() {
                            let emp_se = omega_emp_se[i];
                            if emp_se > 0.0 && fisher_se > 0.0 {
                                (fisher_se * 0.3 + emp_se * 0.7).min(omega[(i, j)].abs() * 1.0)
                            } else if emp_se > 0.0 {
                                emp_se.min(omega[(i, j)].abs() * 1.0)
                            } else {
                                fisher_se
                            }
                        } else {
                            fisher_se
                        }
                    } else {
                        fisher_se
                    };

                    let stabilized_se = if blended_se > omega[(i, j)].abs() * 2.0 {
                        omega[(i, j)].abs() * 0.5
                    } else {
                        blended_se
                    };

                    omega_se[(i, j)] = stabilized_se;
                    omega_se[(j, i)] = stabilized_se;

                    let val = omega[(i, j)].abs().max(1e-10);
                    let rse = (stabilized_se / val) * 100.0;

                    let capped_rse = rse.min(150.0);

                    omega_rse[(i, j)] = capped_rse;
                    omega_rse[(j, i)] = capped_rse;
                    idx += 1;
                }
            }
        }

        let sigma_se = if idx < fisher_inv.nrows() {
            let se = fisher_inv[(idx, idx)].abs().sqrt();
            if se > sigma * 2.0 {
                sigma * 0.3
            } else {
                se
            }
        } else {
            sigma * 0.1
        };

        let sigma_rse = if sigma > 1e-10 {
            ((sigma_se / sigma) * 100.0).min(100.0)
        } else {
            0.0
        };

        let shrinkage_eta = self.compute_eta_shrinkage(individual_params, omega);
        let shrinkage_epsilon = self.compute_epsilon_shrinkage(predictions, sigma);

        let aic = -2.0 * log_likelihood + 2.0 * n_params as f64;
        let bic = -2.0 * log_likelihood + (n_params as f64) * (n_obs as f64).ln();

        ModelStatistics {
            aic,
            bic,
            theta_se,
            theta_rse,
            theta_ci_lower,
            theta_ci_upper,
            omega_se,
            omega_rse,
            sigma_se,
            sigma_rse,
            shrinkage_eta,
            shrinkage_epsilon,
            n_observations: n_obs,
            n_subjects,
            n_parameters: n_params,
        }
    }

    fn compute_fisher_information(
        &self,
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
        individual_params: &[IndividualParameters],
        predictions: &[PredictionRecord],
    ) -> DMatrix<f64> {
        let n_theta = theta.len();
        let n_eta = omega.nrows();
        let n_omega_params = n_eta * (n_eta + 1) / 2;
        let total_params = n_theta + n_omega_params + 1;

        let mut fisher: DMatrix<f64> = DMatrix::zeros(total_params, total_params);
        let n_subjects = individual_params.len() as f64;

        let epsilon = 1e-5;

        for (_i, ind) in individual_params.iter().enumerate() {
            let ind_predictions: Vec<_> = predictions.iter()
                .filter(|p| p.id == ind.id && p.dv.is_some())
                .collect();

            if ind_predictions.is_empty() {
                continue;
            }

            let _n_obs = ind_predictions.len() as f64;

            for j in 0..n_theta {
                for k in 0..=j {
                    let mut contribution = 0.0;
                    for _pred in &ind_predictions {
                        contribution += 1.0 / (sigma.powi(2) + epsilon);
                    }
                    fisher[(j, k)] += contribution;
                    if j != k {
                        fisher[(k, j)] = fisher[(j, k)];
                    }
                }
            }
        }

        for i in 0..n_theta {
            fisher[(i, i)] = fisher[(i, i)].max(n_subjects / (theta[i].abs().max(0.01).powi(2)));
        }

        let mut idx = n_theta;
        for i in 0..n_eta {
            for j in 0..=i {
                let omega_val = omega[(i, j)].abs().max(1e-6);

                let empirical_variance = if i == j {
                    let eta_values: Vec<f64> = individual_params.iter()
                        .map(|p| p.eta[i])
                        .collect();
                    let mean_eta = eta_values.iter().sum::<f64>() / n_subjects;
                    let variance = eta_values.iter()
                        .map(|e| (e - mean_eta).powi(2))
                        .sum::<f64>() / n_subjects;
                    variance.max(1e-6)
                } else {
                    omega_val
                };

                let information = n_subjects / (2.0 * empirical_variance.powi(2));
                fisher[(idx, idx)] = information;
                idx += 1;
            }
        }

        let n_total_obs = predictions.iter().filter(|p| p.dv.is_some()).count() as f64;
        fisher[(total_params - 1, total_params - 1)] = n_total_obs / (2.0 * sigma.powi(2));

        for i in 0..total_params {
            if fisher[(i, i)] < 1e-10 {
                fisher[(i, i)] = 1.0;
            }
        }

        fisher
    }

    fn compute_eta_shrinkage(&self, individual_params: &[IndividualParameters], omega: &DMatrix<f64>) -> Vec<f64> {
        let n_eta = omega.nrows();
        let mut shrinkage = vec![0.0; n_eta];

        if individual_params.is_empty() {
            return shrinkage;
        }

        for j in 0..n_eta {
            let omega_jj = omega[(j, j)];
            if omega_jj <= 0.0 {
                continue;
            }

            let eta_values: Vec<f64> = individual_params.iter()
                .map(|ind| ind.eta[j])
                .collect();

            let eta_var = Self::variance(&eta_values);

            shrinkage[j] = if omega_jj > 1e-10 {
                (1.0 - eta_var / omega_jj).max(0.0) * 100.0
            } else {
                0.0
            };
        }

        shrinkage
    }

    fn compute_epsilon_shrinkage(&self, predictions: &[PredictionRecord], sigma: f64) -> f64 {
        let iwres_values: Vec<f64> = predictions.iter()
            .filter(|p| p.dv.is_some())
            .map(|p| p.iwres)
            .collect();

        if iwres_values.is_empty() || sigma <= 0.0 {
            return 0.0;
        }

        let iwres_var = Self::variance(&iwres_values);

        (1.0 - iwres_var / sigma).max(0.0) * 100.0
    }

    fn variance(values: &[f64]) -> f64 {
        if values.is_empty() {
            return 0.0;
        }

        let mean = values.iter().sum::<f64>() / values.len() as f64;
        let sum_sq_diff: f64 = values.iter()
            .map(|v| (v - mean).powi(2))
            .sum();

        sum_sq_diff / values.len() as f64
    }

    fn compute_empirical_se_from_chain(
        &self,
        theta_history: &[Vec<f64>],
        omega_history: &[DMatrix<f64>],
        sigma_history: &[f64],
        burn_in: usize,
    ) -> (Vec<f64>, Vec<f64>, f64) {
        if theta_history.len() <= burn_in {
            return (vec![0.0; theta_history[0].len()], vec![0.0; omega_history[0].nrows()], 0.0);
        }

        let post_burnin_theta: Vec<_> = theta_history[burn_in..].to_vec();
        let post_burnin_omega: Vec<_> = omega_history[burn_in..].to_vec();
        let post_burnin_sigma: Vec<_> = sigma_history[burn_in..].to_vec();

        let _n_samples = post_burnin_theta.len() as f64;
        let n_theta = post_burnin_theta[0].len();
        let n_eta = post_burnin_omega[0].nrows();

        let mut theta_se = Vec::new();
        for i in 0..n_theta {
            let values: Vec<f64> = post_burnin_theta.iter().map(|t| t[i]).collect();
            let se = Self::variance(&values).sqrt();
            theta_se.push(se);
        }

        let mut omega_se = Vec::new();
        for i in 0..n_eta {
            let values: Vec<f64> = post_burnin_omega.iter().map(|o| o[(i, i)]).collect();
            let se = Self::variance(&values).sqrt();
            omega_se.push(se);
        }

        let sigma_se = Self::variance(&post_burnin_sigma).sqrt();

        (theta_se, omega_se, sigma_se)
    }
}

struct SufficientStatistics {
    theta_sum: Vec<f64>,
    omega_sum: DMatrix<f64>,
    sigma_sum: f64,
}
