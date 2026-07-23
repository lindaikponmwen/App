use evalexpr::*;

pub trait PharmacokineticModel: Send + Sync {
    fn predict(&self, time: f64, params: &[f64], state: &mut ModelState) -> f64;
    fn n_parameters(&self) -> usize;
    fn parameter_names(&self) -> Vec<String>;
}

#[derive(Debug, Clone)]
pub struct ModelState {
    pub compartments: Vec<f64>,
    pub last_time: f64,
}

impl ModelState {
    pub fn new(n_compartments: usize) -> Self {
        Self {
            compartments: vec![0.0; n_compartments],
            last_time: 0.0,
        }
    }

    pub fn add_dose(&mut self, amount: f64, compartment: usize) {
        if compartment < self.compartments.len() {
            self.compartments[compartment] += amount;
        }
    }
}

pub struct OneCompartmentModel {
    pub n_params: usize,
}

impl OneCompartmentModel {
    pub fn new() -> Self {
        Self { n_params: 3 }
    }
}

impl PharmacokineticModel for OneCompartmentModel {
    fn predict(&self, time: f64, params: &[f64], state: &mut ModelState) -> f64 {
        if params.len() < 3 {
            return 0.0;
        }

        let cl = params[0];
        let v = params[1];
        let ka = params[2];

        let ke = cl / v;
        let dt = time - state.last_time;

        if dt > 0.0 {
            let depot = state.compartments[0];
            let central = state.compartments[1];

            let new_depot = depot * (-ka * dt).exp();

            let new_central = central * (-ke * dt).exp() +
                              depot * ka / (ka - ke) * ((-ke * dt).exp() - (-ka * dt).exp());

            state.compartments[0] = new_depot;
            state.compartments[1] = new_central;
            state.last_time = time;
        }

        state.compartments[1] / v
    }

    fn n_parameters(&self) -> usize {
        self.n_params
    }

    fn parameter_names(&self) -> Vec<String> {
        vec!["CL".to_string(), "V".to_string(), "KA".to_string()]
    }
}

pub struct TwoCompartmentModel {
    pub n_params: usize,
}

impl TwoCompartmentModel {
    pub fn new() -> Self {
        Self { n_params: 5 }
    }
}

impl PharmacokineticModel for TwoCompartmentModel {
    fn predict(&self, time: f64, params: &[f64], state: &mut ModelState) -> f64 {
        if params.len() < 5 {
            return 0.0;
        }

        let cl = params[0];
        let v1 = params[1];
        let v2 = params[2];
        let q = params[3];
        let ka = params[4];

        let k10 = cl / v1;
        let k12 = q / v1;
        let k21 = q / v2;

        let dt = time - state.last_time;

        if dt > 0.0 {
            let depot = state.compartments[0];
            let central = state.compartments[1];
            let peripheral = state.compartments[2];

            let new_depot = depot * (-ka * dt).exp();

            let beta = 0.5 * ((k10 + k12 + k21) -
                             ((k10 + k12 + k21).powi(2) - 4.0 * k10 * k21).sqrt());
            let alpha = (k10 * k21) / beta;

            let a_coeff = (k21 - alpha) / (beta - alpha);
            let b_coeff = (k21 - beta) / (alpha - beta);

            let new_central_from_depot = depot * ka / ((ka - alpha) * (beta - alpha)) * (k21 - alpha) *
                                         ((-alpha * dt).exp() - (-ka * dt).exp()) +
                                         depot * ka / ((ka - beta) * (alpha - beta)) * (k21 - beta) *
                                         ((-beta * dt).exp() - (-ka * dt).exp());

            let new_central_from_central = central * a_coeff * (-alpha * dt).exp() +
                                           central * b_coeff * (-beta * dt).exp();

            let new_central = new_central_from_central + new_central_from_depot;

            let new_peripheral_from_depot = depot * ka * k12 / ((ka - alpha) * (beta - alpha)) *
                                            ((-alpha * dt).exp() - (-ka * dt).exp()) / (k21 - alpha) +
                                            depot * ka * k12 / ((ka - beta) * (alpha - beta)) *
                                            ((-beta * dt).exp() - (-ka * dt).exp()) / (k21 - beta);

            let new_peripheral_from_central = central * k12 / (beta - alpha) *
                                              (((-alpha * dt).exp() - (-beta * dt).exp()));

            let new_peripheral_from_peripheral = peripheral * k12 / (beta - alpha) *
                                                 ((k21 - alpha) / (k21 - beta) * (-beta * dt).exp() -
                                                  (k21 - beta) / (k21 - alpha) * (-alpha * dt).exp());

            let new_peripheral = new_peripheral_from_peripheral + new_peripheral_from_central + new_peripheral_from_depot;

            state.compartments[0] = new_depot;
            state.compartments[1] = new_central;
            state.compartments[2] = new_peripheral;
            state.last_time = time;
        }

        state.compartments[1] / v1
    }

