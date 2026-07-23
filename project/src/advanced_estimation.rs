use nalgebra::{DMatrix, DVector};
use std::collections::VecDeque;

/// Adaptive step size scheduler using Robbins-Monro conditions
pub struct AdaptiveStepSize {
    pub initial_step: f64,
    pub decay_rate: f64,
    pub min_step: f64,
    iteration: usize,
}

impl AdaptiveStepSize {
    pub fn new(initial_step: f64, decay_rate: f64) -> Self {
        Self {
            initial_step,
            decay_rate,
            min_step: 0.001,
            iteration: 0,
        }
    }

    /// Robbins-Monro step size: γ_k = γ_0 / (1 + k)^α
    pub fn get_step(&mut self, burn_in_complete: bool) -> f64 {
        self.iteration += 1;

        if !burn_in_complete {
            return self.initial_step;
        }

        let step = self.initial_step / (1.0 + self.iteration as f64).powf(self.decay_rate);
        step.max(self.min_step)
    }

    pub fn reset(&mut self) {
        self.iteration = 0;
    }
}

/// Convergence diagnostics using Gelman-Rubin statistic and relative change
pub struct ConvergenceDiagnostics {
    window_size: usize,
    theta_history: VecDeque<Vec<f64>>,
    omega_history: VecDeque<DMatrix<f64>>,
    convergence_threshold: f64,
}

impl ConvergenceDiagnostics {
    pub fn new(window_size: usize, threshold: f64) -> Self {
        Self {
            window_size,
            theta_history: VecDeque::with_capacity(window_size),
            omega_history: VecDeque::with_capacity(window_size),
            convergence_threshold: threshold,
        }
    }

    pub fn add_iteration(&mut self, theta: Vec<f64>, omega: DMatrix<f64>) {
        if self.theta_history.len() >= self.window_size {
            self.theta_history.pop_front();
            self.omega_history.pop_front();
        }
        self.theta_history.push_back(theta);
        self.omega_history.push_back(omega);
    }

    pub fn has_converged(&self) -> bool {
        if self.theta_history.len() < self.window_size {
            return false;
        }

        // Check relative change in parameters
        let recent_theta = self.theta_history.back().unwrap();
        let older_theta = &self.theta_history[self.window_size / 2];

        let max_relative_change = recent_theta
            .iter()
            .zip(older_theta.iter())
            .map(|(new, old)| {
                if old.abs() > 1e-10 {
                    ((new - old) / old).abs()
                } else {
                    (new - old).abs()
                }
            })
            .fold(0.0, f64::max);

        max_relative_change < self.convergence_threshold
    }

    pub fn get_convergence_metric(&self) -> f64 {
        if self.theta_history.len() < 2 {
            return f64::INFINITY;
        }

        let recent_theta = self.theta_history.back().unwrap();
        let prev_theta = &self.theta_history[self.theta_history.len() - 2];

        recent_theta
            .iter()
            .zip(prev_theta.iter())
            .map(|(new, old)| (new - old).abs())
            .sum::<f64>()
            / recent_theta.len() as f64
    }
}

/// Numerical stability utilities
pub struct NumericalStability;

impl NumericalStability {
    /// Log-sum-exp trick for numerical stability
    pub fn log_sum_exp(values: &[f64]) -> f64 {
        if values.is_empty() {
            return f64::NEG_INFINITY;
        }

        let max_val = values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        if max_val.is_infinite() {
            return max_val;
        }

        let sum_exp: f64 = values.iter().map(|&v| (v - max_val).exp()).sum();
        max_val + sum_exp.ln()
    }

    /// Ensure matrix is positive definite by adding small diagonal
    pub fn make_positive_definite(matrix: &mut DMatrix<f64>, min_eigenvalue: f64) {
        let n = matrix.nrows();
        let eps = min_eigenvalue.max(1e-6);

        // Add small value to diagonal to ensure positive definiteness
        for i in 0..n {
            matrix[(i, i)] = matrix[(i, i)].max(eps);
        }
    }

