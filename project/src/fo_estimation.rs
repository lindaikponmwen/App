use crate::config::Config;
use crate::dataset::{Dataset, Observation};
use crate::models::{create_model_from_config, PharmacokineticModel, ModelState};
use crate::saem::{SaemResults, ModelStatistics, IndividualParameters, ConvergenceInfo, PredictionRecord};
use crate::colors;
use nalgebra::{DMatrix, DVector};

const EPSILON: f64 = 1e-5;
const MAX_ITERATIONS: usize = 200;
const CONVERGENCE_TOLERANCE: f64 = 1e-4;
const MIN_OMEGA: f64 = 1e-4;
const MIN_SIGMA: f64 = 1e-4;

pub struct FoEstimator {
    config: Config,
    dataset: Dataset,
    model: Box<dyn PharmacokineticModel>,
}

impl FoEstimator {
    pub fn new(config: Config, dataset: Dataset) -> Self {
        let model = create_model_from_config(&config.model);
        Self {
            config,
            dataset,
            model,
        }
    }

    pub fn estimate(&mut self) -> Result<SaemResults, Box<dyn std::error::Error>> {
        println!("\n{}═══════════════════════════════════════════════════════════════{}", colors::BLUE, colors::RESET);
        println!("{}  FIRST ORDER (FO) ESTIMATION METHOD{}", colors::BLUE, colors::RESET);
        println!("{}═══════════════════════════════════════════════════════════════{}", colors::BLUE, colors::RESET);
        println!("\n{}Algorithm:{} Linearizing around population mean (η = 0)", colors::GREEN, colors::RESET);
        println!("{}Objective Function:{} -2LL = Σ[log|V_i| + (Y_i - μ_i)^T V_i^{{-1}} (Y_i - μ_i)]", colors::GREEN, colors::RESET);
        println!();

        let mut theta = self.config.parameters.theta.clone();
        let mut omega = DMatrix::from_row_slice(
            self.config.parameters.omega.len(),
            self.config.parameters.omega.len(),
            &self.config.parameters.omega.iter().flatten().copied().collect::<Vec<_>>(),
        );
        let mut sigma = self.config.parameters.sigma;

        let mut theta_history = Vec::new();
        let mut omega_history = Vec::new();
        let mut sigma_history = Vec::new();
        let mut ofv_history = Vec::new();

        let n_iter = self.config.estimation.n_iter.min(MAX_ITERATIONS);
        let mut prev_ofv = f64::INFINITY;
        let mut best_ofv = f64::INFINITY;
        let mut best_theta = theta.clone();
        let mut best_omega = omega.clone();
        let mut best_sigma = sigma;

        println!("{}Starting FO Estimation...{}\n", colors::YELLOW, colors::RESET);

        for iter in 0..n_iter {
            theta_history.push(theta.clone());
            omega_history.push(omega.clone());
            sigma_history.push(sigma);

            let (new_theta, new_omega, new_sigma, ofv) = self.fo_iteration(&theta, &omega, sigma)?;

            ofv_history.push(ofv);

            if ofv < best_ofv {
                best_ofv = ofv;
                best_theta = new_theta.clone();
                best_omega = new_omega.clone();
                best_sigma = new_sigma;
            }

            if iter % 10 == 0 {
                println!("{}ITERATION {}: OFV = {:.2}{}", colors::YELLOW, iter + 1, ofv, colors::RESET);
            }

            let ofv_change = if prev_ofv.is_finite() {
                (prev_ofv - ofv).abs() / (prev_ofv.abs() + 1e-10)
            } else {
                1.0
            };

            theta = new_theta;
            omega = new_omega;
            sigma = new_sigma;
            prev_ofv = ofv;

            if iter > 20 && ofv_change < CONVERGENCE_TOLERANCE {
                println!("\n{}✓ Converged at iteration {}{}", colors::GREEN, iter + 1, colors::RESET);
                println!("{}  Final OFV: {:.2}{}\n", colors::GREEN, ofv, colors::RESET);
                break;
            }

            if iter == n_iter - 1 {
                println!("\n{}Maximum iterations reached{}", colors::YELLOW, colors::RESET);
                println!("{}  Final OFV: {:.2}{}\n", colors::YELLOW, ofv, colors::RESET);
            }
        }

        theta = best_theta;
        omega = best_omega;
        sigma = best_sigma;

        let individual_parameters = self.compute_individual_params(&theta, &omega, sigma);
        let predictions = self.compute_predictions(&individual_parameters, &theta);
        let log_likelihood = -0.5 * best_ofv;

        let n_obs = predictions.iter().filter(|p| p.dv.is_some()).count();
        let n_subjects = self.dataset.subject_ids().len();
        let n_params = theta.len() + (omega.nrows() * (omega.nrows() + 1)) / 2 + 1;

        let statistics = self.compute_statistics(
            &theta,
            &omega,
            sigma,
            &individual_parameters,
            &predictions,
            log_likelihood,
            n_obs,
            n_subjects,
            n_params,
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
                iterations: n_iter,
            },
            log_likelihood,
            predictions,
            statistics,
        })
    }

    fn fo_iteration(
        &self,
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
    ) -> Result<(Vec<f64>, DMatrix<f64>, f64, f64), Box<dyn std::error::Error>> {
        let subject_ids = self.dataset.subject_ids();
        let n_theta = theta.len();
        let n_eta = omega.nrows();

        let mut total_ofv = 0.0;
        let mut fim = DMatrix::zeros(n_theta, n_theta);
        let mut score = DVector::zeros(n_theta);

        let mut omega_sum = DMatrix::zeros(n_eta, n_eta);
        let mut sigma_sum = 0.0;
        let mut n_obs_total = 0;

        let eta_zero = DVector::zeros(n_eta);

        for &subject_id in &subject_ids {
            let observations = self.dataset.get_subject_observations(subject_id);

            let (y_i, mu_i) = self.compute_observations_and_predictions(&observations, theta, &eta_zero);

            if y_i.is_empty() {
                continue;
            }

            let h_i = self.compute_jacobian(&observations, theta, &eta_zero);

            let v_i = self.compute_variance_matrix(&h_i, omega, sigma, &mu_i);

            let v_inv = self.safe_inverse(&v_i);

            let residual = &y_i - &mu_i;

            let mahalanobis = residual.transpose() * &v_inv * &residual;
            let log_det = self.safe_log_det(&v_i);

            total_ofv += mahalanobis[(0, 0)] + log_det;

            for i in 0..n_theta {
                let dpred_i = self.compute_dpred_dtheta(&observations, theta, &eta_zero, i);
                let score_contrib = dpred_i.transpose() * &v_inv * &residual;
                score[i] += score_contrib[(0, 0)];

                for j in 0..=i {
                    let dpred_j = self.compute_dpred_dtheta(&observations, theta, &eta_zero, j);
                    let fim_contrib = dpred_i.transpose() * &v_inv * &dpred_j;
                    fim[(i, j)] += fim_contrib[(0, 0)];
                    if i != j {
                        fim[(j, i)] = fim[(i, j)];
                    }
                }
            }

            let empirical_eta = self.compute_empirical_eta(&observations, theta, omega, sigma);
            omega_sum += &empirical_eta * empirical_eta.transpose();

            for (idx, obs) in observations.iter().enumerate() {
                if let Some(dv) = obs.dv {
                    if idx < mu_i.len() {
                        let pred = mu_i[idx];
                        let res = dv - pred;
                        sigma_sum += res * res;
                        n_obs_total += 1;
                    }
                }
            }
        }

        let n_subjects = subject_ids.len() as f64;

        let fim_inv = self.safe_inverse(&fim);
        let step_size = 0.5;
        let delta_theta = &fim_inv * &score * step_size;

        let new_theta: Vec<f64> = theta.iter()
            .enumerate()
            .map(|(i, &t)| {
                let updated = t + delta_theta[i];
                if i < n_eta {
                    updated.max(1e-6)
                } else {
                    updated
                }
            })
            .collect();

        let new_omega = (omega_sum / n_subjects).map(|x| x.max(MIN_OMEGA));
        let new_omega = self.ensure_positive_definite(new_omega);

        let new_sigma = if n_obs_total > 0 {
            (sigma_sum / n_obs_total as f64).max(MIN_SIGMA)
        } else {
            sigma
        };

        Ok((new_theta, new_omega, new_sigma, total_ofv))
    }

    fn compute_observations_and_predictions(
        &self,
        observations: &[&Observation],
        theta: &[f64],
        eta: &DVector<f64>,
    ) -> (DVector<f64>, DVector<f64>) {
        let params = self.compute_params_from_eta(theta, eta);
        let mut state = ModelState::new(3);

        let mut y_vec = Vec::new();
        let mut pred_vec = Vec::new();

        for obs in observations {
            if obs.evid == 1 {
                state.add_dose(obs.amt, 0);
            } else if obs.evid == 0 {
                if let Some(dv) = obs.dv {
                    let pred = self.model.predict(obs.time, &params, &mut state);
                    y_vec.push(dv);
                    pred_vec.push(pred);
                }
            }
        }

        (DVector::from_vec(y_vec), DVector::from_vec(pred_vec))
    }

    fn compute_jacobian(
        &self,
        observations: &[&Observation],
        theta: &[f64],
        eta: &DVector<f64>,
    ) -> DMatrix<f64> {
        let n_eta = eta.len();
        let (_, base_pred) = self.compute_observations_and_predictions(observations, theta, eta);
        let n_obs = base_pred.len();

        if n_obs == 0 {
            return DMatrix::zeros(0, n_eta);
        }

        let mut jacobian = DMatrix::zeros(n_obs, n_eta);

        for j in 0..n_eta {
            let mut eta_plus = eta.clone();
            eta_plus[j] += EPSILON;
            let (_, pred_plus) = self.compute_observations_and_predictions(observations, theta, &eta_plus);

            for i in 0..n_obs.min(pred_plus.len()) {
                jacobian[(i, j)] = (pred_plus[i] - base_pred[i]) / EPSILON;
            }
        }

        jacobian
    }

    fn compute_variance_matrix(
        &self,
        h_i: &DMatrix<f64>,
        omega: &DMatrix<f64>,
        sigma: f64,
        predictions: &DVector<f64>,
    ) -> DMatrix<f64> {
        let n_obs = h_i.nrows();

        if n_obs == 0 {
            return DMatrix::zeros(1, 1);
        }

        let h_omega_ht = h_i * omega * h_i.transpose();

        let mut sigma_matrix = DMatrix::zeros(n_obs, n_obs);
        for i in 0..n_obs {
            let variance = if i < predictions.len() {
                self.compute_residual_variance(predictions[i], sigma)
            } else {
                sigma
            };
            sigma_matrix[(i, i)] = variance;
        }

        h_omega_ht + sigma_matrix
    }

    fn compute_dpred_dtheta(
        &self,
        observations: &[&Observation],
        theta: &[f64],
        eta: &DVector<f64>,
        theta_idx: usize,
    ) -> DVector<f64> {
        let (_, base_pred) = self.compute_observations_and_predictions(observations, theta, eta);

        let mut theta_plus = theta.to_vec();
        theta_plus[theta_idx] += EPSILON;
        let (_, pred_plus) = self.compute_observations_and_predictions(observations, &theta_plus, eta);

        let n = base_pred.len().min(pred_plus.len());
        let mut dpred = DVector::zeros(n);
        for i in 0..n {
            dpred[i] = (pred_plus[i] - base_pred[i]) / EPSILON;
        }

        dpred
    }

    fn compute_empirical_eta(
        &self,
        observations: &[&Observation],
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
    ) -> DVector<f64> {
        let n_eta = omega.nrows();
        let eta_zero = DVector::zeros(n_eta);

        let (y_i, mu_i) = self.compute_observations_and_predictions(observations, theta, &eta_zero);

        if y_i.is_empty() {
            return eta_zero;
        }

        let h_i = self.compute_jacobian(observations, theta, &eta_zero);
        let v_i = self.compute_variance_matrix(&h_i, omega, sigma, &mu_i);
        let v_inv = self.safe_inverse(&v_i);

        let residual = y_i - mu_i;

        let omega_ht_vinv = omega * h_i.transpose() * v_inv;
        omega_ht_vinv * residual
    }

    fn safe_inverse(&self, matrix: &DMatrix<f64>) -> DMatrix<f64> {
        if let Some(inv) = matrix.clone().try_inverse() {
            return inv;
        }

        let n = matrix.nrows();
        let mut regularized = matrix.clone();
        for i in 0..n {
            regularized[(i, i)] += 1e-6;
        }

        if let Some(inv) = regularized.try_inverse() {
            return inv;
        }

        let mut diag_inv = DMatrix::zeros(n, n);
        for i in 0..n {
            if matrix[(i, i)].abs() > 1e-10 {
                diag_inv[(i, i)] = 1.0 / matrix[(i, i)];
            } else {
                diag_inv[(i, i)] = 1.0;
            }
        }
        diag_inv
    }

    fn safe_log_det(&self, matrix: &DMatrix<f64>) -> f64 {
        let det = matrix.determinant();
        if det > 1e-10 {
            det.ln()
        } else {
            let n = matrix.nrows();
            let mut log_det = 0.0;
            for i in 0..n {
                let diag = matrix[(i, i)].max(1e-10);
                log_det += diag.ln();
            }
            log_det
        }
    }

    fn ensure_positive_definite(&self, mut matrix: DMatrix<f64>) -> DMatrix<f64> {
        let n = matrix.nrows();

        for i in 0..n {
            if matrix[(i, i)] < MIN_OMEGA {
                matrix[(i, i)] = MIN_OMEGA;
            }
        }

        for i in 0..n {
            for j in 0..i {
                let avg = (matrix[(i, j)] + matrix[(j, i)]) / 2.0;
                matrix[(i, j)] = avg;
                matrix[(j, i)] = avg;
            }
        }

        matrix
    }

    fn compute_params_from_eta(&self, theta: &[f64], eta: &DVector<f64>) -> Vec<f64> {
        theta
            .iter()
            .enumerate()
            .map(|(i, &t)| {
                if i < eta.len() {
                    t * eta[i].exp()
                } else {
                    t
                }
            })
            .collect()
    }

    fn compute_individual_params(
        &self,
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
    ) -> Vec<IndividualParameters> {
        let subject_ids = self.dataset.subject_ids();
        let mut individual_params = Vec::new();

        for &subject_id in &subject_ids {
            let observations = self.dataset.get_subject_observations(subject_id);
            let eta = self.compute_empirical_eta(&observations, theta, omega, sigma);
            let params = self.compute_params_from_eta(theta, &eta);

            individual_params.push(IndividualParameters {
                id: subject_id,
                eta,
                params,
            });
        }

        individual_params
    }

    fn compute_residual_variance(&self, pred: f64, sigma: f64) -> f64 {
        use crate::config::ErrorModel;

        match self.config.parameters.error_model {
            ErrorModel::Additive => sigma,
            ErrorModel::Proportional => {
                let sigma_prop = self.config.parameters.sigma_proportional.unwrap_or(sigma);
                (sigma_prop * pred).powi(2).max(MIN_SIGMA)
            },
            ErrorModel::Combined => {
                let sigma_add = sigma;
                let sigma_prop = self.config.parameters.sigma_proportional.unwrap_or(0.1);
                sigma_add + (sigma_prop * pred).powi(2)
            },
        }
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
                (sigma_prop * ipred).abs().max(MIN_SIGMA.sqrt())
            },
            ErrorModel::Combined => {
                let sigma_add = self.config.parameters.sigma;
                let sigma_prop = self.config.parameters.sigma_proportional.unwrap_or(0.1);
                (sigma_add + (sigma_prop * ipred).powi(2)).sqrt()
            },
        }
    }

    fn compute_log_likelihood(
        &self,
        individual_params: &[IndividualParameters],
        theta: &[f64],
        _omega: &DMatrix<f64>,
        sigma: f64,
    ) -> f64 {
        let mut ll = 0.0;

        for ind_param in individual_params {
            let obs = self.dataset.get_subject_observations(ind_param.id);
            let mut state = ModelState::new(3);

            for observation in obs {
                if observation.evid == 1 {
                    state.add_dose(observation.amt, 0);
                } else if observation.evid == 0 {
                    if let Some(dv) = observation.dv {
                        let pred = self.model.predict(observation.time, &ind_param.params, &mut state);
                        let residual = dv - pred;
                        let residual_var = self.compute_residual_variance(pred, sigma);
                        ll -= 0.5 * (residual * residual / residual_var + residual_var.ln() + (2.0 * std::f64::consts::PI).ln());
                    }
                }
            }
        }

        ll
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
    ) -> ModelStatistics {
        let n_theta = theta.len();
        let n_eta = omega.nrows();

        let subject_ids = self.dataset.subject_ids();
        let mut fim = DMatrix::zeros(n_theta, n_theta);
        let eta_zero = DVector::zeros(n_eta);

        for &subject_id in &subject_ids {
            let observations = self.dataset.get_subject_observations(subject_id);

            for i in 0..n_theta {
                for j in 0..=i {
                    let dpred_i = self.compute_dpred_dtheta(&observations, theta, &eta_zero, i);
                    let dpred_j = self.compute_dpred_dtheta(&observations, theta, &eta_zero, j);

                    let contrib = dpred_i.dot(&dpred_j) / sigma.max(1e-6);
                    fim[(i, j)] += contrib;
                    if i != j {
                        fim[(j, i)] = fim[(i, j)];
                    }
                }
            }
        }

        let fim_inv = self.safe_inverse(&fim);

        let mut theta_se = Vec::new();
        let mut theta_rse = Vec::new();
        let mut theta_ci_lower = Vec::new();
        let mut theta_ci_upper = Vec::new();

        for i in 0..n_theta {
            let se = fim_inv[(i, i)].abs().sqrt();
            theta_se.push(se);

            let rse = if theta[i].abs() > 1e-10 {
                (se / theta[i].abs()) * 100.0
            } else {
                0.0
            };
            theta_rse.push(rse);

            theta_ci_lower.push(theta[i] - 1.96 * se);
            theta_ci_upper.push(theta[i] + 1.96 * se);
        }

        let mut omega_se = DMatrix::zeros(n_eta, n_eta);
        let mut omega_rse = DMatrix::zeros(n_eta, n_eta);

        for i in 0..n_eta {
            let variance = omega[(i, i)];
            let se = (2.0 * variance.powi(2) / n_subjects as f64).sqrt();
            omega_se[(i, i)] = se;
            omega_rse[(i, i)] = if variance > 1e-10 {
                (se / variance) * 100.0
            } else {
                0.0
            };
        }

        let sigma_se = (2.0 * sigma.powi(2) / n_obs as f64).sqrt();
        let sigma_rse = if sigma > 1e-10 {
            (sigma_se / sigma) * 100.0
        } else {
            0.0
        };

        let mut shrinkage_eta = Vec::new();
        for i in 0..n_eta {
            let eta_var: f64 = individual_params.iter()
                .map(|ip| ip.eta[i].powi(2))
                .sum::<f64>() / individual_params.len() as f64;
            let shrinkage = (1.0 - eta_var / omega[(i, i)].max(1e-10)) * 100.0;
            shrinkage_eta.push(shrinkage.max(0.0).min(100.0));
        }

        let shrinkage_epsilon = 0.0;

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
}