    fn n_parameters(&self) -> usize {
        self.n_params
    }

    fn parameter_names(&self) -> Vec<String> {
        vec![
            "CL".to_string(),
            "V1".to_string(),
            "V2".to_string(),
            "Q".to_string(),
            "KA".to_string(),
        ]
    }
}

pub struct CustomODEModel {
    pub n_params: usize,
    pub param_names: Vec<String>,
}

impl CustomODEModel {
    pub fn new(n_params: usize, param_names: Vec<String>) -> Self {
        Self { n_params, param_names }
    }
}

impl PharmacokineticModel for CustomODEModel {
    fn predict(&self, time: f64, params: &[f64], state: &mut ModelState) -> f64 {
        let dt = time - state.last_time;

        if dt > 0.0 && !params.is_empty() {
            let steps = ((dt / 0.1).ceil() as usize).max(1);
            let h = dt / steps as f64;

            for _ in 0..steps {
                let k1 = self.compute_derivatives(&state.compartments, params);

                let mut temp: Vec<f64> = state.compartments.iter()
                    .zip(k1.iter())
                    .map(|(c, k)| c + 0.5 * h * k)
                    .collect();
                let k2 = self.compute_derivatives(&temp, params);

                temp = state.compartments.iter()
                    .zip(k2.iter())
                    .map(|(c, k)| c + 0.5 * h * k)
                    .collect();
                let k3 = self.compute_derivatives(&temp, params);

                temp = state.compartments.iter()
                    .zip(k3.iter())
                    .map(|(c, k)| c + h * k)
                    .collect();
                let k4 = self.compute_derivatives(&temp, params);

                for i in 0..state.compartments.len() {
                    state.compartments[i] += h / 6.0 * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]);
                }
            }

            state.last_time = time;
        }

        state.compartments.get(1).copied().unwrap_or(0.0) / params.get(1).copied().unwrap_or(1.0)
    }

    fn n_parameters(&self) -> usize {
        self.n_params
    }

    fn parameter_names(&self) -> Vec<String> {
        self.param_names.clone()
    }
}

impl CustomODEModel {
    fn compute_derivatives(&self, compartments: &[f64], params: &[f64]) -> Vec<f64> {
        if params.len() < 3 || compartments.len() < 2 {
            return vec![0.0; compartments.len()];
        }

        let cl = params[0];
        let v = params[1];
        let ka = params[2];
        let ke = cl / v;

        let mut derivatives = vec![0.0; compartments.len()];
        derivatives[0] = -ka * compartments[0];
        derivatives[1] = ka * compartments[0] - ke * compartments[1];

        derivatives
    }
}

pub struct TwoCompartmentODEModel {
    pub n_params: usize,
}

impl TwoCompartmentODEModel {
    pub fn new() -> Self {
        Self { n_params: 5 }
    }
}

