use crate::dataset::Dataset;
use crate::models::{create_model, PharmacokineticModel, ModelState};
use crate::config::Config;

#[derive(Debug, Clone)]
pub struct RobustInitialEstimates {
    pub theta: Vec<f64>,
    pub omega: Vec<Vec<f64>>,
    pub sigma: f64,
    pub method_used: String,
    pub confidence_score: f64,
}

#[derive(Debug, Clone)]
struct SubjectEstimates {
    id: usize,
    cl: f64,
    v: f64,
    ka: Option<f64>,
    q: Option<f64>,
    v2: Option<f64>,
}

pub struct RobustInitialEstimator<'a> {
    dataset: &'a Dataset,
    model_type: &'a str,
}

impl<'a> RobustInitialEstimator<'a> {
    pub fn new(dataset: &'a Dataset, model_type: &'a str) -> Self {
        Self {
            dataset,
            model_type,
        }
    }

    pub fn estimate(&self) -> RobustInitialEstimates {
        println!("\n┌────────────────────────────────────────────────────────┐");
        println!("│         ROBUST INITIAL PARAMETER ESTIMATION            │");
        println!("└────────────────────────────────────────────────────────┘");

        let methods = vec![
            ("Two-Stage", self.two_stage_method()),
            ("Naive Pooled", self.naive_pooled_method()),
            ("Moment-Based", self.moment_based_method()),
        ];

        println!("\n  Method Comparison:");
        println!("  ┌──────────────────┬──────────┬──────────┬──────────┐");
        println!("  │ Method           │   CL     │    V     │  Score   │");
        println!("  ├──────────────────┼──────────┼──────────┼──────────┤");

        let mut best_estimate = methods[0].1.clone();
        let mut best_score = 0.0;

        for (name, estimate) in &methods {
            println!("  │ {:16} │ {:8.2} │ {:8.2} │  {:6.2}  │",
                     name, estimate.theta[0], estimate.theta[1], estimate.confidence_score);

            if estimate.confidence_score > best_score {
                best_score = estimate.confidence_score;
                best_estimate = estimate.clone();
            }
        }

        println!("  └──────────────────┴──────────┴──────────┴──────────┘");
        println!("\n  ✓ Selected: {} (Score: {:.2})\n", best_estimate.method_used, best_estimate.confidence_score);

        best_estimate
    }

    fn two_stage_method(&self) -> RobustInitialEstimates {
        let subject_estimates = self.estimate_individual_subjects();

        if subject_estimates.is_empty() {
            return self.fallback_estimates("Two-Stage (Fallback)");
        }

        let n_subjects = subject_estimates.len() as f64;

        let mean_cl = subject_estimates.iter().map(|s| s.cl).sum::<f64>() / n_subjects;
        let mean_v = subject_estimates.iter().map(|s| s.v).sum::<f64>() / n_subjects;

        let mut theta = vec![mean_cl, mean_v];
        let mut omega_diag = vec![0.01, 0.01];

        if self.model_type == "one_compartment_oral" || self.model_type == "two_compartment_oral" {
            let mean_ka = subject_estimates.iter()
                .filter_map(|s| s.ka)
                .sum::<f64>() / subject_estimates.iter().filter(|s| s.ka.is_some()).count().max(1) as f64;

            theta.push(mean_ka.max(0.1));
            omega_diag.push(0.01);
        }

        if self.model_type == "two_compartment_iv" || self.model_type == "two_compartment_oral" {
            let mean_q = subject_estimates.iter()
                .filter_map(|s| s.q)
                .sum::<f64>() / subject_estimates.iter().filter(|s| s.q.is_some()).count().max(1) as f64;
            let mean_v2 = subject_estimates.iter()
                .filter_map(|s| s.v2)
                .sum::<f64>() / subject_estimates.iter().filter(|s| s.v2.is_some()).count().max(1) as f64;

            theta.push(mean_q.max(0.1));
            theta.push(mean_v2.max(1.0));
            omega_diag.push(0.01);
            omega_diag.push(0.01);
        }

        let n_theta = theta.len();
        let omega = vec![omega_diag; n_theta];

        let sigma = 1.0;

        let confidence = self.calculate_confidence_score(&subject_estimates, n_subjects as usize);

        RobustInitialEstimates {
            theta,
            omega,
            sigma,
            method_used: "Two-Stage".to_string(),
            confidence_score: confidence,
        }
    }

