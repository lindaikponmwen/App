use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use indexmap::IndexMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ErrorModel {
    Additive,
    Proportional,
    Combined,
}

impl Default for ErrorModel {
    fn default() -> Self {
        ErrorModel::Combined
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum EstimationMethod {
    SAEM,
    FO,
    FOCE,
    #[serde(rename = "FOCE-I")]
    FOCEI,
}

impl Default for EstimationMethod {
    fn default() -> Self {
        EstimationMethod::SAEM
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub model: ModelConfig,
    pub data: DataConfig,
    pub parameters: ParameterConfig,
    pub estimation: EstimationConfig,
    pub output: OutputConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum CustomODEConfig {
    Description(String),
    Specification(CustomODESpec),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomODESpec {
    pub n_compartments: usize,
    pub parameters: Vec<String>,
    pub equations: Vec<String>,
    pub observation_compartment: usize,
    #[serde(default)]
    pub observation_scaling: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    pub model_type: String,
    #[serde(default)]
    pub custom_ode: Option<CustomODEConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataConfig {
    pub file: String,
    #[serde(default = "default_id_col")]
    pub id_column: String,
    #[serde(default = "default_time_col")]
    pub time_column: String,
    #[serde(default = "default_dv_col")]
    pub dv_column: String,
    #[serde(default = "default_amt_col")]
    pub amt_column: String,
    #[serde(default = "default_evid_col")]
    pub evid_column: String,
    #[serde(default)]
    pub covariates: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParameterConfig {
    #[serde(deserialize_with = "deserialize_theta")]
    pub theta: Vec<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub theta_names: Option<IndexMap<String, String>>,
    #[serde(deserialize_with = "deserialize_omega")]
    pub omega: Vec<Vec<f64>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub omega_names: Option<IndexMap<String, String>>,
    pub sigma: f64,
    #[serde(default)]
    pub constraints: Option<ParameterConstraints>,
    #[serde(default)]
    pub error_model: ErrorModel,
    #[serde(default)]
    pub sigma_proportional: Option<f64>,
}

fn deserialize_theta<'de, D>(deserializer: D) -> Result<Vec<f64>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::Error;

    #[derive(Deserialize)]
    #[serde(untagged)]
    enum ThetaInput {
        Array(Vec<f64>),
        Map(IndexMap<String, f64>),
    }

    match ThetaInput::deserialize(deserializer)? {
        ThetaInput::Array(arr) => Ok(arr),
        ThetaInput::Map(map) => Ok(map.values().copied().collect()),
    }
}

fn deserialize_omega<'de, D>(deserializer: D) -> Result<Vec<Vec<f64>>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::Error;

    #[derive(Deserialize)]
    #[serde(untagged)]
    enum OmegaInput {
        Array(Vec<Vec<f64>>),
        Map(IndexMap<String, f64>),
    }

    match OmegaInput::deserialize(deserializer)? {
        OmegaInput::Array(arr) => Ok(arr),
        OmegaInput::Map(map) => {
            let n = map.len();
            let mut omega = vec![vec![0.0; n]; n];
            for (i, &val) in map.values().enumerate() {
                omega[i][i] = val;
            }
            Ok(omega)
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParameterConstraints {
    #[serde(default)]
    pub theta_lower: Option<Vec<f64>>,
    #[serde(default)]
    pub theta_upper: Option<Vec<f64>>,
    #[serde(default)]
    pub omega_lower: Option<Vec<Vec<f64>>>,
    #[serde(default)]
    pub omega_upper: Option<Vec<Vec<f64>>>,
    #[serde(default)]
    pub theta_fixed: Option<Vec<bool>>,
    #[serde(default)]
    pub omega_fixed: Option<Vec<bool>>,
    #[serde(default)]
    pub sigma_fixed: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EstimationConfig {
    #[serde(default)]
    pub method: EstimationMethod,
    #[serde(default = "default_burn_in")]
    pub n_burn_in: usize,
    #[serde(default = "default_iter")]
    pub n_iter: usize,
    #[serde(default = "default_chains")]
    pub n_chains: usize,
    #[serde(default = "default_seed")]
    pub seed: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputConfig {
    #[serde(default = "default_output_dir")]
    pub directory: String,
}

fn default_id_col() -> String { "ID".to_string() }
fn default_time_col() -> String { "TIME".to_string() }
fn default_dv_col() -> String { "DV".to_string() }
fn default_amt_col() -> String { "AMT".to_string() }
fn default_evid_col() -> String { "EVID".to_string() }
fn default_burn_in() -> usize { 200 }
fn default_iter() -> usize { 500 }
fn default_chains() -> usize { 3 }
fn default_seed() -> u64 { 12345 }
fn default_output_dir() -> String { "output".to_string() }

impl Config {
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let mut config: Config = serde_json::from_str(&content)?;

        let value: serde_json::Value = serde_json::from_str(&content)?;

        if let Some(params) = value.get("parameters") {
            if let Some(theta_obj) = params.get("theta") {
                if let Some(theta_map) = theta_obj.as_object() {
                    let model = crate::models::create_model_from_config(&config.model);
                    let model_param_names = model.parameter_names();

                    let mut theta_values = Vec::new();
                    let mut theta_names = IndexMap::new();

                    for param_name in &model_param_names {
                        if let Some(value) = theta_map.get(param_name) {
                            if let Some(val) = value.as_f64() {
                                theta_values.push(val);
                                theta_names.insert(param_name.clone(), param_name.clone());
                            }
                        }
                    }

                    if theta_values.len() == model_param_names.len() {
                        config.parameters.theta = theta_values;
                        config.parameters.theta_names = Some(theta_names);
                    }
                }
            }

            if let Some(theta_names_obj) = params.get("theta_names") {
                if let Some(names_map) = theta_names_obj.as_object() {
                    if let Some(existing) = &mut config.parameters.theta_names {
                        for (key, _) in existing.clone() {
                            if let Some(desc_val) = names_map.get(&key) {
                                if let Some(desc) = desc_val.as_str() {
                                    existing.insert(key.clone(), desc.to_string());
                                }
                            }
                        }
                    }
                }
            }

            if let Some(omega_obj) = params.get("omega") {
                if let Some(omega_map) = omega_obj.as_object() {
                    let model = crate::models::create_model_from_config(&config.model);
                    let model_param_names = model.parameter_names();

                    let mut omega_values = Vec::new();
                    let mut omega_names = IndexMap::new();

                    for param_name in &model_param_names {
                        if let Some(value) = omega_map.get(param_name) {
                            if let Some(val) = value.as_f64() {
                                omega_values.push(val);
                                omega_names.insert(param_name.clone(), param_name.clone());
                            }
                        }
                    }

                    if omega_values.len() == model_param_names.len() {
                        let n = omega_values.len();
                        let mut omega = vec![vec![0.0; n]; n];
                        for (i, &val) in omega_values.iter().enumerate() {
                            omega[i][i] = val;
                        }
                        config.parameters.omega = omega;
                    }
                    config.parameters.omega_names = Some(omega_names);
                }
            }

            if let Some(omega_names_obj) = params.get("omega_names") {
                if let Some(names_map) = omega_names_obj.as_object() {
                    if let Some(existing) = &mut config.parameters.omega_names {
                        for (key, _) in existing.clone() {
                            if let Some(desc_val) = names_map.get(&key) {
                                if let Some(desc) = desc_val.as_str() {
                                    existing.insert(key.clone(), desc.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(config)
    }

    pub fn get_theta_name(&self, index: usize) -> String {
        if let Some(names) = &self.parameters.theta_names {
            if let Some((key, _)) = names.get_index(index) {
                return key.clone();
            }
        }
        format!("THETA{}", index + 1)
    }

    pub fn get_theta_description(&self, index: usize) -> String {
        if let Some(names) = &self.parameters.theta_names {
            if let Some((_, desc)) = names.get_index(index) {
                return desc.clone();
            }
        }
        format!("THETA{}", index + 1)
    }

    pub fn get_omega_name(&self, index: usize) -> String {
        if let Some(names) = &self.parameters.omega_names {
            if let Some((key, _)) = names.get_index(index) {
                return key.clone();
            }
        }
        format!("OMEGA{}", index + 1)
    }

    pub fn get_omega_description(&self, index: usize) -> String {
        if let Some(names) = &self.parameters.omega_names {
            if let Some((_, desc)) = names.get_index(index) {
                return desc.clone();
            }
        }
        format!("OMEGA{}", index + 1)
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.parameters.theta.is_empty() {
            return Err("THETA parameters cannot be empty".to_string());
        }

        if self.parameters.omega.is_empty() {
            return Err("OMEGA matrix cannot be empty".to_string());
        }

        let n_eta = self.parameters.omega.len();
        for row in &self.parameters.omega {
            if row.len() != n_eta {
                return Err("OMEGA matrix must be square".to_string());
            }
        }

        if self.parameters.sigma <= 0.0 {
            return Err("SIGMA must be positive".to_string());
        }

        if let Some(ref constraints) = self.parameters.constraints {
            if let Some(ref lower) = constraints.theta_lower {
                if lower.len() != self.parameters.theta.len() {
                    return Err("theta_lower must have the same length as theta".to_string());
                }
            }
            if let Some(ref upper) = constraints.theta_upper {
                if upper.len() != self.parameters.theta.len() {
                    return Err("theta_upper must have the same length as theta".to_string());
                }
            }
            if let (Some(ref lower), Some(ref upper)) = (&constraints.theta_lower, &constraints.theta_upper) {
                for (i, (l, u)) in lower.iter().zip(upper.iter()).enumerate() {
                    if l >= u {
                        return Err(format!("theta_lower[{}] must be less than theta_upper[{}]", i, i));
                    }
                }
            }
        }

        Ok(())
    }
}
