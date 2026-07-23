# Model Comparison Guide

## Overview

PHIKL1 provides comprehensive model comparison functionality with statistical metrics to assess parameter reliability and select the best model for your data.

## Features

### 1. Parameter Estimation Quality Metrics

#### Relative Standard Error (RSE%)
- **Definition:** `RSE% = (SE / |Estimate|) × 100`
- **Interpretation:**
  - RSE% < 30%: Good precision
  - RSE% 30-50%: Moderate precision
  - RSE% > 50%: Poor precision (parameter may be poorly identified)

#### 95% Confidence Intervals
- Calculated as: `Estimate ± 1.96 × SE`
- If the confidence interval includes zero for parameters that should be positive (CL, V, KA), this indicates poor identifiability

### 2. Random Effects Quality Metrics

#### Shrinkage
Shrinkage measures how much individual parameter estimates are pulled toward the population mean.

**Eta Shrinkage (η-shrinkage):**
```
η-shrinkage = (1 - Var(η_i) / ω²) × 100%
```

**Epsilon Shrinkage (ε-shrinkage):**
```
ε-shrinkage = (1 - Var(IWRES) / σ²) × 100%
```

**Interpretation:**
- < 20%: Low shrinkage (good)
- 20-30%: Moderate shrinkage (acceptable)
- > 30%: High shrinkage (individual estimates unreliable)

**Causes of High Shrinkage:**
- Sparse data per individual
- Large between-subject variability
- Poor model fit
- Informative dosing/sampling

### 3. Model Selection Criteria

#### Akaike Information Criterion (AIC)
```
AIC = -2LL + 2k
```
where:
- LL = log-likelihood
- k = number of parameters

**Lower AIC indicates better model**

#### Bayesian Information Criterion (BIC)
```
BIC = -2LL + k × ln(n)
```
where:
- n = number of observations
- k = number of parameters

**Lower BIC indicates better model**

BIC penalizes model complexity more heavily than AIC.

### 4. Parameter Constraints

All PK parameters are constrained to be positive:
- **CL (Clearance)** > 0
- **V (Volume)** > 0
- **KA (Absorption rate)** > 0
- **Q (Inter-compartmental clearance)** > 0

During SAEM estimation, parameters are bounded at 1e-6 to prevent numerical issues.

## Using Model Comparison

### Programmatic API

```rust
use phikl1::comparison::{compare_models, print_comparison_summary, print_detailed_results};
use phikl1::config::Config;
use phikl1::dataset::Dataset;

let config = Config::from_file("config.json")?;
let dataset = Dataset::from_file(&config.data.file)?;

let models = vec!["1comp", "2comp", "3comp"];
let comparison = compare_models(&models, &dataset, &config)?;

print_comparison_summary(&comparison);

for model in &comparison.models {
    print_detailed_results(model);
}
```

### Example Output

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         MODEL COMPARISON SUMMARY                              ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌───────────────────┬──────────────┬──────────────┬─────────────┬─────────────┐
│ Model             │    -2LL      │     AIC      │     BIC     │  N Params   │
├───────────────────┼──────────────┼──────────────┼─────────────┼─────────────┤
│ 1comp             │      1245.32 │     1255.32* │    1268.45  │      5      │
│ 2comp             │      1238.67 │     1252.67  │    1272.34* │      7      │
│ 3comp             │      1239.12 │     1255.12  │    1281.23  │      8      │
└───────────────────┴──────────────┴──────────────┴─────────────┴─────────────┘

* indicates best model by criterion

Best model by AIC: 1comp
Best model by BIC: 2comp
```

## Interpreting Results

### Population Parameters (THETA)

| Check | Criteria | Action if Failed |
|-------|----------|------------------|
| Positivity | Estimate > 0 | Review model specification, check data quality |
| Precision | RSE% < 50% | Consider fixing parameter or obtaining more data |
| Confidence Interval | CI doesn't include 0 | Parameter is well-identified |

### Random Effects (OMEGA)

| Check | Criteria | Action if Failed |
|-------|----------|------------------|
| Variance Positivity | ω² > 0 | Model may be over-parameterized |
| Shrinkage | < 30% | Accept that individual estimates are unreliable |
| RSE% | < 100% | Parameter is reasonably estimated |

### Residual Error (SIGMA)

| Check | Criteria | Interpretation |
|-------|----------|----------------|
| RSE% | < 50% | Well-estimated |
| Shrinkage | < 30% | Adequate data per individual |

## Quality Checks

The detailed output includes automatic quality checks:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PARAMETER QUALITY CHECKS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ ⚠ Quality Issues Detected:                                                 │
│   - CL has high RSE% (52.3%)                                               │
│   - OMEGA[1,1] has high shrinkage (35.2%)                                  │
│   - Residual error has high shrinkage (32.1%)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Model Selection Strategy

### Step 1: Run Multiple Models
Compare 1-, 2-, and 3-compartment models with the same dataset.

### Step 2: Check Parameter Quality
- All parameters should be positive
- RSE% should be reasonable (< 50%)
- No parameters should have CIs including zero

### Step 3: Compare Information Criteria
- **AIC**: Favors predictive accuracy
- **BIC**: Favors parsimony (simpler models)

### Step 4: Assess Biological Plausibility
- Parameter values should make physiological sense
- Clearance should match known elimination pathways
- Volumes should be within anatomical ranges

### Step 5: Evaluate Shrinkage
- High shrinkage indicates sparse data
- May need to simplify random effects structure

## Common Issues and Solutions

### Issue: High RSE% for all parameters
**Causes:**
- Insufficient data
- Poor model fit
- Identifiability problems

**Solutions:**
- Collect more data
- Fix some parameters based on literature
- Simplify model structure

### Issue: High shrinkage
**Causes:**
- Sparse sampling per individual
- Large between-subject variability

**Solutions:**
- Accept that individual predictions are uncertain
- Focus on population-level inference
- Design richer sampling schemes

### Issue: Parameters at bounds (1e-6)
**Causes:**
- Over-parameterized model
- Poor initial estimates
- Identifiability problems

**Solutions:**
- Simplify model (reduce compartments)
- Fix problematic parameters
- Check data quality

### Issue: Conflicting AIC/BIC selection
**Causes:**
- Different penalties for complexity

**Solutions:**
- If AIC and BIC disagree, consider:
  - Study goals (prediction vs. inference)
  - External validation
  - Biological plausibility
  - Generally trust BIC for smaller datasets

## Statistical Background

### Fisher Information Matrix

The standard errors are computed from the inverse of the Fisher Information Matrix:

```
SE² = diag(F⁻¹)
```

where F is the Fisher Information Matrix approximated using the SAEM estimates.

### Confidence Intervals

95% confidence intervals assume asymptotic normality:

```
CI = θ ± 1.96 × SE(θ)
```

For variance parameters (OMEGA, SIGMA), the normal approximation may be poor, and confidence intervals should be interpreted cautiously.

## References

1. Savic RM, Karlsson MO. "Importance of shrinkage in empirical Bayes estimates for diagnostics: problems and solutions." AAPS J. 2009;11(3):558-69.

2. Burnham KP, Anderson DR. "Multimodel Inference: Understanding AIC and BIC in Model Selection." Sociological Methods & Research. 2004;33(2):261-304.

3. Mentré F, Comets E, Samson A. "A review of computational methods for population parameter estimation." Statistics in Medicine. 2021;40(9):2021-2051.
