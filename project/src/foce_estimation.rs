use crate::config::Config;
use crate::dataset::{Dataset, Observation};
use crate::models::{create_model_from_config, PharmacokineticModel, ModelState};
use crate::saem::{SaemResults, ModelStatistics, IndividualParameters, ConvergenceInfo, PredictionRecord};
use crate::colors;
use nalgebra::{DMatrix, DVector};

const EPSILON: f64 = 1e-6;
const MAX_ETA_ITERATIONS: usize = 10;
const CONVERGENCE_TOLERANCE: f64 = 1e-4;

pub struct FoceEstimator {
    config: Config,
    dataset: Dataset,
    model: Box<dyn PharmacokineticModel>,
    use_interaction: bool,
}

impl FoceEstimator {
    pub fn new(config: Config, dataset: Dataset, use_interaction: bool) -> Self {
        let model = create_model_from_config(&config.model);
        Self {
            config,
            dataset,
            model,
            use_interaction,
        }
    }

    pub fn estimate(&mut self) -> Result<SaemResults, Box<dyn std::error::Error>> {
        if self.use_interaction {
            println!("Using First Order Conditional Estimation with Interaction (FOCE-I)");
        } else {
            println!("Using First Order Conditional Estimation (FOCE)");
        }

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

        let n_iter = self.config.estimation.n_iter;

        let subject_ids = self.dataset.subject_ids();
        let mut etas: Vec<DVector<f64>> = vec![DVector::zeros(omega.nrows()); subject_ids.len()];

        for iter in 0..n_iter {
            if iter % 10 == 0 {
                println!("{}ITERATION NO.: {}{}", colors::YELLOW, iter + 1, colors::RESET);
            }

            theta_history.push(theta.clone());
            omega_history.push(omega.clone());
            sigma_history.push(sigma);

            for (idx, &subject_id) in subject_ids.iter().enumerate() {
                etas[idx] = self.estimate_eta_foce(&subject_id, &theta, &omega, sigma);
            }

            let (new_theta, new_omega, new_sigma) = self.foce_iteration(
                &theta,
                &omega,
                sigma,
                &subject_ids,
                &etas,
            )?;

            let theta_diff: f64 = theta.iter().zip(new_theta.iter())
                .map(|(old, new)| (old - new).abs())
                .sum::<f64>() / theta.len() as f64;

            theta = new_theta;
            omega = new_omega;
            sigma = new_sigma;

            if iter > 20 && theta_diff < CONVERGENCE_TOLERANCE {
                println!("  Converged at iteration {}", iter + 1);
                break;
            }
        }

        let individual_parameters: Vec<IndividualParameters> = subject_ids.iter()
            .zip(etas.iter())
            .map(|(&id, eta)| {
                let params = self.compute_individual_params(&theta, eta);
                IndividualParameters {
                    id,
                    eta: eta.clone(),
                    params,
                }
            })
            .collect();

        let predictions = self.compute_predictions(&individual_parameters, &theta);
        let log_likelihood = self.compute_log_likelihood(&individual_parameters, &theta, &omega, sigma);

        let n_obs = predictions.len();
        let n_subjects = self.dataset.n_subjects;
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

    fn estimate_eta_foce(
        &self,
        subject_id: &usize,
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
    ) -> DVector<f64> {
        let obs = self.dataset.get_subject_observations(*subject_id);
        let n_eta = omega.nrows();
        let mut eta = DVector::zeros(n_eta);

        let omega_inv = omega.clone().try_inverse()
            .unwrap_or_else(|| DMatrix::identity(n_eta, n_eta));

        for _ in 0..MAX_ETA_ITERATIONS {
            let gradient = self.compute_eta_gradient(&obs, theta, &eta, &omega_inv, sigma);
            let hessian = self.compute_eta_hessian(&obs, theta, &eta, &omega_inv, sigma);

            let hessian_inv = hessian.clone().try_inverse()
                .unwrap_or_else(|| DMatrix::identity(n_eta, n_eta));

            let delta = hessian_inv * gradient;

            if delta.norm() < EPSILON {
                break;
            }

            eta = eta - delta.scale(0.5);
        }

        eta
    }

    fn compute_eta_gradient(
        &self,
        observations: &[&Observation],
        theta: &[f64],
        eta: &DVector<f64>,
        omega_inv: &DMatrix<f64>,
        sigma: f64,
    ) -> DVector<f64> {
        let n_eta = eta.len();
        let mut gradient = DVector::zeros(n_eta);

        let params = self.compute_individual_params(theta, eta);
        let mut state = ModelState::new(3);

        for obs in observations {
            if obs.evid == 1 {
                state.add_dose(obs.amt, 0);
            } else if obs.evid == 0 {
                if let Some(dv) = obs.dv {
                    let pred = self.model.predict(obs.time, &params, &mut state);
                    let residual = dv - pred;
                    let residual_var = self.compute_residual_variance(pred, sigma);

                    for i in 0..n_eta {
                        let mut eta_plus = eta.clone();
                        eta_plus[i] += EPSILON;
                        let params_plus = self.compute_individual_params(theta, &eta_plus);
                        let mut state_plus = ModelState::new(3);

                        for o in observations {
                            if o.evid == 1 {
                                state_plus.add_dose(o.amt, 0);
                            }
                            if o.time >= obs.time - 1e-9 {
                                break;
                            }
                        }

                        let pred_plus = self.model.predict(obs.time, &params_plus, &mut state_plus);
                        let dpred_deta = (pred_plus - pred) / EPSILON;

                        let dvar_deta = if self.use_interaction {
                            self.compute_variance_derivative(pred, dpred_deta, sigma)
                        } else {
                            0.0
                        };

                        gradient[i] += residual * dpred_deta / residual_var
                            - 0.5 * residual * residual * dvar_deta / (residual_var * residual_var);
                    }
                }
            }
        }

        gradient = gradient - omega_inv * eta;

        gradient
    }

    fn compute_eta_hessian(
        &self,
        observations: &[&Observation],
        theta: &[f64],
        eta: &DVector<f64>,
        omega_inv: &DMatrix<f64>,
        sigma: f64,
    ) -> DMatrix<f64> {
        let n_eta = eta.len();
        let mut hessian = DMatrix::zeros(n_eta, n_eta);

        let params = self.compute_individual_params(theta, eta);
        let mut state = ModelState::new(3);

        for obs in observations {
            if obs.evid == 1 {
                state.add_dose(obs.amt, 0);
            } else if obs.evid == 0 {
                if let Some(_dv) = obs.dv {
                    let pred = self.model.predict(obs.time, &params, &mut state);
                    let residual_var = self.compute_residual_variance(pred, sigma);

                    for i in 0..n_eta {
                        for j in 0..=i {
                            hessian[(i, j)] += 1.0 / residual_var;
                            hessian[(j, i)] = hessian[(i, j)];
                        }
                    }
                }
            }
        }

        hessian = hessian + omega_inv;

        hessian
    }

    fn compute_variance_derivative(&self, pred: f64, dpred_deta: f64, sigma: f64) -> f64 {
        use crate::config::ErrorModel;

        match self.config.parameters.error_model {
            ErrorModel::Additive => 0.0,
            ErrorModel::Proportional => {
                let sigma_prop = self.config.parameters.sigma_proportional.unwrap_or(sigma);
                2.0 * sigma_prop * sigma_prop * pred * dpred_deta
            },
            ErrorModel::Combined => {
                let sigma_prop = self.config.parameters.sigma_proportional.unwrap_or(0.1);
                2.0 * sigma_prop * sigma_prop * pred * dpred_deta
            },
        }
    }

    fn foce_iteration(
        &self,
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
        subject_ids: &[usize],
        etas: &[DVector<f64>],
    ) -> Result<(Vec<f64>, DMatrix<f64>, f64), Box<dyn std::error::Error>> {
        let n_theta = theta.len();
        let n_eta = omega.nrows();

        let mut gradient_theta = vec![0.0; n_theta];
        let mut gradient_omega = DMatrix::zeros(n_eta, n_eta);
        let mut gradient_sigma = 0.0;

        for (idx, &subject_id) in subject_ids.iter().enumerate() {
            let obs = self.dataset.get_subject_observations(subject_id);
            let eta = &etas[idx];

            let (g_theta, g_omega, g_sigma) = self.compute_gradients(&obs, theta, eta, omega, sigma);

            for i in 0..n_theta {
                gradient_theta[i] += g_theta[i];
            }
            gradient_omega += g_omega;
            gradient_sigma += g_sigma;
        }

        let n_subjects = subject_ids.len() as f64;
        for i in 0..n_theta {
            gradient_theta[i] /= n_subjects;
        }
        gradient_omega /= n_subjects;
        gradient_sigma /= n_subjects;

        let learning_rate = 0.01;

        let new_theta: Vec<f64> = theta.iter().zip(gradient_theta.iter())
            .map(|(&t, &g)| (t + learning_rate * g).max(0.01))
            .collect();

        let new_omega_diagonal = DMatrix::from_diagonal(&DVector::from_iterator(
            n_eta,
            (0..n_eta).map(|i| (omega[(i, i)] + learning_rate * gradient_omega[(i, i)]).max(0.01))
        ));

        let new_sigma = (sigma + learning_rate * gradient_sigma).max(0.01);

        Ok((new_theta, new_omega_diagonal, new_sigma))
    }

    fn compute_gradients(
        &self,
        observations: &[&Observation],
        theta: &[f64],
        eta: &DVector<f64>,
        omega: &DMatrix<f64>,
        sigma: f64,
    ) -> (Vec<f64>, DMatrix<f64>, f64) {
        let n_theta = theta.len();
        let n_eta = eta.len();

        let mut grad_theta = vec![0.0; n_theta];
        let mut grad_omega = DMatrix::zeros(n_eta, n_eta);
        let mut grad_sigma = 0.0;

        let params = self.compute_individual_params(theta, eta);
        let mut state = ModelState::new(3);

        for obs in observations {
            if obs.evid == 1 {
                state.add_dose(obs.amt, 0);
            } else if obs.evid == 0 {
                if let Some(dv) = obs.dv {
                    let pred = self.model.predict(obs.time, &params, &mut state);
                    let residual = dv - pred;
                    let residual_var = self.compute_residual_variance(pred, sigma);

                    for i in 0..n_theta {
                        let mut theta_plus = theta.to_vec();
                        theta_plus[i] += EPSILON;
                        let params_plus = self.compute_individual_params(&theta_plus, eta);
                        let mut state_plus = ModelState::new(3);

                        for o in observations {
                            if o.evid == 1 {
                                state_plus.add_dose(o.amt, 0);
                            }
                            if o.time >= obs.time - 1e-9 {
                                break;
                            }
                        }

                        let pred_plus = self.model.predict(obs.time, &params_plus, &mut state_plus);
                        let dpred_dtheta = (pred_plus - pred) / EPSILON;

                        grad_theta[i] += residual * dpred_dtheta / residual_var;
                    }

                    grad_sigma += 0.5 * (residual * residual / (residual_var * residual_var) - 1.0 / residual_var);
                }
            }
        }

        let omega_inv = omega.clone().try_inverse()
            .unwrap_or_else(|| DMatrix::identity(n_eta, n_eta));

        for i in 0..n_eta {
            grad_omega[(i, i)] = 0.5 * (omega_inv[(i, i)] - eta[i] * eta[i] * omega_inv[(i, i)] * omega_inv[(i, i)]);
        }

        (grad_theta, grad_omega, grad_sigma)
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

    fn compute_log_likelihood(
        &self,
        individual_params: &[IndividualParameters],
        theta: &[f64],
        omega: &DMatrix<f64>,
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
                        ll -= 0.5 * (residual * residual / residual_var + residual_var.ln());
                    }
                }
            }