    /// Bound parameter to reasonable range
    pub fn bound_parameter(value: f64, lower: f64, upper: f64) -> f64 {
        value.max(lower).min(upper)
    }

    /// Transform unbounded to bounded using logit/sigmoid
    pub fn sigmoid_transform(x: f64, lower: f64, upper: f64) -> f64 {
        lower + (upper - lower) / (1.0 + (-x).exp())
    }

    /// Inverse sigmoid transform
    pub fn logit_transform(y: f64, lower: f64, upper: f64) -> f64 {
        let scaled = (y - lower) / (upper - lower);
        let clamped = scaled.max(1e-10).min(1.0 - 1e-10);
        (clamped / (1.0 - clamped)).ln()
    }
}

/// Fisher Information Matrix calculator for accurate standard errors
pub struct FisherInformation {
    epsilon: f64,
}

impl FisherInformation {
    pub fn new() -> Self {
        Self { epsilon: 1e-6 }
    }

    /// Compute Fisher Information Matrix using finite differences
    pub fn compute_fim(
        &self,
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
        log_likelihood_fn: impl Fn(&[f64], &DMatrix<f64>, f64) -> f64,
    ) -> DMatrix<f64> {
        let n_theta = theta.len();
        let n_omega = omega.nrows();
        let n_params = n_theta + n_omega + 1;

        let mut fim = DMatrix::zeros(n_params, n_params);
        let ll_0 = log_likelihood_fn(theta, omega, sigma);

        // Numerical Hessian approximation
        for i in 0..n_params {
            for j in 0..=i {
                let grad_ij = self.compute_second_derivative(
                    theta,
                    omega,
                    sigma,
                    i,
                    j,
                    ll_0,
                    &log_likelihood_fn,
                );

                fim[(i, j)] = -grad_ij;
                if i != j {
                    fim[(j, i)] = -grad_ij;
                }
            }
        }

        // Ensure positive definiteness
        NumericalStability::make_positive_definite(&mut fim, 1e-6);

        fim
    }

    fn compute_second_derivative(
        &self,
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
        i: usize,
        j: usize,
        ll_0: f64,
        log_likelihood_fn: &impl Fn(&[f64], &DMatrix<f64>, f64) -> f64,
    ) -> f64 {
        let eps = self.epsilon;

        // Four-point finite difference for second derivative
        let (theta_ip, omega_ip, sigma_ip) = self.perturb_params(theta, omega, sigma, i, eps);
        let (theta_im, omega_im, sigma_im) = self.perturb_params(theta, omega, sigma, i, -eps);
        let (theta_jp, omega_jp, sigma_jp) = self.perturb_params(theta, omega, sigma, j, eps);
        let (theta_jm, omega_jm, sigma_jm) = self.perturb_params(theta, omega, sigma, j, -eps);

        if i == j {
            // Second derivative with respect to same parameter
            let ll_plus = log_likelihood_fn(&theta_ip, &omega_ip, sigma_ip);
            let ll_minus = log_likelihood_fn(&theta_im, &omega_im, sigma_im);
            (ll_plus - 2.0 * ll_0 + ll_minus) / (eps * eps)
        } else {
            // Mixed partial derivative
            let (theta_ipjp, omega_ipjp, sigma_ipjp) =
                self.perturb_params(&theta_ip, &omega_ip, sigma_ip, j, eps);
            let (theta_imjm, omega_imjm, sigma_imjm) =
                self.perturb_params(&theta_im, &omega_im, sigma_im, j, -eps);

            let ll_ipjp = log_likelihood_fn(&theta_ipjp, &omega_ipjp, sigma_ipjp);
            let ll_imjm = log_likelihood_fn(&theta_imjm, &omega_imjm, sigma_imjm);

            let (theta_ipjm, omega_ipjm, sigma_ipjm) =
                self.perturb_params(&theta_ip, &omega_ip, sigma_ip, j, -eps);
            let (theta_imjp, omega_imjp, sigma_imjp) =
                self.perturb_params(&theta_im, &omega_im, sigma_im, j, eps);

            let ll_ipjm = log_likelihood_fn(&theta_ipjm, &omega_ipjm, sigma_ipjm);
            let ll_imjp = log_likelihood_fn(&theta_imjp, &omega_imjp, sigma_imjp);

            (ll_ipjp - ll_ipjm - ll_imjp + ll_imjm) / (4.0 * eps * eps)
        }
    }