    fn estimate_individual_subjects(&self) -> Vec<SubjectEstimates> {
        let subject_ids = self.dataset.subject_ids();
        let mut estimates = Vec::new();

        for &subject_id in &subject_ids {
            if let Some(est) = self.estimate_single_subject(subject_id) {
                estimates.push(est);
            }
        }

        estimates
    }

    fn estimate_single_subject(&self, subject_id: usize) -> Option<SubjectEstimates> {
        let observations = self.dataset.get_subject_observations(subject_id);

        let dose_obs: Vec<_> = observations.iter().filter(|o| o.evid == 1).collect();
        let conc_obs: Vec<_> = observations.iter()
            .filter(|o| o.evid == 0 && o.dv.is_some())
            .collect();

        if dose_obs.is_empty() || conc_obs.len() < 3 {
            return None;
        }

        let total_dose: f64 = dose_obs.iter().map(|o| o.amt).sum();
        let dose_time = dose_obs[0].time;

        let conc_times: Vec<f64> = conc_obs.iter().map(|o| o.time).collect();
        let conc_values: Vec<f64> = conc_obs.iter().map(|o| o.dv.unwrap()).collect();

        let auc = self.trapezoidal_auc(&conc_times, &conc_values);
        let cl = if auc > 0.0 { total_dose / auc } else { 1.0 };

        let c_max_idx = conc_values.iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
            .map(|(i, _)| i)?;
        let c_max = conc_values[c_max_idx];
        let t_max = conc_times[c_max_idx];

        let is_oral = t_max - dose_time > 0.5;

        let lambda_z = self.estimate_terminal_slope(&conc_times, &conc_values, c_max_idx);
        let half_life = if lambda_z > 0.0 { 0.693 / lambda_z } else { 2.0 };

        let v = if is_oral {
            cl * half_life / 0.693
        } else {
            total_dose / c_max
        };

        let ka = if is_oral {
            let ke = cl / v;
            Some(self.estimate_ka(t_max - dose_time, ke))
        } else {
            None
        };

        let (q, v2) = if conc_obs.len() > 6 && !is_oral {
            self.estimate_two_compartment(&conc_times, &conc_values, cl, v)
        } else {
            (None, None)
        };

        Some(SubjectEstimates {
            id: subject_id,
            cl: cl.max(0.01),
            v: v.max(1.0),
            ka: ka.map(|k| k.max(0.1)),
            q,
            v2,
        })
    }

    fn naive_pooled_method(&self) -> RobustInitialEstimates {
        let mut all_times = Vec::new();
        let mut all_concs = Vec::new();
        let mut total_dose = 0.0;

        for obs in &self.dataset.observations {
            if obs.evid == 1 {
                total_dose += obs.amt;
            } else if obs.evid == 0 {
                if let Some(dv) = obs.dv {
                    if dv > 0.0 {
                        all_times.push(obs.time);
                        all_concs.push(dv);
                    }
                }
            }
        }

        if all_times.is_empty() {
            return self.fallback_estimates("Naive Pooled (Fallback)");
        }

        let mut paired: Vec<_> = all_times.iter().zip(all_concs.iter()).collect();
        paired.sort_by(|a, b| a.0.partial_cmp(b.0).unwrap());

        let sorted_times: Vec<f64> = paired.iter().map(|(t, _)| **t).collect();
        let sorted_concs: Vec<f64> = paired.iter().map(|(_, c)| **c).collect();

        let auc = self.trapezoidal_auc(&sorted_times, &sorted_concs);
        let cl = if auc > 0.0 { total_dose / auc } else { 1.0 };

        let c_max = sorted_concs.iter().cloned().fold(0.0, f64::max);
        let v = if c_max > 0.0 { total_dose / c_max } else { 10.0 };

        let mut theta = vec![cl, v];
        let mut omega_diag = vec![0.01, 0.01];

        if self.model_type == "one_compartment_oral" || self.model_type == "two_compartment_oral" {
            theta.push(1.0);
            omega_diag.push(0.01);
        }

        if self.model_type == "two_compartment_iv" || self.model_type == "two_compartment_oral" {
            theta.push(cl * 0.5);
            theta.push(v * 1.5);
            omega_diag.push(0.01);
            omega_diag.push(0.01);
        }

        let n_theta = theta.len();
        let omega = vec![omega_diag; n_theta];

        let sigma = 1.0;

        RobustInitialEstimates {
            theta,
            omega,
            sigma,
            method_used: "Naive Pooled".to_string(),
            confidence_score: 50.0,
        }
    }

