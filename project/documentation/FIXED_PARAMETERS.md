# Fixed Parameters in PHIKL1

PHIKL1 supports fixing parameters at specified values during estimation. Fixed parameters are not estimated and remain constant throughout the optimization process.

## Overview

Parameter fixing is useful when:
- You have prior knowledge about certain parameters
- You want to test specific hypotheses
- Some parameters are poorly identifiable in your data
- You're performing sensitivity analyses
- Literature values are available for some parameters

## Configuration

Fixed parameters are specified in the `constraints` section of the JSON configuration file:

```json
{
  "parameters": {
    "theta": [5.0, 50.0, 1.0],
    "omega": [
      [0.3, 0.0, 0.0],
      [0.0, 0.5, 0.0],
      [0.0, 0.0, 0.3]
    ],
    "sigma": 1.0,
    "constraints": {
      "theta_fixed": [false, true, false],
      "omega_fixed": [false, true, false],
      "sigma_fixed": false
    }
  }
}
```

### Configuration Fields

#### `theta_fixed` (Optional)
- Type: Array of booleans
- Length: Must match number of THETA parameters
- `true` = parameter is fixed at initial value
- `false` = parameter will be estimated
- Default: All parameters estimated if not specified

#### `omega_fixed` (Optional)
- Type: Array of booleans
- Length: Must match number of random effects (diagonal elements)
- `true` = variance component is fixed
- `false` = variance component will be estimated
- Default: All variances estimated if not specified

#### `sigma_fixed` (Optional)
- Type: Boolean
- `true` = residual error is fixed
- `false` = residual error will be estimated
- Default: `false` (estimated)

## Behavior

### During Estimation

**SAEM Algorithm**:
- Fixed THETA parameters: Skipped during stochastic approximation update
- Fixed OMEGA parameters: Variance remains constant for that random effect
- Fixed SIGMA: Residual error variance not updated

**FO/FOCE Algorithms**:
- Fixed parameters excluded from gradient calculations
- Optimization proceeds only for non-fixed parameters

### With Auto-Initialization (`--auto_init 1`)

When auto-initialization is enabled:
1. Robust initial estimates are calculated for ALL parameters
2. Fixed parameters are **NOT overwritten** - config values preserved
3. Only non-fixed parameters receive auto-estimated initial values
4. Output clearly indicates which parameters were preserved

**Example Output:**
```
✓ Applying Robust Estimates:
  THETA:  [4.98, 50.0, 1.23]

⚙ Fixed THETA parameters preserved: [1]
⚙ Fixed OMEGA parameters preserved: []
```

Parameter at index 1 (V=50.0) remains fixed at the config value.

## Examples

### Example 1: Fix Volume, Estimate Clearance

**Use Case**: Known volume from literature, estimate clearance from data

```json
{
  "parameters": {
    "theta": [5.0, 70.0],
    "theta_names": {
      "CL": "Clearance (L/h)",
      "V": "Volume (L) - from literature"
    },
    "constraints": {
      "theta_fixed": [false, true]
    }
  }
}
```

**Result**:
- CL estimated from data
- V fixed at 70.0 L
- Between-subject variability on CL estimated
- No BSV on V (or can fix OMEGA[1] if present)

### Example 2: Fix All Variability, Estimate Fixed Effects

**Use Case**: Estimate typical values assuming known variability

```json
{
  "parameters": {
    "theta": [5.0, 50.0],
    "omega": [
      [0.25, 0.0],
      [0.0, 0.40]
    ],
    "sigma": 1.5,
    "constraints": {
      "theta_fixed": [false, false],
      "omega_fixed": [true, true],
      "sigma_fixed": true
    }
  }
}
```

**Result**:
- CL and V estimated
- All variability parameters fixed
- Faster estimation (fewer parameters)

### Example 3: Sequential Estimation Strategy

**Step 1**: Fix structural parameters, estimate variability
```json
{
  "constraints": {
    "theta_fixed": [true, true],
    "omega_fixed": [false, false],
    "sigma_fixed": false
  }
}
```

