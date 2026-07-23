use crate::config::Config;
use crate::dataset::Dataset;
use crate::saem::SaemResults;
use chrono::Local;
use std::fs::File;
use std::io::Write;
use std::path::Path;

pub fn generate_all_reports(
    results: &SaemResults,
    dataset: &Dataset,
    config: &Config,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_dir = Path::new(&config.output.directory);
    std::fs::create_dir_all(output_dir)?;

    generate_summary_report(results, dataset, config)?;
    generate_individual_predictions(results, config)?;
    generate_population_parameters(results, config)?;
    generate_log_file(results, dataset, config)?;

    Ok(())
}

fn generate_summary_report(
    results: &SaemResults,
    dataset: &Dataset,
    config: &Config,
) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(&config.output.directory).join("summary.txt");
    let mut file = File::create(path)?;

    writeln!(file, "╔════════════════════════════════════════════════════════════════════╗")?;
    writeln!(file, "║  PHIKL1: Population Pharmacokinetics SAEM Estimation Report       ║")?;
    writeln!(file, "╚════════════════════════════════════════════════════════════════════╝")?;
    writeln!(file)?;
    writeln!(file, "Run completed: {}", Local::now().format("%Y-%m-%d %H:%M:%S"))?;
    writeln!(file)?;

    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "DATASET SUMMARY")?;
    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "Number of subjects: {}", dataset.n_subjects)?;
    writeln!(file, "Total observations: {}", dataset.observations.len())?;
    writeln!(file, "Data file: {}", config.data.file)?;
    writeln!(file)?;

    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "MODEL SPECIFICATION")?;
    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "Model type: {}", config.model.model_type)?;
    writeln!(file)?;

    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "ESTIMATION SETTINGS")?;
    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "Algorithm: SAEM (Stochastic Approximation Expectation-Maximization)")?;
    writeln!(file, "Burn-in iterations: {}", config.estimation.n_burn_in)?;
    writeln!(file, "Estimation iterations: {}", config.estimation.n_iter)?;
    writeln!(file, "Number of chains: {}", config.estimation.n_chains)?;
    writeln!(file, "Random seed: {}", config.estimation.seed)?;
    writeln!(file)?;

    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "POPULATION PARAMETERS (THETA)")?;
    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "{:<15} {:<25} {:>12} {:>12} {:>10} {:>8}",
             "Parameter", "Description", "Estimate", "SE", "RSE%", "Status")?;
    writeln!(file, "{:<15} {:>25} {:>14} {:>14}",
             "", "", "95% CI Lower", "95% CI Upper")?;
    writeln!(file, "───────────────────────────────────────────────────────────────────")?;
    for (i, &theta) in results.theta.iter().enumerate() {
        let param_name = config.get_theta_name(i);
        let param_desc = config.get_theta_description(i);

        let is_fixed = if let Some(ref constraints) = config.parameters.constraints {
            if let Some(ref fixed) = constraints.theta_fixed {
                i < fixed.len() && fixed[i]
            } else {
                false
            }
        } else {
            false
        };

        let status = if is_fixed { "FIXED" } else { "Est." };

        writeln!(file, "{:<15} {:<25} {:12.6} {:12.6} {:10.2} {:>8}",
                 param_name,
                 if param_desc == param_name { "".to_string() } else { param_desc },
                 theta,
                 if is_fixed { 0.0 } else { results.statistics.theta_se[i] },
                 if is_fixed { 0.0 } else { results.statistics.theta_rse[i] },
                 status)?;
        if !is_fixed {
            writeln!(file, "{:<15} {:>25} {:14.6} {:14.6}",
                     "", "",
                     results.statistics.theta_ci_lower[i],
                     results.statistics.theta_ci_upper[i])?;
        }
    }
    writeln!(file)?;

    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "RANDOM EFFECTS VARIANCE-COVARIANCE MATRIX (OMEGA)")?;
    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    for i in 0..results.omega.nrows() {
        write!(file, "  ")?;
        for j in 0..results.omega.ncols() {
            write!(file, "{:12.6} ", results.omega[(i, j)])?;
        }
        writeln!(file)?;
    }
    writeln!(file)?;

    writeln!(file)?;
    writeln!(file, "Standard Deviations, RSE%, and Shrinkage:")?;
    writeln!(file, "{:<15} {:<25} {:>12} {:>12} {:>10} {:>12}",
             "Parameter", "Description", "SD", "SE", "RSE%", "Shrinkage%")?;
    writeln!(file, "───────────────────────────────────────────────────────────────────")?;
    for i in 0..results.omega.nrows() {
        let param_name = config.get_omega_name(i);
        let param_desc = config.get_omega_description(i);
        writeln!(file, "{:<15} {:<25} {:12.6} {:12.6} {:10.2} {:12.2}",
                 param_name,
                 if param_desc == param_name { "".to_string() } else { param_desc },
                 results.omega[(i, i)].sqrt(),
                 results.statistics.omega_se[(i, i)],
                 results.statistics.omega_rse[(i, i)],
                 results.statistics.shrinkage_eta[i])?;
    }
    writeln!(file)?;

    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "RESIDUAL ERROR MODEL")?;
    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "Error model: {:?}", config.parameters.error_model)?;
    writeln!(file)?;
    writeln!(file, "{:<12} {:>12} {:>12} {:>10} {:>12} {:>8}",
             "Parameter", "Estimate", "SE", "RSE%", "Shrinkage%", "Status")?;
    writeln!(file, "───────────────────────────────────────────────────────────────────")?;

    let sigma_is_fixed = if let Some(ref constraints) = config.parameters.constraints {
        constraints.sigma_fixed.unwrap_or(false)
    } else {
        false
    };
    let sigma_status = if sigma_is_fixed { "FIXED" } else { "Est." };

    use crate::config::ErrorModel;
    match config.parameters.error_model {
        ErrorModel::Additive => {
            writeln!(file, "SIGMA_ADD    {:12.6} {:12.6} {:10.2} {:12.2} {:>8}",
                     results.sigma,
                     if sigma_is_fixed { 0.0 } else { results.statistics.sigma_se },
                     if sigma_is_fixed { 0.0 } else { results.statistics.sigma_rse },
                     results.statistics.shrinkage_epsilon,
                     sigma_status)?;
        },
        ErrorModel::Proportional => {
            let sigma_prop = config.parameters.sigma_proportional.unwrap_or(results.sigma);
            writeln!(file, "SIGMA_PROP   {:12.6} {:12.6} {:10.2} {:12.2} {:>8}",
                     sigma_prop,
                     if sigma_is_fixed { 0.0 } else { results.statistics.sigma_se },
                     if sigma_is_fixed { 0.0 } else { results.statistics.sigma_rse },
                     results.statistics.shrinkage_epsilon,
                     sigma_status)?;
        },
        ErrorModel::Combined => {
            writeln!(file, "SIGMA_ADD    {:12.6} {:12.6} {:10.2} {:12.2} {:>8}",
                     results.sigma,
                     if sigma_is_fixed { 0.0 } else { results.statistics.sigma_se },
                     if sigma_is_fixed { 0.0 } else { results.statistics.sigma_rse },
                     results.statistics.shrinkage_epsilon,
                     sigma_status)?;
            let sigma_prop = config.parameters.sigma_proportional.unwrap_or(0.1);
            writeln!(file, "SIGMA_PROP   {:12.6} {:>12} {:>10} {:>12} {:>8}",
                     sigma_prop, "-", "-", "-", "-")?;
        },
    }
    writeln!(file)?;

    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "MODEL FIT STATISTICS")?;
    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "Log-likelihood:        {:12.2}", results.log_likelihood)?;
    writeln!(file, "-2 Log-likelihood:     {:12.2}", -2.0 * results.log_likelihood)?;
    writeln!(file, "AIC:                   {:12.2}", results.statistics.aic)?;
    writeln!(file, "BIC:                   {:12.2}", results.statistics.bic)?;
    writeln!(file, "Number of observations: {}", results.statistics.n_observations)?;
    writeln!(file, "Number of subjects:     {}", results.statistics.n_subjects)?;
    writeln!(file, "Number of parameters:   {}", results.statistics.n_parameters)?;
    writeln!(file)?;

    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;
    writeln!(file, "INDIVIDUAL PARAMETER SUMMARY")?;
    writeln!(file, "═══════════════════════════════════════════════════════════════════")?;

    for i in 0..results.theta.len() {
        let params: Vec<f64> = results.individual_parameters.iter()
            .map(|ip| ip.params.get(i).copied().unwrap_or(0.0))
            .collect();

        let mean = params.iter().sum::<f64>() / params.len() as f64;
        let min = params.iter().cloned().fold(f64::INFINITY, f64::min);
        let max = params.iter().cloned().fold(f64::NEG_INFINITY, f64::max);

        writeln!(file, "Parameter {} (THETA[{}]):", i + 1, i + 1)?;
        writeln!(file, "  Mean: {:12.6}", mean)?;
        writeln!(file, "  Min:  {:12.6}", min)?;
        writeln!(file, "  Max:  {:12.6}", max)?;
        writeln!(file)?;
    }

    Ok(())
}

