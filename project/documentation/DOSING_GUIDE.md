# PHIKL1 Dosing Regimen Guide

## Overview

PHIKL1 supports both **single dose** and **multiple dose** pharmacokinetic studies through the same unified framework. No code changes are needed - the program automatically detects and handles the dosing regimen based on your dataset.

## Dataset Format

All datasets use the same column structure:

| Column | Description | Required | Format |
|--------|-------------|----------|--------|
| ID | Subject identifier | Yes | Integer (1, 2, 3, ...) |
| TIME | Time since first dose | Yes | Numeric (hours) |
| DV | Dependent variable (concentration) | For observations | Numeric or "." for dose events |
| AMT | Dose amount | For dose events | Numeric |
| EVID | Event ID | Yes | 0=observation, 1=dose |

## Single Dose Studies

### Dataset Example

```csv
ID,TIME,DV,AMT,EVID
1,0,.,100,1          # Single dose at time 0
1,0.5,5.2,,0         # Observations follow
1,1,8.5,,0
1,2,10.2,,0
1,4,9.5,,0
1,8,6.1,,0
2,0,.,100,1          # Next subject
2,0.5,5.5,,0
...
```

### Configuration

```json
{
  "data": {
    "file": "data/one_compartment_sample.csv",
    ...
  }
}
```

### Running

```bash
./target/release/phikl1 config_1comp.json
```

### Characteristics
- One `EVID=1` record per subject
- All observations follow the single dose
- Simple PK profile: absorption → distribution → elimination
- Suitable for first-in-human studies, bioequivalence

## Multiple Dose Studies

### Dataset Example

```csv
ID,TIME,DV,AMT,EVID
1,0,.,100,1          # First dose
1,1,7.8,,0           # Observations
1,2,10.2,,0
1,4,9.5,,0
1,12,.,100,1         # Second dose (accumulation begins)
1,13,13.5,,0         # Higher concentrations
1,14,15.8,,0
1,24,.,100,1         # Third dose (approaching steady-state)
1,25,19.2,,0         # Further accumulation
1,26,21.5,,0
...
```

### Configuration

```json
{
  "data": {
    "file": "data/multiple_dose_sample.csv",
    ...
  }
}
```

### Running

```bash
./target/release/phikl1 config_multiple_dose.json
```

### Characteristics
- Multiple `EVID=1` records per subject
- Observations between and after doses
- Drug accumulation is automatic
- Approaching steady-state with repeated dosing
- Suitable for chronic dosing, TDM studies, steady-state analysis

## How PHIKL1 Handles Both

### Unified Algorithm

The same code path handles both regimens:

1. **Read all records** for each subject
2. **Sort by time** (chronological processing)
3. **For each time point:**
   - If `EVID=1`: Add `AMT` to depot compartment
   - Integrate ODEs from previous time to current time
   - If `EVID=0`: Compute prediction and likelihood
4. **Compartment state persists** between all events

### Key Difference

The only difference is in the data:
- **Single dose**: One dose event per subject
- **Multiple dose**: Multiple dose events per subject

The algorithm handles both identically - it just processes whatever dose events exist in the data.

### Automatic Accumulation

For multiple doses:
```
Time 0:   Depot=100, Central=0      (first dose)
Time 12:  Depot=120, Central=3      (100mg added to remaining 20mg)
Time 24:  Depot=154, Central=5      (100mg added to remaining 54mg)
```

The compartments are never reset - doses are additive to existing amounts.

## Dosing Interval Flexibility

PHIKL1 supports any dosing schedule:

### Regular Intervals
```csv
# Every 12 hours
1,0,.,100,1
1,12,.,100,1
1,24,.,100,1
1,36,.,100,1
```

### Irregular Intervals
```csv
# Loading dose, then maintenance
1,0,.,200,1          # Loading
1,24,.,100,1         # Maintenance
1,48,.,100,1
```

### Varying Doses
```csv
# Dose escalation
1,0,.,50,1
1,24,.,100,1
1,48,.,150,1
```

### Different Per Subject
```csv
# Subject 1: q12h
1,0,.,100,1
1,12,.,100,1
1,24,.,100,1

# Subject 2: q24h
2,0,.,100,1
2,24,.,100,1
2,48,.,100,1
```