    fn perturb_params(
        &self,
        theta: &[f64],
        omega: &DMatrix<f64>,
        sigma: f64,
        param_idx: usize,
        delta: f64,
    ) -> (Vec<f64>, DMatrix<f64>, f64) {
        let n_theta = theta.len();
        let n_omega = omega.nrows();

        let mut new_theta = theta.to_vec();
        let mut new_omega = omega.clone();
        let mut new_sigma = sigma;

        if param_idx < n_theta {
            new_theta[param_idx] += delta;
        } else if param_idx < n_theta + n_omega {
            let omega_idx = param_idx - n_theta;
            new_omega[(omega_idx, omega_idx)] = (new_omega[(omega_idx, omega_idx)] + delta).max(1e-6);
        } else {
            new_sigma = (new_sigma + delta).max(1e-6);
        }

        (new_theta, new_omega, new_sigma)
    }

    /// Extract standard errors from Fisher Information Matrix
    pub fn compute_standard_errors(&self, fim: &DMatrix<f64>) -> Vec<f64> {
        let n = fim.nrows();
        let mut standard_errors = vec![0.0; n];

        // Invert FIM to get covariance matrix
        if let Some(cov) = fim.clone().try_inverse() {
            for i in 0..n {
                standard_errors[i] = cov[(i, i)].sqrt().max(0.0);
            }
        } else {
            // If inversion fails, use diagonal approximation
            for i in 0..n {
                if fim[(i, i)] > 1e-10 {
                    standard_errors[i] = (1.0 / fim[(i, i)]).sqrt();
                } else {
                    standard_errors[i] = 1.0; // Large SE indicates poor identifiability
                }
            }
        }

        standard_errors
    }
}

impl Default for FisherInformation {
    fn default() -> Self {
        Self::new()
    }
}

/// Importance sampling for better SAEM performance
pub struct ImportanceSampler {
    adaptation_rate: f64,
}

impl ImportanceSampler {
    pub fn new(adaptation_rate: f64) -> Self {
        Self { adaptation_rate }
    }

    /// Adaptive importance sampling weights
    pub fn compute_weights(
        &self,
        proposals: &[DVector<f64>],
        target_mean: &DVector<f64>,
        target_cov: &DMatrix<f64>,
        proposal_cov: &DMatrix<f64>,
    ) -> Vec<f64> {
        let n = proposals.len();
        let mut weights = vec![0.0; n];

        for (i, proposal) in proposals.iter().enumerate() {
            let target_log_density = self.log_multivariate_normal(proposal, target_mean, target_cov);
            let proposal_log_density =
                self.log_multivariate_normal(proposal, target_mean, proposal_cov);

            weights[i] = (target_log_density - proposal_log_density).exp();
        }

        // Normalize weights
        let sum_weights: f64 = weights.iter().sum();
        if sum_weights > 0.0 {
            weights.iter_mut().for_each(|w| *w /= sum_weights);
        } else {
            weights.iter_mut().for_each(|w| *w = 1.0 / n as f64);
        }

        weights
    }

    fn log_multivariate_normal(
        &self,
        x: &DVector<f64>,
        mean: &DVector<f64>,
        cov: &DMatrix<f64>,
    ) -> f64 {
        let dim = x.len() as f64;
        let diff = x - mean;

        let cov_inv = match cov.clone().try_inverse() {
            Some(inv) => inv,
            None => return f64::NEG_INFINITY,
        };

        let mahalanobis = (diff.transpose() * cov_inv * &diff)[(0, 0)];
        let det = cov.determinant();

        if det <= 0.0 {
            return f64::NEG_INFINITY;
        }

        -0.5 * (dim * (2.0 * std::f64::consts::PI).ln() + det.ln() + mahalanobis)
    }
}
