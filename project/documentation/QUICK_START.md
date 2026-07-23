# PHIKL1 Quick Start Guide

## Single Dose vs Multiple Dose Analysis

PHIKL1 supports both single and multiple dose regimens using the same code and algorithm.

## Quick Comparison

| Feature | Single Dose | Multiple Dose |
|---------|-------------|---------------|
| **Example file** | `data/one_compartment_sample.csv` | `data/multiple_dose_sample.csv` |
| **Config file** | `config_1comp.json` | `config_multiple_dose.json` |
| **Doses per subject** | 1 | 3 (q12h) |
| **Accumulation** | No | Yes (automatic) |
| **Use case** | Initial PK characterization | Chronic dosing, steady-state |

## Running Single Dose Analysis

```bash
# Build the project (first time only)
cargo build --release

# Run single dose analysis (one-compartment model)
./target/release/phikl1 config_1comp.json

# Run single dose analysis (two-compartment model)
./target/release/phikl1 config_2comp.json

# With custom output directory
./target/release/phikl1 config_1comp.json --o results_single_dose
```

**Expected output location:** `output/` directory (or custom via `--o`)

## Running Multiple Dose Analysis

```bash
# Run multiple dose analysis
./target/release/phikl1 config_multiple_dose.json

# With custom output directory
./target/release/phikl1 config_multiple_dose.json --o results_multiple_dose

# Use single dose config with multiple dose data
./target/release/phikl1 config_1comp.json --data data/multiple_dose_sample.csv --o multi_results
```

**Expected output location:** `output_multiple_dose/` directory (or custom via `--o`)

## Example Dataset Formats

### Single Dose Dataset (excerpt)

```csv
ID,TIME,DV,AMT,EVID
1,0,.,100,1          ← Single dose event (EVID=1)
1,0.5,5.2,,0         ← Observation (EVID=0)
1,1,8.5,,0
1,2,10.2,,0
1,4,9.5,,0
1,8,6.1,,0
2,0,.,100,1          ← Next subject
2,0.5,5.5,,0
...
```

### Multiple Dose Dataset (excerpt)

```csv
ID,TIME,DV,AMT,EVID
1,0,.,100,1          ← First dose
1,1,7.8,,0
1,2,10.2,,0
1,4,9.5,,0
1,12,.,100,1         ← Second dose (accumulation)
1,13,13.5,,0         ← Higher concentrations
1,14,15.8,,0
1,24,.,100,1         ← Third dose (more accumulation)
1,25,19.2,,0
1,26,21.5,,0
...
```

**Key difference:** Multiple `EVID=1` records per subject in multiple dose datasets.

## Understanding the Output

Both analyses produce the same output files:

```
output/
├── summary.txt                      # Parameter estimates and fit statistics
├── individual_predictions.csv       # IPRED, PRED, residuals
├── population_parameters.csv        # Individual PK parameters
└── run.log                          # Detailed run information
```

### Single Dose Summary Example

```
Final Parameter Estimates:
  THETA[1] (CL):  5.23 L/h
  THETA[2] (V):   48.5 L
  THETA[3] (KA):  0.98 h⁻¹
  
  OMEGA[1,1]:     0.089
  OMEGA[2,2]:     0.112
  OMEGA[3,3]:     0.095
  
  SIGMA:          0.85
```

### Multiple Dose Summary Example

```
Final Parameter Estimates:
  THETA[1] (CL):  5.18 L/h      ← Similar to single dose
  THETA[2] (V):   49.2 L
  THETA[3] (KA):  1.02 h⁻¹
  
  OMEGA[1,1]:     0.092
  OMEGA[2,2]:     0.108
  OMEGA[3,3]:     0.098
  
  SIGMA:          0.92
  
Note: Accounts for accumulation and steady-state
```

## Verifying Accumulation

To verify multiple dose accumulation is working:

```bash
# Run the analysis
./target/release/phikl1 config_multiple_dose.json

# Check predictions for a subject with multiple doses
grep "^1," output_multiple_dose/individual_predictions.csv

# You should see:
# - Increasing trough levels with each dose
# - Higher peak concentrations over time
# - Approach to steady-state
```

Example output showing accumulation:
```
ID,TIME,IPRED,PRED,DV,IWRES
1,1,7.5,7.8,7.8,0.12      # After first dose
1,13,14.2,13.9,13.5,-0.23  # After second dose (higher)
1,25,19.8,19.5,19.2,-0.31  # After third dose (even higher)
```

## Command-Line Options

Both single and multiple dose analyses support the same options:

```bash
./target/release/phikl1 <config.json> [OPTIONS]

Options:
  --o <directory>    Override output directory
  --data <file>      Override data file path

Examples:
  # Use same config with different data
  ./target/release/phikl1 config_1comp.json --data data/single_dose.csv
  ./target/release/phikl1 config_1comp.json --data data/multiple_dose.csv
  
  # Different outputs
  ./target/release/phikl1 config_1comp.json --o single_results
  ./target/release/phikl1 config_multiple_dose.json --o multiple_results
```

## Troubleshooting

### Single Dose Analysis

**Issue:** Poor fit to data
- Check initial parameter values in config
- Verify model type matches PK profile
- Increase `n_iter` in config

### Multiple Dose Analysis

**Issue:** No accumulation observed
- Verify EVID=1 for all dose events
- Check AMT values are present for doses
- Ensure TIME progresses chronologically

**Issue:** Excessive accumulation
- May indicate clearance is estimated too low
- Check for data errors in dose timing
- Verify concentration units are consistent

## Next Steps

1. **Start with single dose** to establish baseline PK parameters
2. **Validate the model** using diagnostic plots (external tools)
3. **Apply to multiple dose** using the same model structure
4. **Compare parameters** between single and multiple dose studies

## Additional Resources

- **DOSING_GUIDE.md** - Comprehensive guide to single and multiple dosing
- **IMPLEMENTATION_NOTES.md** - Technical details of the algorithm
- **README.md** - Full documentation and configuration details

## Summary

**Both single dose and multiple dose studies are fully supported!**

The only difference is in your dataset:
- Single dose: One `EVID=1` per subject
- Multiple dose: Multiple `EVID=1` per subject

The same program, same code, same algorithm handles both automatically.