fn generate_individual_predictions(
    results: &SaemResults,
    config: &Config,
) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(&config.output.directory).join("individual_predictions.csv");
    let mut file = File::create(path)?;

    writeln!(file, "ID,TIME,DV,PRED,IPRED,IWRES,CWRES")?;

    for pred in &results.predictions {
        writeln!(
            file,
            "{},{},{},{},{},{},{}",
            pred.id,
            pred.time,
            pred.dv.map(|v| v.to_string()).unwrap_or_else(|| ".".to_string()),
            pred.pred,
            pred.ipred,
            pred.iwres,
            pred.cwres
        )?;
    }

    Ok(())
}

fn generate_population_parameters(
    results: &SaemResults,
    config: &Config,
) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(&config.output.directory).join("population_parameters.csv");
    let mut file = File::create(path)?;

    writeln!(file, "ID,PARAMETER,VALUE")?;

    for ind_param in &results.individual_parameters {
        for (i, &param) in ind_param.params.iter().enumerate() {
            writeln!(file, "{},PARAM_{},{}", ind_param.id, i + 1, param)?;
        }

        for i in 0..ind_param.eta.len() {
            writeln!(file, "{},ETA_{},{}", ind_param.id, i + 1, ind_param.eta[i])?;
        }
    }

    Ok(())
}