## Steady-State Analysis

For steady-state studies:

### Approach 1: Include Full Dosing History
```csv
1,0,.,100,1
1,12,.,100,1
1,24,.,100,1
1,36,.,100,1
1,48,.,100,1         # Day 2 steady-state
1,50,25.0,,0         # Steady-state observations
```

### Approach 2: Observations Only at Steady-State
```csv
1,0,.,100,1          # Assume reached steady-state
1,2,25.0,,0          # Steady-state trough
1,4,28.5,,0
1,12,.,100,1         # Next dose
1,14,26.2,,0
```

PHIKL1 works with both approaches - include whatever dosing history is relevant.

## Example Workflows

### Workflow 1: Single Dose PK Study

```bash
# Use provided single dose data
./target/release/phikl1 config_1comp.json --o results_single

# Results show:
# - Initial PK parameters
# - Single-dose disposition
# - Peak and elimination characteristics
```

### Workflow 2: Multiple Dose PK Study

```bash
# Use multiple dose data
./target/release/phikl1 config_multiple_dose.json --o results_multiple

# Results show:
# - Accumulation patterns
# - Approach to steady-state
# - Time-dependent PK if present
```

### Workflow 3: Same Config, Different Data

```bash
# Reuse config with different datasets
./target/release/phikl1 config_1comp.json --data single_dose.csv --o single_results
./target/release/phikl1 config_1comp.json --data multiple_dose.csv --o multiple_results

# Compare single vs multiple dose PK using same model
```

## Provided Examples

PHIKL1 includes three example datasets:

### 1. `data/one_compartment_sample.csv`
- **Regimen**: Single dose
- **Model**: One-compartment
- **Subjects**: 10
- **Doses**: 100-200mg single dose
- **Config**: `config_1comp.json`

### 2. `data/two_compartment_sample.csv`
- **Regimen**: Single dose
- **Model**: Two-compartment
- **Subjects**: 10
- **Doses**: 100-200mg single dose
- **Config**: `config_2comp.json`

### 3. `data/multiple_dose_sample.csv`
- **Regimen**: Multiple dose (q12h × 3 doses)
- **Model**: One-compartment
- **Subjects**: 10
- **Doses**: 100-200mg every 12 hours
- **Config**: `config_multiple_dose.json`

## Best Practices

### Data Quality

1. **Chronological order**: Records should be sorted by ID then TIME
2. **Complete dosing history**: Include all doses that affect observed concentrations
3. **Consistent units**: Time (hours), concentration (μg/mL), dose (mg)
4. **Missing values**: Use "." for DV in dose records

### Study Design

1. **Single dose first**: Characterize basic PK before multiple dosing
2. **Adequate sampling**:
   - Single dose: Cover absorption, distribution, elimination
   - Multiple dose: Pre-dose (trough), peak, and mid-interval
3. **Steady-state**: At least 5 half-lives of dosing for true steady-state

### Analysis Strategy

1. **Start simple**: Test with single dose data first
2. **Verify model**: Check predictions match data qualitatively
3. **Multiple dose**: Use same model structure as validated in single dose
4. **Compare**: Evaluate if PK parameters differ between regimens

## Troubleshooting

### Issue: Multiple dose concentrations seem too high
- **Cause**: Model accumulation may be excessive
- **Check**: Parameter estimates (especially clearance)
- **Solution**: Verify dose amounts and timing in dataset

### Issue: No accumulation observed
- **Cause**: Doses may not be marked as EVID=1
- **Check**: All dose records have EVID=1 and AMT value
- **Solution**: Verify dataset format

### Issue: Convergence problems with multiple dose
- **Cause**: Complex PK profile with limited data
- **Solution**: Increase n_burn_in and n_iter in config

## Summary

| Feature | Single Dose | Multiple Dose |
|---------|-------------|---------------|
| Dataset format | Same | Same |
| EVID=1 records | 1 per subject | Multiple per subject |
| Code/algorithm | Same | Same |
| Accumulation | No | Automatic |
| Steady-state | No | Can analyze |
| Use cases | First-in-human, BE, single-dose PK | Chronic dosing, TDM, steady-state |
| Configuration | Standard | Standard |

**Both regimens are fully supported using the same program with the same algorithm.**
