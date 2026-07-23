use crate::dataset::Dataset;
use std::collections::HashMap;
use std::f64::consts::LN_2;

#[derive(Debug, Clone, PartialEq)]
pub enum Route {
    Bolus,
    Infusion,
    Oral,
    Subcutaneous,
    Unknown,
}

#[derive(Debug, Clone)]
pub struct SubjectData {
    pub id: usize,
    pub times: Vec<f64>,
    pub concentrations: Vec<f64>,
    pub doses: Vec<(f64, f64)>,
}

#[derive(Debug, Clone)]
pub struct InitialPKGuess {
    pub route: Route,
    pub cl: f64,
    pub v1: f64,
    pub v2: Option<f64>,
    pub ka: Option<f64>,
}

pub fn extract_subject_data(dataset: &Dataset) -> HashMap<usize, SubjectData> {
    let mut map: HashMap<usize, SubjectData> = HashMap::new();

    for obs in &dataset.observations {
        let entry = map.entry(obs.id).or_insert_with(|| SubjectData {
            id: obs.id,
            times: Vec::new(),
            concentrations: Vec::new(),
            doses: Vec::new(),
        });

        if obs.evid == 0 {
            if let Some(dv) = obs.dv {
                if dv > 0.0 {
                    entry.times.push(obs.time);
                    entry.concentrations.push(dv);
                }
            }
        } else if obs.evid == 1 && obs.amt > 0.0 {
            entry.doses.push((obs.time, obs.amt));
        }
    }

    for subject_data in map.values_mut() {
        let mut obs: Vec<(f64, f64)> = subject_data.times.iter().cloned()
            .zip(subject_data.concentrations.iter().cloned())
            .collect();
        obs.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
        subject_data.times = obs.iter().map(|(t, _)| *t).collect();
        subject_data.concentrations = obs.iter().map(|(_, c)| *c).collect();
        subject_data.doses.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
    }

    map
}

pub fn infer_route(subject: &SubjectData) -> Route {
    if subject.doses.is_empty() {
        return Route::Unknown;
    }

    if let Some(t_max) = estimate_tmax(subject) {
        if t_max < 0.25 {
            return Route::Bolus;
        } else if t_max < 2.0 {
            return Route::Oral;
        } else {
            return Route::Subcutaneous;
        }
    }

    if !subject.concentrations.is_empty() {
        return Route::Bolus;
    }

    Route::Unknown
}

fn estimate_tmax(subject: &SubjectData) -> Option<f64> {
    if subject.concentrations.is_empty() {
        return None;
    }
    let (pos, _) = subject.concentrations.iter()
        .enumerate()
        .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
        .map(|(idx, &val)| (idx, val))?;

    Some(subject.times[pos])
}

pub fn estimate_initial_params(subject: &SubjectData, route: Route) -> InitialPKGuess {
    let dose_amt: f64 = subject.doses.iter().map(|d| d.1).sum();
    let first_dose_time = subject.doses.get(0).map(|d| d.0).unwrap_or(0.0);
    let effective_dose = if dose_amt > 0.0 { dose_amt } else { 100.0 };

    let (filtered_times, filtered_concs): (Vec<f64>, Vec<f64>) = subject.times.iter().cloned()
        .zip(subject.concentrations.iter().cloned())
        .filter(|(t, _)| *t >= first_dose_time)
        .unzip();

    let t_max = estimate_tmax(subject);
    let c_max = filtered_concs.iter().cloned().fold(0.0, f64::max);
    let auc = estimate_auc_trapezoidal(&filtered_times, &filtered_concs);
    let half_life = estimate_half_life_terminal(&filtered_times, &filtered_concs);

    let cl = if auc > 0.0 { effective_dose / auc } else { 1.0 };
    let v1 = if c_max > 0.0 && route == Route::Bolus {
        effective_dose / c_max
    } else if half_life > 0.0 {
        cl * half_life / LN_2
    } else {
        10.0
    };

    let ke = if v1 > 0.0 { cl / v1 } else { 0.1 };

    let ka = match route {
        Route::Oral | Route::Subcutaneous => {
            if let Some(t_max_val) = t_max {
                if t_max_val > f64::EPSILON {
                    estimate_ka_from_tmax(t_max_val, ke)
                } else {
                    Some(0.5)
                }
            } else {
                Some(0.5)
            }
        }
        _ => None,
    };

    let v2 = if half_life > 4.0 && filtered_concs.len() > 5 && route != Route::Oral && route != Route::Subcutaneous {
        Some(v1 * 1.5)
    } else {
        None
    };

    InitialPKGuess {
        route,
        cl: cl.max(0.01),
        v1: v1.max(1.0),
        v2: v2.map(|k| k.max(1.0)),
        ka: ka.map(|k| k.max(0.01)),
    }
}