impl PharmacokineticModel for TwoCompartmentODEModel {
    fn predict(&self, time: f64, params: &[f64], state: &mut ModelState) -> f64 {
        if params.len() < 5 {
            return 0.0;
        }

        let dt = time - state.last_time;

        if dt > 0.0 {
            let steps = ((dt / 0.1).ceil() as usize).max(1);
            let h = dt / steps as f64;

            for _ in 0..steps {
                let k1 = self.compute_derivatives(&state.compartments, params);

                let mut temp: Vec<f64> = state.compartments.iter()
                    .zip(k1.iter())
                    .map(|(c, k)| c + 0.5 * h * k)
                    .collect();
                let k2 = self.compute_derivatives(&temp, params);

                temp = state.compartments.iter()
                    .zip(k2.iter())
                    .map(|(c, k)| c + 0.5 * h * k)
                    .collect();
                let k3 = self.compute_derivatives(&temp, params);

                temp = state.compartments.iter()
                    .zip(k3.iter())
                    .map(|(c, k)| c + h * k)
                    .collect();
                let k4 = self.compute_derivatives(&temp, params);

                for i in 0..state.compartments.len() {
                    state.compartments[i] += h / 6.0 * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]);
                }
            }

            state.last_time = time;
        }

        state.compartments.get(1).copied().unwrap_or(0.0) / params.get(1).copied().unwrap_or(1.0)
    }

    fn n_parameters(&self) -> usize {
        self.n_params
    }

    fn parameter_names(&self) -> Vec<String> {
        vec![
            "CL".to_string(),
            "V1".to_string(),
            "V2".to_string(),
            "Q".to_string(),
            "KA".to_string(),
        ]
    }
}

impl TwoCompartmentODEModel {
    fn compute_derivatives(&self, compartments: &[f64], params: &[f64]) -> Vec<f64> {
        if params.len() < 5 || compartments.len() < 3 {
            return vec![0.0; compartments.len()];
        }

        let cl = params[0];
        let v1 = params[1];
        let v2 = params[2];
        let q = params[3];
        let ka = params[4];

        let k10 = cl / v1;
        let k12 = q / v1;
        let k21 = q / v2;

        let depot = compartments[0];
        let central = compartments[1];
        let peripheral = compartments[2];

        let mut derivatives = vec![0.0; compartments.len()];
        derivatives[0] = -ka * depot;
        derivatives[1] = ka * depot - k10 * central - k12 * central + k21 * peripheral;
        derivatives[2] = k12 * central - k21 * peripheral;

        derivatives
    }
}

pub struct DynamicODEModel {
    pub n_compartments: usize,
    pub param_names: Vec<String>,
    pub equations: Vec<String>,
    pub observation_compartment: usize,
    pub observation_scaling: Option<String>,
}

impl DynamicODEModel {
    pub fn new(
        n_compartments: usize,
        param_names: Vec<String>,
        equations: Vec<String>,
        observation_compartment: usize,
        observation_scaling: Option<String>,
    ) -> Self {
        Self {
            n_compartments,
            param_names,
            equations,
            observation_compartment,
            observation_scaling,
        }
    }

    fn compute_derivatives(&self, compartments: &[f64], params: &[f64]) -> Vec<f64> {
        let mut derivatives = vec![0.0; compartments.len()];

        for (i, equation) in self.equations.iter().enumerate() {
            if i >= derivatives.len() {
                break;
            }

            let mut context = HashMapContext::new();

            for (j, compartment_value) in compartments.iter().enumerate() {
                context
                    .set_value(format!("A[{}]", j), (*compartment_value).into())
                    .ok();
            }

            for (j, (param_name, param_value)) in
                self.param_names.iter().zip(params.iter()).enumerate()
            {
                context.set_value(param_name.clone(), (*param_value).into()).ok();
                context.set_value(format!("P[{}]", j), (*param_value).into()).ok();
            }

            match eval_with_context(equation, &context) {
                Ok(value) => {
                    if let Ok(f) = value.as_float() {
                        derivatives[i] = f;
                    }
                }
                Err(_) => {
                    derivatives[i] = 0.0;
                }
            }
        }

        derivatives
    }
}