fn generate_log_file(
    results: &SaemResults,
    dataset: &Dataset,
    config: &Config,
) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(&config.output.directory).join("run.log");
    let mut file = File::create(path)?;

    writeln!(file, "PHIKL1 Run Log")?;
    writeln!(file, "==============")?;
    writeln!(file)?;
    writeln!(file, "Run started: {}", Local::now().format("%Y-%m-%d %H:%M:%S"))?;
    writeln!(file)?;

    writeln!(file, "Configuration:")?;
    writeln!(file, "  Data file: {}", config.data.file)?;
    writeln!(file, "  Model type: {}", config.model.model_type)?;
    writeln!(file, "  Subjects: {}", dataset.n_subjects)?;
    writeln!(file, "  Observations: {}", dataset.observations.len())?;
    writeln!(file)?;

    writeln!(file, "Initial Parameters:")?;
    for (i, &theta) in config.parameters.theta.iter().enumerate() {
        writeln!(file, "  {} = {:.6}", config.get_theta_name(i), theta)?;
    }
    writeln!(file, "  SIGMA = {}", config.parameters.sigma)?;
    writeln!(file)?;

    writeln!(file, "Estimation:")?;
    writeln!(file, "  Method: {:?}", config.estimation.method)?;
    writeln!(file, "  Total iterations: {}", results.convergence.iterations)?;
    writeln!(file)?;

    writeln!(file, "Final Estimates:")?;
    for (i, &theta) in results.theta.iter().enumerate() {
        let name = config.get_theta_name(i);
        let desc = config.get_theta_description(i);
        if desc != name {
            writeln!(file, "  {} ({}) = {:.6}", name, desc, theta)?;
        } else {
            writeln!(file, "  {} = {:.6}", name, theta)?;
        }
    }
    writeln!(file, "  SIGMA = {}", results.sigma)?;
    writeln!(file, "  Log-likelihood = {}", results.log_likelihood)?;
    writeln!(file)?;

    writeln!(file, "Convergence History (last 10 iterations):")?;
    let start_idx = results.convergence.theta_history.len().saturating_sub(10);
    for (i, theta) in results.convergence.theta_history[start_idx..].iter().enumerate() {
        writeln!(file, "  Iter {}: THETA = {:?}", start_idx + i + 1, theta)?;
    }
    writeln!(file)?;

    writeln!(file, "Run completed: {}", Local::now().format("%Y-%m-%d %H:%M:%S"))?;

    Ok(())
}