**Step 2**: Use estimated variability, now estimate structural
```json
{
  "parameters": {
    "omega": [[0.28, 0.0], [0.0, 0.42]],
    "sigma": 1.2
  },
  "constraints": {
    "theta_fixed": [false, false],
    "omega_fixed": [true, true],
    "sigma_fixed": true
  }
}
```

### Example 4: Sensitivity Analysis

**Scenario**: Test impact of assuming different clearance values

**Config A**: CL = 4.0 (fixed)
```json
{
  "parameters": {
    "theta": [4.0, 50.0],
    "constraints": {
      "theta_fixed": [true, false]
    }
  }
}
```

**Config B**: CL = 6.0 (fixed)
```json
{
  "parameters": {
    "theta": [6.0, 50.0],
    "constraints": {
      "theta_fixed": [true, false]
    }
  }
}
```

Compare likelihood and estimates of other parameters.

## Output Interpretation

### Summary Report

Fixed parameters are marked with "FIXED" status:

```
═══════════════════════════════════════════════════════════
POPULATION PARAMETERS (THETA)
═══════════════════════════════════════════════════════════
Parameter  Description            Estimate         SE      RSE%   Status
                                95% CI Lower  95% CI Upper
───────────────────────────────────────────────────────────────
CL         Clearance (L/h)         4.987654   0.245123    4.91    Est.
                                    4.507212   5.468096
V          Volume (L) - fixed     50.000000   0.000000    0.00   FIXED
```

**Key Points**:
- Fixed parameters show SE = 0.0 and RSE% = 0.0
- No confidence intervals displayed for fixed parameters
- Status column clearly indicates "FIXED" vs "Est."

### Residual Error

```
═══════════════════════════════════════════════════════════
RESIDUAL ERROR MODEL
═══════════════════════════════════════════════════════════
Parameter     Estimate          SE      RSE%  Shrinkage%   Status
───────────────────────────────────────────────────────────────
SIGMA_ADD     1.500000    0.000000      0.00       12.34   FIXED
```

## Technical Details

### Parameter Counting

Fixed parameters:
- Do NOT count toward effective number of estimated parameters
- Excluded from degrees of freedom calculations
- Not included in gradient/Hessian computations

### Likelihood Calculations

The likelihood is still calculated using ALL parameters (fixed and estimated), but:
- Only non-fixed parameters are optimized
- Information criteria (AIC/BIC) adjusted for effective parameter count

### Identifiability

Fixing parameters can improve identifiability:
- Reduces parameter space dimensionality
- Can resolve correlation between parameters
- Speeds up convergence

**Warning**: Over-fixing can lead to model misspecification if fixed values are incorrect.

## Best Practices

### 1. Justify Fixed Values

Always document why parameters are fixed:
- Literature reference
- Prior study results
- Physiological constraints
- Identifiability analysis

### 2. Sensitivity Analysis

Test impact of fixed values:
- Run estimation with nearby values
- Compare objective function values
- Check residuals for patterns

### 3. Progressive Fixing Strategy

For complex models:
1. Start with all parameters estimated
2. Identify poorly estimated parameters (high RSE%)
3. Fix based on prior knowledge
4. Re-estimate and validate

### 4. Combine with Bounds

Fixed parameters override bounds:
```json
{
  "constraints": {
    "theta_lower": [0.1, 10.0],
    "theta_upper": [100.0, 200.0],
    "theta_fixed": [false, true]
  }
}
```

Parameter 1 is fixed regardless of bounds.

### 5. Document in Configuration

Use descriptive parameter names:
```json
{
  "theta_names": {
    "CL": "Clearance (L/h) - estimated",
    "V": "Volume (L) - fixed from Smith et al. 2020"
  }
}
```

## Validation

After fixing parameters, validate by:

