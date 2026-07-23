use phikl1::comparison::{compare_models, print_comparison_summary, print_detailed_results};
use phikl1::config::Config;
use phikl1::dataset::Dataset;

fn main() {
    println!("╔════════════════════════════════════════════════════════════════════╗");
    println!("║  PHIKL1: Model Comparison Example                                 ║");
    println!("╚════════════════════════════════════════════════════════════════════╝\n");

    let config = Config::from_file("config_1comp.json")
        .expect("Failed to load configuration");

    let dataset = Dataset::from_file(&config.data.file)
        .expect("Failed to load dataset");

    println!("Dataset: {} observations from {} subjects\n",
             dataset.observations.len(), dataset.n_subjects);

    let models_to_compare = vec!["1comp", "2comp", "3comp"];

    println!("Comparing models: {:?}\n", models_to_compare);

    match compare_models(&models_to_compare, &dataset, &config) {
        Ok(comparison) => {
            print_comparison_summary(&comparison);

            println!("\n\n");
            println!("══════════════════════════════════════════════════════════════════════");
            println!("                    DETAILED MODEL RESULTS                            ");
            println!("══════════════════════════════════════════════════════════════════════");

            for model in &comparison.models {
                print_detailed_results(model);
            }

            println!("\n✓ Model comparison completed successfully!");
        }
        Err(e) => {
            eprintln!("✗ Error during model comparison: {}", e);
            std::process::exit(1);
        }
    }
}
