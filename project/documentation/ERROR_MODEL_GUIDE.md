# Residual Error Models Guide

PHIKL1 supports three types of residual error models to accommodate different types of measurement error patterns in pharmacokinetic data.

## Overview

Residual error models describe the relationship between observed concentrations (DV) and model predictions. The choice of error model affects parameter estimation, standard errors, and diagnostic statistics like IWRES and CWRES.

## Available Error Models

### 1. Additive Error Model

**Use when:** The measurement error is approximately constant across all concentration levels.

**Mathematical formula:**
```
Y = F + ε
where ε ~ N(0, σ²_add)
```

**Configuration:**
```json
"parameters": {
  "sigma": 1.0,
  "error_model": "additive"
}
```

**Characteristics:**
- Single parameter: `σ_add` (additive error)
- Error variance is constant
- Common for assays with good precision across the range
- Appropriate when CV% decreases as concentration increases

### 2. Proportional Error Model

**Use when:** The measurement error increases proportionally with the concentration level.

**Mathematical formula:**
```
Y = F + F·ε
where ε ~ N(0, σ²_prop)
```

**Configuration:**
```json
"parameters": {
  "sigma": 0.15,
  "sigma_proportional": 0.15,
  "error_model": "proportional"
}
```

**Characteristics:**
- Single parameter: `σ_prop` (proportional error)
- Error variance increases with prediction magnitude
- Common for assays with constant CV%
- Appropriate when relative error is constant

### 3. Combined Error Model (Default)

**Use when:** Both constant and proportional error components are present.

**Mathematical formula:**
```
Y = F + ε₁ + F·ε₂
Var(Y|F) = σ²_add + (σ_prop · F)²
```

**Configuration:**
```json
"parameters": {
  "sigma": 0.5,
  "sigma_proportional": 0.1,
  "error_model": "combined"
}
```

**Characteristics:**
- Two parameters: `σ_add` (additive) and `σ_prop` (proportional)
- Most flexible model
- Default if no error model is specified
- Recommended as starting point for most analyses

## Diagnostic Statistics

### IWRES (Individual Weighted Residuals)

```
IWRES = (DV - IPRED) / SD(residual)
```

- Measures deviation from individual prediction (IPRED)
- Accounts for individual parameter estimates (ETAs)
- Should be approximately N(0,1) if model is appropriate

### CWRES (Conditional Weighted Residuals)

```
CWRES = (DV - PRED) / SD(residual)
```

- Measures deviation from population prediction (PRED)
- Accounts for population parameters only
- Should be approximately N(0,1) if model is appropriate
- More sensitive to model misspecification than IWRES

Both statistics are calculated using the residual standard deviation that depends on the error model:

- **Additive:** `SD = √σ_add`
- **Proportional:** `SD = |σ_prop · IPRED|`
- **Combined:** `SD = √(σ_add + (σ_prop · IPRED)²)`

## Example Configurations

### Example 1: Additive Error
```json
{
  "model": {"model_type": "one_compartment"},
  "data": {"file": "examples/one_compartment_sample.csv", ...},
  "parameters": {
    "theta": [5.0, 50.0, 1.0],
    "omega": [...],
    "sigma": 1.0,
    "error_model": "additive"
  },
  "estimation": {...},
  "output": {"directory": "output_additive"}
}
```

### Example 2: Proportional Error
```json
{
  "model": {"model_type": "one_compartment"},
  "data": {"file": "examples/one_compartment_sample.csv", ...},
  "parameters": {
    "theta": [5.0, 50.0, 1.0],
    "omega": [...],
    "sigma": 0.15,
    "sigma_proportional": 0.15,
    "error_model": "proportional"
  },
  "estimation": {...},
  "output": {"directory": "output_proportional"}
}
```

### Example 3: Combined Error (Recommended)
```json
{
  "model": {"model_type": "one_compartment"},
  "data": {"file": "examples/one_compartment_sample.csv", ...},
  "parameters": {
    "theta": [5.0, 50.0, 1.0],
    "omega": [...],
    "sigma": 0.5,
    "sigma_proportional": 0.1,
    "error_model": "combined"
  },
  "estimation": {...},
  "output": {"directory": "output_combined"}
}
```

## Running Examples

```bash
# Additive error model
./target/release/phikl1 examples/config_error_additive.json

# Proportional error model
./target/release/phikl1 examples/config_error_proportional.json

# Combined error model
./target/release/phikl1 examples/config_error_combined.json
```

## Model Selection

### Comparing Error Models

To select the appropriate error model for your data:

1. **Fit all three models** to the same dataset
2. **Compare AIC/BIC** values (lower is better)
3. **Examine IWRES and CWRES plots**:
   - Should be randomly scattered around zero
   - No trends vs. time or predictions
   - Approximately normally distributed

4. **Check residual diagnostics**:
   - QQ plots should be linear
   - No heteroscedasticity (fan-shaped patterns)

### General Guidelines

- **Start with combined model** (most flexible)
- **Use additive** if:
  - Measurement error is constant
  - Working with low concentrations only
  - Assay has high precision

- **Use proportional** if:
  - CV% is constant across range
  - Concentrations span multiple orders of magnitude
  - High concentrations dominate the data

- **Use combined** if:
  - Data spans wide concentration range
  - Both fixed and relative errors are present
  - Unsure which model is appropriate

## Output Interpretation

The summary report now includes error model information:

```
═══════════════════════════════════════════════════════════════════
RESIDUAL ERROR MODEL
═══════════════════════════════════════════════════════════════════
Error model: Combined

Parameter      Estimate           SE      RSE%  Shrinkage%
───────────────────────────────────────────────────────────────────
SIGMA_ADD       0.500000     0.050000     10.00       15.50
SIGMA_PROP      0.100000            -         -           -
```

The individual predictions file includes both IWRES and CWRES:

```csv
ID,TIME,DV,PRED,IPRED,IWRES,CWRES
1,0.5,4.5,4.2,4.3,0.15,-0.12
1,1.0,8.2,7.9,8.1,0.08,-0.05
```

## References

- Mentre F, Escolano S. Prediction Discrepancies for the Evaluation of Nonlinear Mixed-Effects Models. J Pharmacokinet Pharmacodyn. 2006;33(3):345-367.
- Karlsson MO, Savic RM. Diagnosing Model Diagnostics. Clin Pharmacol Ther. 2007;82(1):17-20.