    fn moment_based_method(&self) -> RobustInitialEstimates {
        let conc_obs: Vec<_> = self.dataset.observations.iter()
            .filter(|o| o.evid == 0 && o.dv.is_some())
            .collect();

        let doses: Vec<_> = self.dataset.observations.iter()
            .filter(|o| o.evid == 1)
            .collect();

        if conc_obs.is_empty() || doses.is_empty() {
            return self.fallback_estimates("Moment-Based (Fallback)");
        }

        let concs: Vec<f64> = conc_obs.iter().map(|o| o.dv.unwrap()).collect();
        let times: Vec<f64> = conc_obs.iter().map(|o| o.time).collect();

        let total_dose: f64 = doses.iter().map(|o| o.amt).sum();

        let auc = self.trapezoidal_auc(&times, &concs);

        let aumc = self.trapezoidal_aumc(&times, &concs);
        let mrt = if auc > 0.0 { aumc / auc } else { 5.0 };

        let cl = if auc > 0.0 { total_dose / auc } else { 1.0 };
        let v = cl * mrt;

        let mut theta = vec![cl, v];
        let mut omega_diag = vec![0.01, 0.01];

        if self.model_type == "one_compartment_oral" || self.model_type == "two_compartment_oral" {
            theta.push(1.0);
            omega_diag.push(0.01);
        }

        if self.model_type == "two_compartment_iv" || self.model_type == "two_compartment_oral" {
            theta.push(cl * 0.5);
            theta.push(v * 1.5);
            omega_diag.push(0.01);
            omega_diag.push(0.01);
        }

        let n_theta = theta.len();
        let omega = vec![omega_diag; n_theta];

        let sigma = 1.0;

        RobustInitialEstimates {
            theta,
            omega,
            sigma,
            method_used: "Moment-Based".to_string(),
            confidence_score: 60.0,
        }
    }

    fn fallback_estimates(&self, method_name: &str) -> RobustInitialEstimates {
        let mut theta = vec![2.0, 20.0];
        let mut omega_diag = vec![0.01, 0.01];

        if self.model_type == "one_compartment_oral" || self.model_type == "two_compartment_oral" {
            theta.push(1.0);
            omega_diag.push(0.01);
        }

        if self.model_type == "two_compartment_iv" || self.model_type == "two_compartment_oral" {
            theta.push(1.0);
            theta.push(30.0);
            omega_diag.push(0.01);
            omega_diag.push(0.01);
        }

        let n_theta = theta.len();
        let omega = vec![omega_diag; n_theta];

        RobustInitialEstimates {
            theta,
            omega,
            sigma: 1.0,
            method_used: method_name.to_string(),
            confidence_score: 20.0,
        }
    }

    fn trapezoidal_auc(&self, times: &[f64], concs: &[f64]) -> f64 {
        if times.len() < 2 {
            return 0.0;
        }

        let mut auc = 0.0;
        for i in 1..times.len() {
            let dt = times[i] - times[i - 1];
            let avg_conc = (concs[i] + concs[i - 1]) / 2.0;
            auc += dt * avg_conc;
        }
        auc
    }

    fn trapezoidal_aumc(&self, times: &[f64], concs: &[f64]) -> f64 {
        if times.len() < 2 {
            return 0.0;
        }

        let mut aumc = 0.0;
        for i in 1..times.len() {
            let dt = times[i] - times[i - 1];
            let avg_tc = (times[i] * concs[i] + times[i - 1] * concs[i - 1]) / 2.0;
            aumc += dt * avg_tc;
        }
        aumc
    }

    fn estimate_terminal_slope(&self, times: &[f64], concs: &[f64], peak_idx: usize) -> f64 {
        if peak_idx >= times.len() - 2 {
            return 0.1;
        }

        let mut log_concs = Vec::new();
        let mut log_times = Vec::new();

        for i in peak_idx..times.len() {
            if concs[i] > 0.0 {
                log_concs.push(concs[i].ln());
                log_times.push(times[i]);
            }
        }

        if log_concs.len() < 3 {
            return 0.1;
        }

        let (slope, _intercept) = self.linear_regression(&log_times, &log_concs);
        (-slope).max(0.01)
    }

