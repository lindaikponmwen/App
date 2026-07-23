use crate::config::Config;
use crate::dataset::Dataset;
use crate::saem::{SaemEngine, SaemResults};

#[derive(Debug, Clone)]
pub struct ModelComparison {
    pub models: Vec<ModelResult>,
    pub best_by_aic: String,
    pub best_by_bic: String,
}

#[derive(Debug, Clone)]
pub struct ModelResult {
    pub model_name: String,
    pub results: SaemResults,
}

pub fn compare_models(
    model_types: &[&str],
    dataset: &Dataset,
    config: &Config,
) -> Result<ModelComparison, Box<dyn std::error::Error>> {
    let mut models = Vec::new();

    for &model_type in model_types {
        println!("\n╔═══════════════════════════════════════════════════════════╗");
        println!("║  Running Model: {:42} ║", model_type);
        println!("╚═══════════════════════════════════════════════════════════╝\n");

        let mut model_config = config.clone();
        model_config.model.model_type = model_type.to_string();

        let mut engine = SaemEngine::new(model_config, dataset.clone());

        match engine.run() {
            Ok(results) => {
                models.push(ModelResult {
                    model_name: model_type.to_string(),
                    results,
                });
            }
            Err(e) => {
                eprintln!("Error running model {}: {}", model_type, e);
            }
        }
    }

    if models.is_empty() {
        return Err("No models successfully completed".into());
    }

    let best_by_aic = models
        .iter()
        .min_by(|a, b| {
            a.results
                .statistics
                .aic
                .partial_cmp(&b.results.statistics.aic)
                .unwrap()
        })
        .unwrap()
        .model_name
        .clone();

    let best_by_bic = models
        .iter()
        .min_by(|a, b| {
            a.results
                .statistics
                .bic
                .partial_cmp(&b.results.statistics.bic)
                .unwrap()
        })
        .unwrap()
        .model_name
        .clone();

    Ok(ModelComparison {
        models,
        best_by_aic,
        best_by_bic,
    })
}

pub fn print_comparison_summary(comparison: &ModelComparison) {
    println!("\n╔═══════════════════════════════════════════════════════════════════════════════╗");
    println!("║                         MODEL COMPARISON SUMMARY                              ║");
    println!("╚═══════════════════════════════════════════════════════════════════════════════╝\n");

    println!("┌───────────────────┬──────────────┬──────────────┬─────────────┬─────────────┐");
    println!("│ Model             │    -2LL      │     AIC      │     BIC     │  N Params   │");
    println!("├───────────────────┼──────────────┼──────────────┼─────────────┼─────────────┤");

    for model in &comparison.models {
        let stats = &model.results.statistics;
        let ll = model.results.log_likelihood;

        let aic_marker = if model.model_name == comparison.best_by_aic {
            "*"
        } else {
            " "
        };
        let bic_marker = if model.model_name == comparison.best_by_bic {
            "*"
        } else {
            " "
        };

        println!(
            "│ {:<17} │ {:12.2} │ {:11.2}{} │ {:10.2}{} │   {:6}    │",
            model.model_name,
            -2.0 * ll,
            stats.aic,
            aic_marker,
            stats.bic,
            bic_marker,
            stats.n_parameters
        );
    }

    println!("└───────────────────┴──────────────┴──────────────┴─────────────┴─────────────┘");
    println!("\n* indicates best model by criterion");
    println!("\nBest model by AIC: {}", comparison.best_by_aic);
    println!("Best model by BIC: {}", comparison.best_by_bic);
}

