# PHIKL1 Usage Examples

## Example 1: Single Dose, One-Compartment Model

**Scenario:** Analyze a single dose PK study with one-compartment kinetics

**Dataset:** `data/one_compartment_sample.csv`
- 10 subjects
- Single 100-200mg dose per subject
- 6-8 observations per subject

**Command:**
```bash
./target/release/phikl1 config_1comp.json
```

**Output:** Results in `output/` directory

**What to expect:**
- Simple PK parameters: CL, V, KA
- Single peak followed by elimination
- No accumulation

---

## Example 2: Single Dose, Two-Compartment Model

**Scenario:** Analyze a drug with distribution phase

**Dataset:** `data/two_compartment_sample.csv`
- 10 subjects
- Single 100-200mg dose per subject
- Extended observation period

**Command:**
```bash
./target/release/phikl1 config_2comp.json
```

**Output:** Results in `output_2comp/` directory

**What to expect:**
- Two-compartment parameters: CL, V1, V2, Q, KA
- Biphasic elimination curve
- Better fit for drugs with distribution phase

---

## Example 3: Multiple Dose, Accumulation Study

**Scenario:** Analyze a multiple dose study with drug accumulation

**Dataset:** `data/multiple_dose_sample.csv`
- 10 subjects
- 3 doses per subject (q12h)
- Doses: 100-200mg
- Observations between doses

**Command:**
```bash
./target/release/phikl1 config_multiple_dose.json
```

**Output:** Results in `output_multiple_dose/` directory

**What to expect:**
- Same PK parameters as single dose
- Increasing trough levels with each dose
- Approach to steady-state
- Accumulation factor evident in predictions

---

## Example 4: Compare Single vs Multiple Dose

**Scenario:** Use same model for both datasets to compare PK parameters

**Commands:**
```bash
# Single dose analysis
./target/release/phikl1 config_1comp.json --o results_single

# Multiple dose analysis with same model
./target/release/phikl1 config_1comp.json \
  --data data/multiple_dose_sample.csv \
  --o results_multiple
```

**Output:**
- `results_single/` - Single dose results
- `results_multiple/` - Multiple dose results

**What to compare:**
- Are CL, V, KA similar between regimens?
- Does clearance appear linear (no change)?
- Is accumulation as predicted?

---

## Example 5: Custom Data File

**Scenario:** Analyze your own dataset with existing config

**Your dataset:** `my_study_data.csv` (same format as examples)

**Command:**
```bash
./target/release/phikl1 config_1comp.json \
  --data my_study_data.csv \
  --o my_results
```

**Requirements:**
- Dataset must have columns: ID, TIME, DV, AMT, EVID
- EVID=1 for dose events, EVID=0 for observations
- DV="." for dose events
- Chronological order by ID then TIME

---

## Example 6: Parameter Sensitivity Analysis

**Scenario:** Test different initial parameter values

**Commands:**
```bash
# Copy and modify config files
cp config_1comp.json config_1comp_v1.json
cp config_1comp.json config_1comp_v2.json

# Edit config_1comp_v1.json: theta: [4.0, 40.0, 0.8]
# Edit config_1comp_v2.json: theta: [6.0, 60.0, 1.2]

# Run with different starting values
./target/release/phikl1 config_1comp_v1.json --o results_v1
./target/release/phikl1 config_1comp_v2.json --o results_v2

# Compare final estimates - should converge to similar values
```

---

## Example 7: Steady-State Only Analysis

**Scenario:** Analyze only steady-state observations (assume equilibrium)

**Create dataset:** `steady_state_data.csv`
```csv
ID,TIME,DV,AMT,EVID
1,0,.,100,1
1,2,24.5,,0
1,4,22.8,,0
1,12,.,100,1
1,14,25.2,,0
1,16,23.1,,0
```

**Command:**
```bash
./target/release/phikl1 config_1comp.json \
  --data steady_state_data.csv \
  --o steady_state_results
```

**Note:** Program will still track accumulation, but you're only fitting steady-state observations.

---

## Example 8: Irregular Dosing Schedule

**Scenario:** Loading dose followed by maintenance doses

**Create dataset:** `loading_dose_data.csv`
```csv
ID,TIME,DV,AMT,EVID
1,0,.,200,1        # Loading dose (2x)
1,2,20.5,,0
1,12,.,100,1       # Maintenance dose
1,14,15.8,,0
1,24,.,100,1       # Maintenance dose
1,26,16.2,,0
```

**Command:**
```bash
./target/release/phikl1 config_1comp.json \
  --data loading_dose_data.csv \
  --o loading_dose_results
```

**What to expect:**
- Higher concentrations after loading dose
- Lower but maintained levels with maintenance doses
- Algorithm handles different dose amounts automatically

---

## Example 9: Batch Processing Multiple Studies

**Scenario:** Process multiple datasets with same model

**Create script:** `run_all.sh`
```bash
#!/bin/bash

# Single dose studies
./target/release/phikl1 config_1comp.json \
  --data study1_single.csv --o results/study1_single

./target/release/phikl1 config_1comp.json \
  --data study2_single.csv --o results/study2_single

# Multiple dose studies
./target/release/phikl1 config_1comp.json \
  --data study1_multiple.csv --o results/study1_multiple

./target/release/phikl1 config_1comp.json \
  --data study2_multiple.csv --o results/study2_multiple

echo "All analyses complete!"
```

**Run:**
```bash
chmod +x run_all.sh
./run_all.sh
```

---

## Example 10: Increase Estimation Precision

**Scenario:** Get more precise parameter estimates with longer MCMC chains

**Create config:** `config_1comp_precise.json`
```json
{
  "model": {
    "model_type": "one_compartment"
  },
  "data": {
    "file": "data/one_compartment_sample.csv",
    ...
  },
  "parameters": {
    "theta": [5.0, 50.0, 1.0],
    "omega": [[0.1, 0.0, 0.0], [0.0, 0.1, 0.0], [0.0, 0.0, 0.1]],
    "sigma": 1.0
  },
  "estimation": {
    "n_burn_in": 300,    ← Increased from 200
    "n_iter": 700,       ← Increased from 500
    "n_chains": 5,       ← Increased from 3
    "seed": 12345
  },
  "output": {
    "directory": "output_precise"
  }
}
```

**Command:**
```bash
./target/release/phikl1 config_1comp_precise.json
```

**Trade-off:** More accurate estimates but longer computation time

---

## Summary of Use Cases

| Example | Single/Multiple | Model | Use Case |
|---------|----------------|-------|----------|
| 1 | Single | 1-comp | Basic PK |
| 2 | Single | 2-comp | Distribution phase |
| 3 | Multiple | 1-comp | Accumulation |
| 4 | Both | 1-comp | Comparison |
| 5 | Either | 1-comp | Custom data |
| 6 | Either | 1-comp | Sensitivity |
| 7 | Multiple | 1-comp | Steady-state only |
| 8 | Multiple | 1-comp | Loading dose |
| 9 | Both | 1-comp | Batch processing |
| 10 | Either | 1-comp | High precision |

---

## Tips for Success

### For Single Dose Studies
1. Ensure adequate sampling around Cmax
2. Follow elimination phase for at least 3 half-lives
3. Include early time points to capture absorption

### For Multiple Dose Studies
1. Include pre-dose (trough) samples
2. Sample at same relative times after each dose
3. Ensure dosing times are accurate in dataset
4. At least 3-5 doses recommended for steady-state characterization

### General
1. Start with reasonable initial parameter values
2. Use single dose to inform multiple dose analysis
3. Verify dataset format before running
4. Check output logs for convergence issues