impl PharmacokineticModel for DynamicODEModel {
    fn predict(&self, time: f64, params: &[f64], state: &mut ModelState) -> f64 {
        let dt = time - state.last_time;

        if dt > 0.0 {
            let steps = ((dt / 0.1).ceil() as usize).max(1);
            let h = dt / steps as f64;

            for _ in 0..steps {
                let k1 = self.compute_derivatives(&state.compartments, params);

                let mut temp: Vec<f64> = state
                    .compartments
                    .iter()
                    .zip(k1.iter())
                    .map(|(c, k)| c + 0.5 * h * k)
                    .collect();
                let k2 = self.compute_derivatives(&temp, params);

                temp = state
                    .compartments
                    .iter()
                    .zip(k2.iter())
                    .map(|(c, k)| c + 0.5 * h * k)
                    .collect();
                let k3 = self.compute_derivatives(&temp, params);

                temp = state
                    .compartments
                    .iter()
                    .zip(k3.iter())
                    .map(|(c, k)| c + h * k)
                    .collect();
                let k4 = self.compute_derivatives(&temp, params);

                for i in 0..state.compartments.len() {
                    state.compartments[i] += h / 6.0 * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]);
                }
            }

            state.last_time = time;
        }

        let concentration = state
            .compartments
            .get(self.observation_compartment)
            .copied()
            .unwrap_or(0.0);

        if let Some(scaling_expr) = &self.observation_scaling {
            let mut context = HashMapContext::new();

            for (param_name, param_value) in self.param_names.iter().zip(params.iter()) {
                context.set_value(param_name.clone(), (*param_value).into()).ok();
            }

            match eval_with_context(scaling_expr, &context) {
                Ok(value) => {
                    if let Ok(scaling_value) = value.as_float() {
                        if scaling_value != 0.0 {
                            return concentration / scaling_value;
                        }
                    }
                }
                Err(_) => {
                    return concentration;
                }
            }
        }

        concentration
    }

    fn n_parameters(&self) -> usize {
        self.param_names.len()
    }

    fn parameter_names(&self) -> Vec<String> {
        self.param_names.clone()
    }
}

pub struct ThreeCompartmentModel {
    pub n_params: usize,
}

impl ThreeCompartmentModel {
    pub fn new() -> Self {
        Self { n_params: 7 }
    }
}