    fn linear_regression(&self, x: &[f64], y: &[f64]) -> (f64, f64) {
        let n = x.len() as f64;
        let sum_x: f64 = x.iter().sum();
        let sum_y: f64 = y.iter().sum();
        let sum_xy: f64 = x.iter().zip(y.iter()).map(|(xi, yi)| xi * yi).sum();
        let sum_x2: f64 = x.iter().map(|xi| xi * xi).sum();

        let slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x);
        let intercept = (sum_y - slope * sum_x) / n;

        (slope, intercept)
    }

    fn estimate_ka(&self, tmax: f64, ke: f64) -> f64 {
        if tmax <= 0.0 || ke <= 0.0 {
            return 1.0;
        }

        let mut ka = 1.0;
        for _ in 0..10 {
            let f = (ka / (ka - ke)) * ((-ke * tmax).exp() - (-ka * tmax).exp());
            let df = 1.0 / (ka - ke) * ((-ke * tmax).exp() - (-ka * tmax).exp())
                - (ka / (ka - ke).powi(2)) * ((-ke * tmax).exp() - (-ka * tmax).exp())
                + (ka / (ka - ke)) * (-tmax * (-ka * tmax).exp());

            if df.abs() < 1e-10 {
                break;
            }

            ka = ka - f / df;
            ka = ka.max(0.1).min(10.0);
        }

        ka
    }

    fn estimate_two_compartment(&self, times: &[f64], concs: &[f64], cl: f64, v1: f64) -> (Option<f64>, Option<f64>) {
        if times.len() < 6 {
            return (None, None);
        }

        let q = Some(cl * 0.5);
        let v2 = Some(v1 * 1.5);

        (q, v2)
    }

    fn calculate_sse(&self, theta: &[f64], model: &Box<dyn PharmacokineticModel>) -> f64 {
        let mut sse = 0.0;
        let subject_ids = self.dataset.subject_ids();

        for &subject_id in &subject_ids {
            let observations = self.dataset.get_subject_observations(subject_id);
            let mut state = ModelState::new(3);

            for obs in observations {
                if obs.evid == 1 {
                    state.add_dose(obs.amt, 0);
                } else if obs.evid == 0 {
                    if let Some(dv) = obs.dv {
                        let pred = model.predict(obs.time, theta, &mut state);
                        sse += (dv - pred).powi(2);
                    }
                }
            }
        }

        sse
    }

    fn calculate_residual_variance(&self, estimates: &[SubjectEstimates], theta: &[f64]) -> f64 {
        let model = create_model(self.model_type);
        let mut total_var = 0.0;
        let mut n_obs = 0;

        for est in estimates {
            let observations = self.dataset.get_subject_observations(est.id);
            let mut state = ModelState::new(3);

            for obs in observations {
                if obs.evid == 1 {
                    state.add_dose(obs.amt, 0);
                } else if obs.evid == 0 {
                    if let Some(dv) = obs.dv {
                        let pred = model.predict(obs.time, theta, &mut state);
                        total_var += (dv - pred).powi(2);
                        n_obs += 1;
                    }
                }
            }
        }

        if n_obs > 0 {
            total_var / n_obs as f64
        } else {
            1.0
        }
    }

    fn calculate_confidence_score(&self, estimates: &[SubjectEstimates], n_subjects: usize) -> f64 {
        if estimates.is_empty() {
            return 0.0;
        }

        let n_successful = estimates.len();
        let success_rate = n_successful as f64 / n_subjects as f64;

        let mean_cl = estimates.iter().map(|e| e.cl).sum::<f64>() / n_successful as f64;
        let cv_cl = estimates.iter()
            .map(|e| ((e.cl - mean_cl) / mean_cl).powi(2))
            .sum::<f64>()
            .sqrt();

        let variability_penalty = (cv_cl * 100.0).min(50.0);

        let base_score = success_rate * 100.0;
        let final_score = (base_score - variability_penalty).max(0.0);

        final_score
    }
}

pub fn get_robust_initial_estimates(config: &Config, dataset: &Dataset) -> RobustInitialEstimates {
    let estimator = RobustInitialEstimator::new(dataset, &config.model.model_type);
    estimator.estimate()
}