pub fn print_detailed_results(model: &ModelResult) {
    let results = &model.results;
    let stats = &results.statistics;
    let model_name = model.model_name.as_str();

    println!("\n╔═══════════════════════════════════════════════════════════════════════════════╗");
    println!("║                    DETAILED RESULTS: {:<41}║", model_name);
    println!("╚═══════════════════════════════════════════════════════════════════════════════╝");

    println!("\n┌─────────────────────────────────────────────────────────────────────────────┐");
    println!("│                         POPULATION PARAMETERS                               │");
    println!("├─────────────────────────────────────────────────────────────────────────────┤");

    let param_names = crate::models::create_model(model_name).parameter_names();

    println!("│ Parameter  │  Estimate  │    SE     │  RSE%   │  95% CI Lower  │  95% CI Upper  │");
    println!("├────────────┼────────────┼───────────┼─────────┼────────────────┼────────────────┤");

    for (i, param_name) in param_names.iter().enumerate() {
        if i < results.theta.len() {
            println!(
                "│ {:10} │ {:10.4} │ {:9.4} │ {:7.2} │ {:14.4} │ {:14.4} │",
                param_name,
                results.theta[i],
                stats.theta_se[i],
                stats.theta_rse[i],
                stats.theta_ci_lower[i],
                stats.theta_ci_upper[i]
            );
        }
    }

    println!("└────────────┴────────────┴───────────┴─────────┴────────────────┴────────────────┘");

    println!("\n┌─────────────────────────────────────────────────────────────────────────────┐");
    println!("│                         RANDOM EFFECTS (OMEGA)                              │");
    println!("├─────────────────────────────────────────────────────────────────────────────┤");

    let n_eta = results.omega.nrows();
    println!("│   Parameter   │  Estimate   │     SE      │   RSE%    │  Shrinkage%  │");
    println!("├───────────────┼─────────────┼─────────────┼───────────┼──────────────┤");

    for i in 0..n_eta {
        println!(
            "│ OMEGA[{},{}]    │  {:9.6}  │  {:9.6}  │  {:7.2}  │   {:8.2}   │",
            i,
            i,
            results.omega[(i, i)],
            stats.omega_se[(i, i)],
            stats.omega_rse[(i, i)],
            stats.shrinkage_eta[i]
        );
    }

    println!("└───────────────┴─────────────┴─────────────┴───────────┴──────────────┘");

    println!("\n┌─────────────────────────────────────────────────────────────────────────────┐");
    println!("│                         RESIDUAL ERROR                                      │");
    println!("├─────────────────────────────────────────────────────────────────────────────┤");

    println!("│ Parameter  │  Estimate  │    SE     │  RSE%   │  Shrinkage%  │");
    println!("├────────────┼────────────┼───────────┼─────────┼──────────────┤");
    println!(
        "│ SIGMA      │ {:10.6} │ {:9.6} │ {:7.2} │   {:8.2}   │",
        results.sigma, stats.sigma_se, stats.sigma_rse, stats.shrinkage_epsilon
    );

    println!("└────────────┴────────────┴───────────┴─────────┴──────────────┘");

    println!("\n┌─────────────────────────────────────────────────────────────────────────────┐");
    println!("│                         MODEL FIT STATISTICS                                │");
    println!("├─────────────────────────────────────────────────────────────────────────────┤");

    println!("│ Log-Likelihood:        {:18.4}                                    │", results.log_likelihood);
    println!("│ -2LL:                  {:18.4}                                    │", -2.0 * results.log_likelihood);
    println!("│ AIC:                   {:18.4}                                    │", stats.aic);
    println!("│ BIC:                   {:18.4}                                    │", stats.bic);
    println!("│ Number of observations: {:17}                                     │", stats.n_observations);
    println!("│ Number of subjects:     {:17}                                     │", stats.n_subjects);
    println!("│ Number of parameters:   {:17}                                     │", stats.n_parameters);

    println!("└─────────────────────────────────────────────────────────────────────────────┘");

    println!("\n┌─────────────────────────────────────────────────────────────────────────────┐");
    println!("│                         PARAMETER QUALITY CHECKS                            │");
    println!("├─────────────────────────────────────────────────────────────────────────────┤");

    let mut issues = Vec::new();

    for (i, param_name) in param_names.iter().enumerate() {
        if i < results.theta.len() {
            if results.theta[i] <= 0.0 {
                issues.push(format!("{} is non-positive ({})", param_name, results.theta[i]));
            }
            if stats.theta_rse[i] > 50.0 {
                issues.push(format!("{} has high RSE% ({:.1}%)", param_name, stats.theta_rse[i]));
            }
        }
    }

    for i in 0..n_eta {
        if stats.shrinkage_eta[i] > 30.0 {
            issues.push(format!("OMEGA[{},{}] has high shrinkage ({:.1}%)", i, i, stats.shrinkage_eta[i]));
        }
    }

    if stats.shrinkage_epsilon > 30.0 {
        issues.push(format!("Residual error has high shrinkage ({:.1}%)", stats.shrinkage_epsilon));
    }

    if issues.is_empty() {
        println!("│ ✓ All parameters passed quality checks                                     │");
    } else {
        println!("│ ⚠ Quality Issues Detected:                                                 │");
        for issue in issues {
            println!("│   - {:<73} │", issue);
        }
    }

    println!("└─────────────────────────────────────────────────────────────────────────────┘");
}