impl PharmacokineticModel for ThreeCompartmentModel {
    fn predict(&self, time: f64, params: &[f64], state: &mut ModelState) -> f64 {
        if params.len() < 7 {
            return 0.0;
        }

        let cl = params[0];
        let v1 = params[1];
        let v2 = params[2];
        let v3 = params[3];
        let q2 = params[4];
        let q3 = params[5];
        let ka = params[6];

        let k10 = cl / v1;
        let k12 = q2 / v1;
        let k21 = q2 / v2;
        let k13 = q3 / v1;
        let k31 = q3 / v3;

        let dt = time - state.last_time;

        if dt > 0.0 {
            let depot = state.compartments[0];
            let central = state.compartments[1];
            let peripheral2 = state.compartments[2];
            let peripheral3 = state.compartments[3];

            let new_depot = depot * (-ka * dt).exp();

            let a0 = k10 * k21 * k31;
            let a1 = k10 * k31 + k21 * k31 + k21 * k13 + k10 * k21 + k31 * k12;
            let a2 = k10 + k12 + k13 + k21 + k31;
            let p = a1 - a2.powi(2) / 3.0;
            let q = 2.0 * a2.powi(3) / 27.0 - a1 * a2 / 3.0 + a0;
            let r1 = (-p.powi(3) / 27.0).sqrt();
            let r2 = 2.0 * r1.powf(1.0 / 3.0);
            let phi = ((-q / (2.0 * r1)).clamp(-1.0, 1.0)).acos() / 3.0;

            let alpha = -(phi.cos() * r2 - a2 / 3.0);
            let beta = -((phi + 2.0 * std::f64::consts::PI / 3.0).cos() * r2 - a2 / 3.0);
            let gamma = -((phi + 4.0 * std::f64::consts::PI / 3.0).cos() * r2 - a2 / 3.0);

            let a_coeff = (k21 - alpha) / (alpha - beta) * (k31 - alpha) / (alpha - gamma);
            let b_coeff = (k21 - beta) / (beta - alpha) * (k31 - beta) / (beta - gamma);
            let c_coeff = (k21 - gamma) / (gamma - beta) * (k31 - gamma) / (gamma - alpha);

            let new_central_from_depot = depot * ka / (ka - alpha) / (beta - alpha) / (alpha - gamma) *
                                         (k21 - alpha) * (k31 - alpha) * ((-alpha * dt).exp() - (-ka * dt).exp()) +
                                         depot * ka / (ka - beta) / (alpha - beta) / (beta - gamma) *
                                         (k21 - beta) * (k31 - beta) * ((-beta * dt).exp() - (-ka * dt).exp()) +
                                         depot * ka / (ka - gamma) / (gamma - beta) / (gamma - alpha) *
                                         (k21 - gamma) * (k31 - gamma) * ((-gamma * dt).exp() - (-ka * dt).exp());

            let new_central_from_central = central * a_coeff * (-alpha * dt).exp() +
                                           central * b_coeff * (-beta * dt).exp() +
                                           central * c_coeff * (-gamma * dt).exp();

            let new_central = new_central_from_central + new_central_from_depot;

            let new_peripheral2_from_depot = depot * ka * k12 / (ka - alpha) / (beta - alpha) / (alpha - gamma) *
                                             ((-alpha * dt).exp() - (-ka * dt).exp()) +
                                             depot * ka * k12 / (ka - beta) / (alpha - beta) / (beta - gamma) *
                                             ((-beta * dt).exp() - (-ka * dt).exp()) +
                                             depot * ka * k12 / (ka - gamma) / (gamma - beta) / (gamma - alpha) *
                                             ((-gamma * dt).exp() - (-ka * dt).exp());

            let new_peripheral2_from_central = central * k12 / (beta - alpha) / (alpha - gamma) *
                                               ((-alpha * dt).exp() - (-beta * dt).exp());

            let new_peripheral2 = peripheral2 * (-k21 * dt).exp() +
                                  new_peripheral2_from_central + new_peripheral2_from_depot;

            let new_peripheral3_from_depot = depot * ka * k13 / (ka - alpha) / (beta - alpha) / (alpha - gamma) *
                                             ((-alpha * dt).exp() - (-ka * dt).exp()) +
                                             depot * ka * k13 / (ka - beta) / (alpha - beta) / (beta - gamma) *
                                             ((-beta * dt).exp() - (-ka * dt).exp()) +
                                             depot * ka * k13 / (ka - gamma) / (gamma - beta) / (gamma - alpha) *
                                             ((-gamma * dt).exp() - (-ka * dt).exp());

            let new_peripheral3_from_central = central * k13 / (beta - alpha) / (alpha - gamma) *
                                               ((-alpha * dt).exp() - (-gamma * dt).exp());

            let new_peripheral3 = peripheral3 * (-k31 * dt).exp() +
                                  new_peripheral3_from_central + new_peripheral3_from_depot;

            state.compartments[0] = new_depot;
            state.compartments[1] = new_central;
            state.compartments[2] = new_peripheral2;
            state.compartments[3] = new_peripheral3;
            state.last_time = time;
        }

        state.compartments[1] / v1
    }

    fn n_parameters(&self) -> usize {
        self.n_params
    }

    fn parameter_names(&self) -> Vec<String> {
        vec![
            "CL".to_string(),
            "V1".to_string(),
            "V2".to_string(),
            "V3".to_string(),
            "Q2".to_string(),
            "Q3".to_string(),
            "KA".to_string(),
        ]
    }
}

pub trait PharmacodynamicModel: Send + Sync {
    fn effect(&self, concentration: f64, params: &[f64], time: f64, state: &mut PDState) -> f64;
    fn n_parameters(&self) -> usize;
    fn parameter_names(&self) -> Vec<String>;
}

#[derive(Debug, Clone)]
pub struct PDState {
    pub response: f64,
    pub last_time: f64,
}

impl PDState {
    pub fn new() -> Self {
        Self {
            response: 0.0,
            last_time: 0.0,
        }
    }
}

pub struct EmaxModel {
    pub n_params: usize,
}

impl EmaxModel {
    pub fn new() -> Self {
        Self { n_params: 3 }
    }
}