fn estimate_auc_trapezoidal(times: &[f64], concs: &[f64]) -> f64 {
    if times.len() < 2 || concs.len() != times.len() {
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

fn estimate_half_life_terminal(times: &[f64], concs: &[f64]) -> f64 {
    if times.len() < 3 {
        return 2.0;
    }

    let mut log_concs_data: Vec<(f64, f64)> = Vec::new();
    let max_idx = concs.iter().enumerate().max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap()).map(|(idx, _)| idx).unwrap_or(0);

    for i in max_idx..times.len() {
        if concs[i] > f64::EPSILON {
            log_concs_data.push((times[i], concs[i].ln()));
        }
    }

    let min_points_for_regression = 3;
    let mut terminal_phase_points: Vec<(f64, f64)> = Vec::new();

    if log_concs_data.len() >= min_points_for_regression {
        let mut prev_ln_conc = log_concs_data.last().unwrap().1;
        terminal_phase_points.push(*log_concs_data.last().unwrap());

        for i in (0..log_concs_data.len() - 1).rev() {
            let (t, ln_c) = log_concs_data[i];
            if ln_c > prev_ln_conc + 0.01 {
                break;
            }
            terminal_phase_points.push((t, ln_c));
            prev_ln_conc = ln_c;
        }
    }

    terminal_phase_points.reverse();

    if terminal_phase_points.len() < min_points_for_regression {
        return 2.0;
    }

    let slope = simple_linear_regression(&terminal_phase_points);
    if slope < 0.0 {
        let lambda_z = -slope;
        LN_2 / lambda_z
    } else {
        2.0
    }
}

fn simple_linear_regression(data: &[(f64, f64)]) -> f64 {
    let n = data.len() as f64;
    let sum_x: f64 = data.iter().map(|(x, _)| x).sum();
    let sum_y: f64 = data.iter().map(|(_, y)| y).sum();
    let sum_xy: f64 = data.iter().map(|(x, y)| x * y).sum();
    let sum_x2: f64 = data.iter().map(|(x, _)| x * x).sum();

    let denominator = n * sum_x2 - sum_x * sum_x;
    if denominator.abs() < f64::EPSILON {
        return 0.0;
    }

    (n * sum_xy - sum_x * sum_y) / denominator
}

fn estimate_ka_from_tmax(target_t_max: f64, ke: f64) -> Option<f64> {
    if ke <= f64::EPSILON || target_t_max <= f64::EPSILON {
        return None;
    }

    let f = |ka: f64| -> f64 {
        if ka <= f64::EPSILON {
            f64::MAX
        } else if (ka - ke).abs() < f64::EPSILON {
            (1.0 / ke) - target_t_max
        } else {
            (ka.ln() - ke.ln()) / (ka - ke) - target_t_max
        }
    };

    let mut low = ke * 0.001;
    let mut high = ke * 1000.0;
    let tolerance = 1e-6;
    let max_iterations = 100;

    let mut f_low = f(low);
    let mut f_high = f(high);

    if f_low.is_nan() || f_high.is_nan() || f_low * f_high > 0.0 {
        low = 0.01;
        high = 50.0;
        f_low = f(low);
        f_high = f(high);

        if f_low.is_nan() || f_high.is_nan() || f_low * f_high > 0.0 {
            if target_t_max < (1.0 / ke) {
                return Some((ke * 2.0).max(0.01));
            } else {
                return Some((ke * 0.5).max(0.01));
            }
        }
    }

    for _ in 0..max_iterations {
        let mid = (low + high) / 2.0;
        let f_mid = f(mid);

        if f_mid.abs() < tolerance {
            return Some(mid);
        }
        if f_low * f_mid < 0.0 {
            high = mid;
        } else {
            low = mid;
            f_low = f_mid;
        }
    }

    Some((low + high) / 2.0)
}

pub fn compute_population_initial_estimates(dataset: &Dataset, model_type: &str) -> Vec<f64> {
    let subjects = extract_subject_data(dataset);

    if subjects.is_empty() {
        return get_default_initial_params(model_type);
    }

    let mut all_guesses: Vec<InitialPKGuess> = Vec::new();

    for (_, subject) in subjects.iter() {
        if subject.concentrations.is_empty() {
            continue;
        }
        let route = infer_route(subject);
        let guess = estimate_initial_params(subject, route);
        all_guesses.push(guess);
    }

    if all_guesses.is_empty() {
        return get_default_initial_params(model_type);
    }

    let avg_cl = all_guesses.iter().map(|g| g.cl).sum::<f64>() / all_guesses.len() as f64;
    let avg_v1 = all_guesses.iter().map(|g| g.v1).sum::<f64>() / all_guesses.len() as f64;

    match model_type {
        "one_compartment" | "1comp" => {
            let ka_guesses: Vec<f64> = all_guesses.iter()
                .filter_map(|g| g.ka)
                .collect();
            let avg_ka = if !ka_guesses.is_empty() {
                ka_guesses.iter().sum::<f64>() / ka_guesses.len() as f64
            } else {
                0.5
            };
            vec![avg_cl, avg_v1, avg_ka]
        },
        "two_compartment" | "2comp" => {
            let v2_guesses: Vec<f64> = all_guesses.iter()
                .filter_map(|g| g.v2)
                .collect();
            let avg_v2 = if !v2_guesses.is_empty() {
                v2_guesses.iter().sum::<f64>() / v2_guesses.len() as f64
            } else {
                avg_v1 * 1.5
            };

            let q = avg_cl * 0.1;

            let ka_guesses: Vec<f64> = all_guesses.iter()
                .filter_map(|g| g.ka)
                .collect();
            let avg_ka = if !ka_guesses.is_empty() {
                ka_guesses.iter().sum::<f64>() / ka_guesses.len() as f64
            } else {
                0.5
            };

            vec![avg_cl, avg_v1, avg_v2, q, avg_ka]
        },
        _ => get_default_initial_params(model_type),
    }
}

fn get_default_initial_params(model_type: &str) -> Vec<f64> {
    match model_type {
        "one_compartment" | "1comp" => vec![5.0, 50.0, 1.0],
        "two_compartment" | "2comp" => vec![8.0, 60.0, 40.0, 4.0, 1.5],
        _ => vec![5.0, 50.0, 1.0],
    }
}
