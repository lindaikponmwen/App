mod config;
mod dataset;
mod models;
mod saem;
mod reports;
mod utils;
mod comparison;
mod initial_estimates;
mod fo_estimation;
mod foce_estimation;
mod advanced_estimation;
mod robust_initials;
mod colors;
mod eta_optimizer;

use std::fs;
use std::path::Path;
use chrono::Local;

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: {} <config.json> [OPTIONS]", args[0]);
        eprintln!();
        eprintln!("Options:");
        eprintln!("  --o <directory>       Output directory (overrides config file)");
        eprintln!("  --data <file>         Data file path (overrides config file)");
        eprintln!("  --n_burn_in <num>     Number of burn-in iterations");
        eprintln!("  --n_iter <num>        Number of estimation iterations");
        eprintln!("  --n_chains <num>      Number of chains");
        eprintln!("  --seed <num>          Random seed");
        eprintln!("  --auto_init <0|1>     Auto-derive THETA only (0=use config, 1=auto). OMEGA/SIGMA from config.");
        eprintln!("  --method <method>     Estimation method (SAEM, FO, FOCE, FOCE-I)");
        eprintln!();
        eprintln!("Example:");
        eprintln!("  {} config.json", args[0]);
        eprintln!("  {} config.json --o results --data mydata.csv --n_iter 500", args[0]);
        eprintln!("  {} config.json --auto_init 1", args[0]);
        std::process::exit(1);
    }

    let config_path = &args[1];

    let mut output_override: Option<String> = None;
    let mut data_override: Option<String> = None;
    let mut n_burn_in_override: Option<usize> = None;
    let mut n_iter_override: Option<usize> = None;
    let mut n_chains_override: Option<usize> = None;
    let mut seed_override: Option<u64> = None;
    let mut auto_init: bool = false;
    let mut method_override: Option<String> = None;

    let mut i = 2;
    while i < args.len() {
        match args[i].as_str() {
            "--o" => {
                if i + 1 < args.len() {
                    output_override = Some(args[i + 1].clone());
                    i += 2;
                } else {
                    eprintln!("✗ Error: --o requires a directory path");
                    std::process::exit(1);
                }
            },
            "--data" => {
                if i + 1 < args.len() {
                    data_override = Some(args[i + 1].clone());
                    i += 2;
                } else {
                    eprintln!("✗ Error: --data requires a file path");
                    std::process::exit(1);
                }
            },
            "--n_burn_in" => {
                if i + 1 < args.len() {
                    match args[i + 1].parse::<usize>() {
                        Ok(val) => n_burn_in_override = Some(val),
                        Err(_) => {
                            eprintln!("✗ Error: --n_burn_in requires a positive integer");
                            std::process::exit(1);
                        }
                    }
                    i += 2;
                } else {
                    eprintln!("✗ Error: --n_burn_in requires a value");
                    std::process::exit(1);
                }
            },
            "--n_iter" => {
                if i + 1 < args.len() {
                    match args[i + 1].parse::<usize>() {
                        Ok(val) => n_iter_override = Some(val),
                        Err(_) => {
                            eprintln!("✗ Error: --n_iter requires a positive integer");
                            std::process::exit(1);
                        }
                    }
                    i += 2;
                } else {
                    eprintln!("✗ Error: --n_iter requires a value");
                    std::process::exit(1);
                }
            },
            "--n_chains" => {
                if i + 1 < args.len() {
                    match args[i + 1].parse::<usize>() {
                        Ok(val) => n_chains_override = Some(val),
                        Err(_) => {
                            eprintln!("✗ Error: --n_chains requires a positive integer");
                            std::process::exit(1);
                        }
                    }
                    i += 2;
                } else {
                    eprintln!("✗ Error: --n_chains requires a value");
                    std::process::exit(1);
                }
            },
            "--seed" => {
                if i + 1 < args.len() {
                    match args[i + 1].parse::<u64>() {
                        Ok(val) => seed_override = Some(val),
                        Err(_) => {
                            eprintln!("✗ Error: --seed requires a positive integer");
                            std::process::exit(1);
                        }
                    }
                    i += 2;
                } else {
                    eprintln!("✗ Error: --seed requires a value");
                    std::process::exit(1);
                }
            },
            "--auto_init" => {
                if i + 1 < args.len() {
                    match args[i + 1].as_str() {
                        "0" => auto_init = false,
                        "1" => auto_init = true,
                        _ => {
                            eprintln!("✗ Error: --auto_init requires 0 or 1");
                            std::process::exit(1);
                        }
                    }
                    i += 2;
                } else {
                    eprintln!("✗ Error: --auto_init requires a value (0 or 1)");
                    std::process::exit(1);
                }
            },
            "--method" => {
                if i + 1 < args.len() {
                    let method = args[i + 1].to_uppercase();
                    match method.as_str() {
                        "SAEM" | "FO" | "FOCE" | "FOCE-I" => {
                            method_override = Some(method);
                        },
                        _ => {
                            eprintln!("✗ Error: --method must be SAEM, FO, FOCE, or FOCE-I");
                            std::process::exit(1);
                        }
                    }
                    i += 2;
                } else {
                    eprintln!("✗ Error: --method requires a value");
                    std::process::exit(1);
                }
            },
            _ => {
                eprintln!("✗ Warning: Unknown option '{}'", args[i]);
                i += 1;
            }
        }
    }

    println!("{}", colors::blue_header("PHIKL1 - Population Pharmacokinetics", 140));
    println!();
    println!("Run started at: {}", Local::now().format("%Y-%m-%d %H:%M:%S"));
    println!();

    let mut config = match config::Config::from_file(config_path) {
        Ok(cfg) => {
            println!("✓ Configuration loaded successfully from: {}", config_path);
            cfg
        },
        Err(e) => {
            eprintln!("✗ Error loading configuration: {}", e);
            std::process::exit(1);
        }
    };

    if let Some(output_dir) = output_override {
        println!("✓ Output directory overridden to: {}", output_dir);
        config.output.directory = output_dir;
    }

    if let Some(data_file) = data_override {
        println!("✓ Data file overridden to: {}", data_file);
        config.data.file = data_file;
    }

    if let Some(n_burn_in) = n_burn_in_override {
        println!("✓ Burn-in iterations overridden to: {}", n_burn_in);
        config.estimation.n_burn_in = n_burn_in;
    }

    if let Some(n_iter) = n_iter_override {
        println!("✓ Estimation iterations overridden to: {}", n_iter);
        config.estimation.n_iter = n_iter;
    }

    if let Some(n_chains) = n_chains_override {
        println!("✓ Number of chains overridden to: {}", n_chains);
        config.estimation.n_chains = n_chains;
    }

    if let Some(seed) = seed_override {
        println!("✓ Random seed overridden to: {}", seed);
        config.estimation.seed = seed;
    }

    if let Some(method) = method_override {
        use config::EstimationMethod;
        let est_method = match method.as_str() {
            "SAEM" => EstimationMethod::SAEM,
            "FO" => EstimationMethod::FO,
            "FOCE" => EstimationMethod::FOCE,
            "FOCE-I" => EstimationMethod::FOCEI,
            _ => EstimationMethod::SAEM,
        };
        println!("✓ Estimation method overridden to: {:?}", est_method);
        config.estimation.method = est_method;
    }

    let dataset = match dataset::Dataset::from_file(&config.data.file) {
        Ok(ds) => {
            println!("✓ Dataset loaded successfully: {} observations from {} subjects",
                     ds.observations.len(), ds.n_subjects);
            ds
        },
        Err(e) => {
            eprintln!("✗ Error loading dataset: {}", e);
            std::process::exit(1);
        }
    };

    if auto_init {
        let robust_estimates = robust_initials::get_robust_initial_estimates(&config, &dataset);

        println!("\n  Original Configuration:");
        println!("    THETA:  {:?}", config.parameters.theta);
        println!("    OMEGA:  {:?}", config.parameters.omega.get(0).unwrap_or(&vec![0.0]));
        println!("    SIGMA:  {}", config.parameters.sigma);

        println!("\n  ✓ Applying Auto-Init (THETA only):");
        println!("    THETA:  {:?}", robust_estimates.theta);
        println!("    OMEGA:  Using config values (not estimated)");
        println!("    SIGMA:  Using config values (not estimated)");

        if let Some(ref constraints) = config.parameters.constraints {
            if let Some(ref theta_fixed) = constraints.theta_fixed {
                for (i, &is_fixed) in theta_fixed.iter().enumerate() {
                    if i < config.parameters.theta.len() && i < robust_estimates.theta.len() {
                        if !is_fixed {
                            config.parameters.theta[i] = robust_estimates.theta[i];
                        }
                    }
                }
                println!("\n  ⓘ Fixed THETA parameters preserved: {:?}",
                         theta_fixed.iter().enumerate()
                             .filter(|(_, &f)| f)
                             .map(|(i, _)| i)
                             .collect::<Vec<_>>());
            } else {
                config.parameters.theta = robust_estimates.theta;
            }
        } else {
            config.parameters.theta = robust_estimates.theta;
        }
    }

    println!();
    println!("{}", colors::yellow_stars(140));
    println!("{}  CONFIGURATION  {}", colors::YELLOW, colors::RESET);
    println!("{}", colors::yellow_stars(140));
    println!();
    println!("Model Type: {}", config.model.model_type);
    println!("Estimation Method: {:?}", config.estimation.method);
    println!("Fixed Effects (THETA): {}", config.parameters.theta.len());
    println!("Initial THETA values:");
    for (i, &theta) in config.parameters.theta.iter().enumerate() {
        let name = config.get_theta_name(i);
        let desc = config.get_theta_description(i);
        if desc != name {
            println!("    {} ({}) = {:.6}", name, desc, theta);
        } else {
            println!("    {} = {:.6}", name, theta);
        }
    }
    println!("  Random Effects (OMEGA): {}x{}",
             config.parameters.omega.len(),
             config.parameters.omega.len());
    println!("  Residual Error (SIGMA): {}", config.parameters.sigma);
    println!();
    println!("Estimation Settings:");
    println!("  Burn-in iterations: {}", config.estimation.n_burn_in);
    println!("  Estimation iterations: {}", config.estimation.n_iter);
    println!("  Number of chains: {}", config.estimation.n_chains);
    println!("  Auto-derived initial parameters: {}", if auto_init { "Yes" } else { "No" });
    println!();
    println!("{}", colors::blue_stars(140));
    println!("{}  ESTIMATION  {}", colors::BLUE, colors::RESET);
    println!("{}", colors::blue_stars(140));
    println!();

    use config::EstimationMethod;

    let results = match config.estimation.method {
        EstimationMethod::SAEM => {
            let mut engine = saem::SaemEngine::new(config.clone(), dataset.clone());
            engine.run()
        },
        EstimationMethod::FO => {
            let mut engine = fo_estimation::FoEstimator::new(config.clone(), dataset.clone());
            engine.estimate()
        },
        EstimationMethod::FOCE => {
            let mut engine = foce_estimation::FoceEstimator::new(config.clone(), dataset.clone(), false);
            engine.estimate()
        },
        EstimationMethod::FOCEI => {
            let mut engine = foce_estimation::FoceEstimator::new(config.clone(), dataset.clone(), true);
            engine.estimate()
        },
    };

    match results {
        Ok(results) => {
            println!();
            println!("{}", colors::green_header("MINIMIZATION SUCCESSFUL", 140));
            println!();

            let output_dir = Path::new(&config.output.directory);
            fs::create_dir_all(output_dir).expect("Failed to create output directory");

            println!("Generating reports...");

            if let Err(e) = reports::generate_all_reports(&results, &dataset, &config) {
                eprintln!("✗ Error generating reports: {}", e);
                std::process::exit(1);
            }

            println!();
            println!("All reports generated successfully in: {}", config.output.directory);
            println!("  - {}/summary.txt", config.output.directory);
            println!("  - {}/individual_predictions.csv", config.output.directory);
            println!("  - {}/population_parameters.csv", config.output.directory);
            println!("  - {}/run.log", config.output.directory);
            println!();
            println!("Run completed at: {}", Local::now().format("%Y-%m-%d %H:%M:%S"));
        },
        Err(e) => {
            eprintln!();
            eprintln!("✗ SAEM estimation failed: {}", e);
            std::process::exit(1);
        }
    }
}