impl PharmacodynamicModel for EmaxModel {
    fn effect(&self, concentration: f64, params: &[f64], _time: f64, _state: &mut PDState) -> f64 {
        if params.len() < 3 {
            return 0.0;
        }

        let s0 = params[0];
        let emax = params[1];
        let c50 = params[2];

        s0 + (emax * concentration) / (concentration + c50)
    }

    fn n_parameters(&self) -> usize {
        self.n_params
    }

    fn parameter_names(&self) -> Vec<String> {
        vec!["S0".to_string(), "EMAX".to_string(), "C50".to_string()]
    }
}

pub struct SigmoidEmaxModel {
    pub n_params: usize,
}

impl SigmoidEmaxModel {
    pub fn new() -> Self {
        Self { n_params: 4 }
    }
}

impl PharmacodynamicModel for SigmoidEmaxModel {
    fn effect(&self, concentration: f64, params: &[f64], _time: f64, _state: &mut PDState) -> f64 {
        if params.len() < 4 {
            return 0.0;
        }

        let s0 = params[0];
        let emax = params[1];
        let c50 = params[2];
        let gamma = params[3];

        let c_gamma = concentration.powf(gamma);
        let c50_gamma = c50.powf(gamma);

        s0 + (emax * c_gamma) / (c_gamma + c50_gamma)
    }

    fn n_parameters(&self) -> usize {
        self.n_params
    }

    fn parameter_names(&self) -> Vec<String> {
        vec!["S0".to_string(), "EMAX".to_string(), "C50".to_string(), "GAMMA".to_string()]
    }
}

pub struct ImaxModel {
    pub n_params: usize,
}

impl ImaxModel {
    pub fn new() -> Self {
        Self { n_params: 3 }
    }
}

impl PharmacodynamicModel for ImaxModel {
    fn effect(&self, concentration: f64, params: &[f64], _time: f64, _state: &mut PDState) -> f64 {
        if params.len() < 3 {
            return 0.0;
        }

        let s0 = params[0];
        let imax = params[1];
        let c50 = params[2];

        s0 * (1.0 - (imax * concentration) / (concentration + c50))
    }

    fn n_parameters(&self) -> usize {
        self.n_params
    }

    fn parameter_names(&self) -> Vec<String> {
        vec!["S0".to_string(), "IMAX".to_string(), "C50".to_string()]
    }
}

pub struct SigmoidImaxModel {
    pub n_params: usize,
}

impl SigmoidImaxModel {
    pub fn new() -> Self {
        Self { n_params: 4 }
    }
}

impl PharmacodynamicModel for SigmoidImaxModel {
    fn effect(&self, concentration: f64, params: &[f64], _time: f64, _state: &mut PDState) -> f64 {
        if params.len() < 4 {
            return 0.0;
        }

        let s0 = params[0];
        let imax = params[1];
        let c50 = params[2];
        let gamma = params[3];

        let c_gamma = concentration.powf(gamma);
        let c50_gamma = c50.powf(gamma);

        s0 * (1.0 - (imax * c_gamma) / (c_gamma + c50_gamma))
    }

    fn n_parameters(&self) -> usize {
        self.n_params
    }

    fn parameter_names(&self) -> Vec<String> {
        vec!["S0".to_string(), "IMAX".to_string(), "C50".to_string(), "GAMMA".to_string()]
    }
}

pub struct TurnoverRinEmaxModel {
    pub n_params: usize,
}

impl TurnoverRinEmaxModel {
    pub fn new() -> Self {
        Self { n_params: 5 }
    }
}

impl PharmacodynamicModel for TurnoverRinEmaxModel {
    fn effect(&self, concentration: f64, params: &[f64], time: f64, state: &mut PDState) -> f64 {
        if params.len() < 5 {
            return 0.0;
        }

        let rin = params[0];
        let kout = params[1];
        let emax = params[2];
        let c50 = params[3];
        let _gamma = params[4];

        let dt = time - state.last_time;

        if dt > 0.0 {
            let drug_effect = 1.0 + (emax * concentration) / (concentration + c50);
            let steps = ((dt / 0.1).ceil() as usize).max(1);
            let h = dt / steps as f64;

            for _ in 0..steps {
                let dR_dt = rin * drug_effect - kout * state.response;
                state.response += h * dR_dt;
            }

            state.last_time = time;
        }

        if state.response == 0.0 && time == 0.0 {
            state.response = rin / kout;
        }

        state.response
    }