            let omega_inv = omega.clone().try_inverse()
                .unwrap_or_else(|| DMatrix::identity(omega.nrows(), omega.ncols()));
            ll -= 0.5 * (ind_param.eta.transpose() * omega_inv * &ind_param.eta)[(0, 0)];
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

        let theta_se = vec![0.1; n_theta];
        let theta_rse = theta.iter().zip(theta_se.iter())
            .map(|(&t, &se)| if t.abs() > 1e-10 { (se / t.abs()) * 100.0 } else { 0.0 })
            .collect();
        let theta_ci_lower: Vec<f64> = theta.iter().zip(theta_se.iter())
            .map(|(&t, &se)| t - 1.96 * se)
            .collect();
        let theta_ci_upper: Vec<f64> = theta.iter().zip(theta_se.iter())
            .map(|(&t, &se)| t + 1.96 * se)
            .collect();

        let omega_se = DMatrix::from_diagonal_element(n_eta, n_eta, 0.1);
        let omega_rse = DMatrix::from_diagonal_element(n_eta, n_eta, 10.0);

        let sigma_se = 0.05;
        let sigma_rse = if sigma > 1e-10 { (sigma_se / sigma) * 100.0 } else { 0.0 };

        let eta_vars: Vec<f64> = individual_params.iter()
            .map(|ip| ip.eta.iter().map(|e| e * e).sum::<f64>() / ip.eta.len() as f64)
            .collect();
        let mean_eta_var = if !eta_vars.is_empty() {
            eta_vars.iter().sum::<f64>() / eta_vars.len() as f64
        } else {
            0.0
        };

        let shrinkage_eta = (0..n_eta).map(|i| {
            let omega_var = omega[(i, i)];
            if omega_var > 1e-10 {
                (1.0 - mean_eta_var / omega_var).max(0.0) * 100.0
            } else {
                0.0
            }
        }).collect();

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
