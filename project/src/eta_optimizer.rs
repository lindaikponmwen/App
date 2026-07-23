use nalgebra::{DMatrix, DVector};
use crate::dataset::Observation;
use crate::models::{PharmacokineticModel, ModelState};

const MAX_ETA_ITERATIONS: usize = 100;
const ETA_CONVERGENCE_TOL: f64 = 1e-6;
const EPSILON: f64 = 1e-5;

pub struct EtaOptimizer<'a> {
    model: &'a dyn PharmacokineticModel,
    observations: Vec<&'a Observation>,
    theta: &'a [f64],
    omega_inv: DMatrix<f64>,
    sigma: f64,
}

impl<'a> EtaOptimizer<'a> {
    pub fn new(
        model: &'a dyn PharmacokineticModel,
        observations: Vec<&'a Observation>,
        theta: &'a [f64],
        omega: &DMatrix<f64>,
        sigma: f64,
    ) -> Self {
        let omega_inv = omega.clone().try_inverse().unwrap_or_else(|| {
            let n = omega.nrows();
            let mut inv = DMatrix::zeros(n, n);
            for i in 0..n {
                let val = omega[(i, i)];
                inv[(i, i)] = if val > 1e-10 { 1.0 / val } else { 1.0 };
            }
            inv
        });

        Self {
            model,
            observations,
            theta,
            omega_inv,
            sigma,
        }
    }

    pub fn optimize(&self, initial_eta: &DVector<f64>) -> DVector<f64> {
        let mut eta = initial_eta.clone();

        for iter in 0..MAX_ETA_ITERATIONS {
            let gradient = self.compute_gradient(&eta);
            let hessian = self.compute_hessian(&eta);

            let hessian_inv = match hessian.clone().try_inverse() {
                Some(inv) => inv,
                None => {
                    let n = hessian.nrows();
                    let mut diag_inv = DMatrix::zeros(n, n);
                    for i in 0..n {
                        if hessian[(i, i)].abs() > 1e-10 {
                            diag_inv[(i, i)] = 1.0 / hessian[(i, i)];
                        } else {
                            diag_inv[(i, i)] = 1.0;
                        }
                    }
                    diag_inv
                }
            };

            let delta = &hessian_inv * &gradient;

            let step_size = self.line_search(&eta, &delta);
            eta = &eta - delta.scale(step_size);

            if delta.norm() < ETA_CONVERGENCE_TOL {
                break;
            }

            if iter == MAX_ETA_ITERATIONS - 1 {
                eprintln!("Warning: ETA optimization did not converge");
            }
        }

        eta
    }

    fn compute_gradient(&self, eta: &DVector<f64>) -> DVector<f64> {
        let n_eta = eta.len();
        let mut gradient = DVector::zeros(n_eta);

        let params = self.compute_params(self.theta, eta);
        let predictions = self.compute_predictions(&params);

        for j in 0..n_eta {
            let mut eta_plus = eta.clone();
            eta_plus[j] += EPSILON;
            let params_plus = self.compute_params(self.theta, &eta_plus);
            let predictions_plus = self.compute_predictions(&params_plus);

            let mut dpred_deta = 0.0;
            for (idx, obs) in self.observations.iter().enumerate() {
                if let Some(dv) = obs.dv {
                    if idx < predictions.len() && idx < predictions_plus.len() {
                        let pred = predictions[idx];
                        let pred_plus = predictions_plus[idx];
                        let residual = dv - pred;
                        let d_pred = (pred_plus - pred) / EPSILON;

                        let variance = self.compute_residual_variance(pred);
                        dpred_deta += residual * d_pred / variance;
                    }
                }
            }

            gradient[j] = dpred_deta - (self.omega_inv.row(j).dot(eta));
        }

        gradient
    }

    fn compute_hessian(&self, eta: &DVector<f64>) -> DMatrix<f64> {
        let n_eta = eta.len();
        let mut hessian = DMatrix::zeros(n_eta, n_eta);

        let params = self.compute_params(self.theta, eta);
        let predictions = self.compute_predictions(&params);

        for i in 0..n_eta {
            for j in 0..=i {
                let mut contrib = 0.0;

                for (idx, obs) in self.observations.iter().enumerate() {
                    if obs.dv.is_some() && idx < predictions.len() {
                        let pred = predictions[idx];

                        let mut eta_i = eta.clone();
                        eta_i[i] += EPSILON;
                        let params_i = self.compute_params(self.theta, &eta_i);
                        let preds_i = self.compute_predictions(&params_i);

                        let mut eta_j = eta.clone();
                        eta_j[j] += EPSILON;
                        let params_j = self.compute_params(self.theta, &eta_j);
                        let preds_j = self.compute_predictions(&params_j);

                        if idx < preds_i.len() && idx < preds_j.len() {
                            let di = (preds_i[idx] - pred) / EPSILON;
                            let dj = (preds_j[idx] - pred) / EPSILON;

                            let variance = self.compute_residual_variance(pred);
                            contrib += di * dj / variance;
                        }
                    }
                }

                hessian[(i, j)] = contrib + self.omega_inv[(i, j)];
                if i != j {
                    hessian[(j, i)] = hessian[(i, j)];
                }
            }
        }

        hessian
    }

    fn line_search(&self, eta: &DVector<f64>, direction: &DVector<f64>) -> f64 {
        let current_obj = self.objective_function(eta);

        let alphas = vec![1.0, 0.5, 0.25, 0.1, 0.01];

        for &alpha in &alphas {
            let new_eta = eta - direction.scale(alpha);
            let new_obj = self.objective_function(&new_eta);

            if new_obj < current_obj {
                return alpha;
            }
        }

        0.01
    }

    fn objective_function(&self, eta: &DVector<f64>) -> f64 {
        let params = self.compute_params(self.theta, eta);
        let predictions = self.compute_predictions(&params);

        let mut obj = 0.0;

        for (idx, obs) in self.observations.iter().enumerate() {
            if let Some(dv) = obs.dv {
                if idx < predictions.len() {
                    let pred = predictions[idx];
                    let residual = dv - pred;
                    let variance = self.compute_residual_variance(pred);
                    obj += residual.powi(2) / variance;
                }
            }
        }

        let penalty = eta.transpose() * &self.omega_inv * eta;
        obj += penalty[(0, 0)];

        obj
    }

    fn compute_params(&self, theta: &[f64], eta: &DVector<f64>) -> Vec<f64> {
        theta.iter()
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

    fn compute_predictions(&self, params: &[f64]) -> Vec<f64> {
        let mut state = ModelState::new(3);
        let mut predictions = Vec::new();

        for obs in &self.observations {
            if obs.evid == 1 {
                state.add_dose(obs.amt, 0);
            } else if obs.evid == 0 {
                let pred = self.model.predict(obs.time, params, &mut state);
                predictions.push(pred);
            }
        }

        predictions
    }

    fn compute_residual_variance(&self, _pred: f64) -> f64 {
        self.sigma.max(1e-6)
    }

    pub fn compute_conditional_hessian(&self, eta: &DVector<f64>) -> DMatrix<f64> {
        self.compute_hessian(eta)
    }
}