    fn n_parameters(&self) -> usize {
        self.n_params
    }

    fn parameter_names(&self) -> Vec<String> {
        vec![
            "RIN".to_string(),
            "KOUT".to_string(),
            "EMAX".to_string(),
            "C50".to_string(),
            "GAMMA".to_string(),
        ]
    }
}

pub struct TurnoverKoutImaxModel {
    pub n_params: usize,
}

impl TurnoverKoutImaxModel {
    pub fn new() -> Self {
        Self { n_params: 5 }
    }
}

impl PharmacodynamicModel for TurnoverKoutImaxModel {
    fn effect(&self, concentration: f64, params: &[f64], time: f64, state: &mut PDState) -> f64 {
        if params.len() < 5 {
            return 0.0;
        }

        let rin = params[0];
        let kout = params[1];
        let imax = params[2];
        let c50 = params[3];
        let _gamma = params[4];

        let dt = time - state.last_time;

        if dt > 0.0 {
            let drug_effect = 1.0 - (imax * concentration) / (concentration + c50);
            let steps = ((dt / 0.1).ceil() as usize).max(1);
            let h = dt / steps as f64;

            for _ in 0..steps {
                let dR_dt = rin - kout * drug_effect * state.response;
                state.response += h * dR_dt;
            }

            state.last_time = time;
        }

        if state.response == 0.0 && time == 0.0 {
            state.response = rin / kout;
        }

        state.response
    }

    fn n_parameters(&self) -> usize {
        self.n_params
    }

    fn parameter_names(&self) -> Vec<String> {
        vec![
            "RIN".to_string(),
            "KOUT".to_string(),
            "IMAX".to_string(),
            "C50".to_string(),
            "GAMMA".to_string(),
        ]
    }
}

pub fn create_model(model_type: &str) -> Box<dyn PharmacokineticModel> {
    match model_type.to_lowercase().as_str() {
        "one_compartment" | "1comp" | "one_compartment_oral" => Box::new(OneCompartmentModel::new()),
        "two_compartment" | "2comp" | "two_compartment_oral" => Box::new(TwoCompartmentModel::new()),
        "two_compartment_ode" | "2comp_ode" => Box::new(TwoCompartmentODEModel::new()),
        "three_compartment" | "3comp" => Box::new(ThreeCompartmentModel::new()),
        _ => Box::new(OneCompartmentModel::new()),
    }
}

pub fn create_model_from_config(model_config: &crate::config::ModelConfig) -> Box<dyn PharmacokineticModel> {
    if model_config.model_type.to_lowercase() == "custom_ode" {
        if let Some(crate::config::CustomODEConfig::Specification(ref spec)) = model_config.custom_ode {
            return Box::new(DynamicODEModel::new(
                spec.n_compartments,
                spec.parameters.clone(),
                spec.equations.clone(),
                spec.observation_compartment,
                spec.observation_scaling.clone(),
            ));
        }
    }

    create_model(&model_config.model_type)
}

pub fn create_pd_model(model_type: &str) -> Box<dyn PharmacodynamicModel> {
    match model_type.to_lowercase().as_str() {
        "emax" => Box::new(EmaxModel::new()),
        "sigmoid_emax" | "sigmoidmax" => Box::new(SigmoidEmaxModel::new()),
        "imax" => Box::new(ImaxModel::new()),
        "sigmoid_imax" | "sigmoidimax" => Box::new(SigmoidImaxModel::new()),
        "turnover_rin_emax" => Box::new(TurnoverRinEmaxModel::new()),
        "turnover_kout_imax" => Box::new(TurnoverKoutImaxModel::new()),
        _ => Box::new(EmaxModel::new()),
    }
}
