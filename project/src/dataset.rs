use csv::ReaderBuilder;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Observation {
    pub id: usize,
    pub time: f64,
    pub dv: Option<f64>,
    pub amt: f64,
    pub evid: usize,
    pub covariates: HashMap<String, f64>,
}

#[derive(Debug, Clone)]
pub struct Dataset {
    pub observations: Vec<Observation>,
    pub n_subjects: usize,
    pub subject_data: HashMap<usize, Vec<usize>>,
}

impl Dataset {
    pub fn from_file(path: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let file = File::open(path)?;
        let mut rdr = ReaderBuilder::new()
            .has_headers(true)
            .from_reader(file);

        let headers = rdr.headers()?.clone();
        let mut observations = Vec::new();
        let mut subject_ids = std::collections::HashSet::new();

        for result in rdr.records() {
            let record = result?;

            let id: usize = record.get(headers.iter().position(|h| h == "ID").unwrap_or(0))
                .unwrap_or("0")
                .parse()
                .unwrap_or(0);

            let time: f64 = record.get(headers.iter().position(|h| h == "TIME").unwrap_or(1))
                .unwrap_or("0")
                .parse()
                .unwrap_or(0.0);

            let dv_str = record.get(headers.iter().position(|h| h == "DV").unwrap_or(2))
                .unwrap_or(".");
            let dv = if dv_str == "." || dv_str.is_empty() {
                None
            } else {
                Some(dv_str.parse().unwrap_or(0.0))
            };

            let amt: f64 = record.get(headers.iter().position(|h| h == "AMT").unwrap_or(3))
                .unwrap_or("0")
                .parse()
                .unwrap_or(0.0);

            let evid: usize = record.get(headers.iter().position(|h| h == "EVID").unwrap_or(4))
                .unwrap_or("0")
                .parse()
                .unwrap_or(0);

            let mut covariates = HashMap::new();
            for (i, header) in headers.iter().enumerate() {
                if !["ID", "TIME", "DV", "AMT", "EVID"].contains(&header) {
                    if let Some(value) = record.get(i) {
                        if let Ok(val) = value.parse::<f64>() {
                            covariates.insert(header.to_string(), val);
                        }
                    }
                }
            }

            subject_ids.insert(id);
            observations.push(Observation {
                id,
                time,
                dv,
                amt,
                evid,
                covariates,
            });
        }

        let n_subjects = subject_ids.len();
        let mut subject_data: HashMap<usize, Vec<usize>> = HashMap::new();

        for (idx, obs) in observations.iter().enumerate() {
            subject_data.entry(obs.id).or_insert_with(Vec::new).push(idx);
        }

        Ok(Dataset {
            observations,
            n_subjects,
            subject_data,
        })
    }

    pub fn get_subject_observations(&self, subject_id: usize) -> Vec<&Observation> {
        if let Some(indices) = self.subject_data.get(&subject_id) {
            indices.iter().map(|&idx| &self.observations[idx]).collect()
        } else {
            Vec::new()
        }
    }

    pub fn subject_ids(&self) -> Vec<usize> {
        let mut ids: Vec<usize> = self.subject_data.keys().copied().collect();
        ids.sort();
        ids
    }
}