1. **Residual Plots**: Check for systematic bias
2. **Individual Fits**: Verify predictions are reasonable
3. **Likelihood Comparison**: Compare to fully estimated model
4. **Parameter Estimates**: Check remaining parameters are sensible

## Common Use Cases

### Case 1: Allometric Scaling

Fix allometric exponents:
```json
{
  "parameters": {
    "theta": [5.0, 50.0, 0.75, 1.0],
    "theta_names": {
      "CL_std": "Clearance for 70kg",
      "V_std": "Volume for 70kg",
      "exp_CL": "Allometric exponent CL (fixed)",
      "exp_V": "Allometric exponent V (fixed)"
    },
    "constraints": {
      "theta_fixed": [false, false, true, true]
    }
  }
}
```

### Case 2: Known Bioavailability

```json
{
  "parameters": {
    "theta": [5.0, 50.0, 1.2, 0.8],
    "theta_names": {
      "CL": "Clearance",
      "V": "Volume",
      "Ka": "Absorption rate",
      "F": "Bioavailability (fixed at 0.8)"
    },
    "constraints": {
      "theta_fixed": [false, false, false, true]
    }
  }
}
```

### Case 3: Population-Specific Parameters

Fix typical value, estimate variability:
```json
{
  "parameters": {
    "theta": [6.8],
    "omega": [[0.3]],
    "constraints": {
      "theta_fixed": [true],
      "omega_fixed": [false]
    }
  }
}
```

Estimates inter-individual variability while assuming known typical value.

## Troubleshooting

### Issue: Fixed Parameters Still Change

**Check**:
1. Verify `theta_fixed` array length matches `theta` length
2. Ensure boolean values (not strings "true"/"false")
3. Check JSON syntax is valid

### Issue: Estimation Fails with Fixed Parameters

**Possible Causes**:
1. Fixed values are far from optimal
2. Model is misspecified
3. Too many parameters fixed

**Solutions**:
- Try different fixed values
- Fix fewer parameters
- Check data quality

### Issue: Auto-Init Overwrites Fixed Parameters

**Check**:
- Ensure `constraints` section is present BEFORE running
- Verify `theta_fixed` is properly formatted
- Fixed parameters should show in output as "preserved"

## Command-Line Usage

```bash
# With fixed parameters in config
phikl1 config_fixed_params.json

# With auto-initialization (respects fixed parameters)
phikl1 config_fixed_params.json --auto_init 1

# Fixed parameters work with all estimation methods
phikl1 config_fixed_params.json --method saem
phikl1 config_fixed_params.json --method fo
phikl1 config_fixed_params.json --method foce
```

## Limitations

1. **Cannot fix covariances** in OMEGA (only diagonal elements)
2. **All-or-nothing for SIGMA** (cannot fix proportional but estimate additive in combined model)
3. **No partial fixing** during run (parameters fixed for entire estimation)

## Future Enhancements

Planned features:
- Sequential fixing/unfixing during estimation
- Automatic fixing of poorly identifiable parameters
- Bayesian priors as alternative to hard fixing
- Off-diagonal OMEGA fixing
- Parameter fixing in FOCE with interaction

## References

1. **Parameter Fixing in Population PK**
   - Beal, S. L. (2001). "Ways to fit a PK model with some data below the quantification limit"

2. **Identifiability and Fixing**
   - Lavielle, M. (2014). "Mixed Effects Models for the Population Approach"

3. **Sequential Estimation**
   - Hooker, A. C., et al. (2007). "Simultaneous population pharmacokinetic-pharmacodynamic modeling"

## Summary

Fixed parameters in PHIKL1:
- ✓ Specified via `constraints.theta_fixed`, `omega_fixed`, `sigma_fixed`
- ✓ Parameters remain constant during estimation
- ✓ Work with auto-initialization (values preserved)
- ✓ Clearly marked in output reports
- ✓ Reduce computation time
- ✓ Improve identifiability when used appropriately
- ✓ Support all estimation methods (SAEM, FO, FOCE)
