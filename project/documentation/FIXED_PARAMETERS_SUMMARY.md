# Fixed Parameters Feature - Implementation Summary

## Overview

PHIKL1 now supports **parameter fixing** - the ability to hold specific parameters constant during estimation. This is a critical feature for population pharmacokinetic analysis.

## Configuration

Add to your JSON config file:

```json
{
  "parameters": {
    "theta": [5.0, 50.0, 1.0],
    "omega": [[0.3, 0.0], [0.0, 0.5]],
    "sigma": 1.0,
    "constraints": {
      "theta_fixed": [false, true, false],
      "omega_fixed": [false, false],
      "sigma_fixed": false
    }
  }
}
```

### Explanation
- `theta_fixed[1] = true`: THETA[1] (V) is FIXED at 50.0, will NOT be estimated
- `theta_fixed[0,2] = false`: THETA[0] (CL) and THETA[2] (Ka) WILL be estimated
- All arrays are optional - omit to estimate all parameters

## Key Features

### 1. Estimation Behavior
- **SAEM**: Fixed parameters skipped during stochastic approximation
- **FO/FOCE**: Fixed parameters excluded from optimization
- Values remain exactly as specified in config

### 2. Auto-Initialization Integration
When using `--auto_init 1`:
- Robust estimates calculated for ALL parameters
- Fixed parameters **preserved** from config (not overwritten)
- Only non-fixed parameters receive auto-estimated values

**Example Output:**
```
✓ Applying Robust Estimates:
  THETA:  [4.98, 50.0, 1.23]

ⓘ Fixed THETA parameters preserved: [1]
```

### 3. Report Display
Fixed parameters clearly marked in all outputs:

```
Parameter   Description       Estimate      SE    RSE%   Status
───────────────────────────────────────────────────────────────
CL          Clearance         4.987654  0.245    4.91    Est.
V           Volume - fixed   50.000000  0.000    0.00   FIXED
Ka          Absorption        1.234567  0.123    9.97    Est.
```

- **Status**: "FIXED" vs "Est."
- **SE/RSE%**: Shows 0.0 for fixed parameters
- **CI**: Not displayed for fixed parameters

## Use Cases

### 1. Literature Values
Fix parameters with known values from published studies:
```json
{
  "theta": [5.0, 70.0],
  "theta_names": {
    "CL": "Clearance - estimated",
    "V": "Volume - from Smith 2020"
  },
  "constraints": {
    "theta_fixed": [false, true]
  }
}
```

### 2. Sensitivity Analysis
Test different fixed values to assess impact:
- Config A: V = 60.0 (fixed)
- Config B: V = 80.0 (fixed)
- Compare likelihood and CL estimates

### 3. Sequential Estimation
**Step 1**: Fix structure, estimate variability
```json
{
  "constraints": {
    "theta_fixed": [true, true],
    "omega_fixed": [false, false]
  }
}
```

**Step 2**: Use estimated variability, estimate structure
```json
{
  "omega": [[0.28, 0.0], [0.0, 0.42]],
  "constraints": {
    "theta_fixed": [false, false],
    "omega_fixed": [true, true]
  }
}
```

### 4. Allometric Scaling
Fix standard exponents:
```json
{
  "theta": [5.0, 50.0, 0.75, 1.0],
  "theta_names": {
    "CL_std": "CL at 70kg",
    "V_std": "V at 70kg",
    "exp_CL": "Exponent CL (fixed 0.75)",
    "exp_V": "Exponent V (fixed 1.0)"
  },
  "constraints": {
    "theta_fixed": [false, false, true, true]
  }
}
```

## Implementation Details

### Modified Files

**src/config.rs**
- Added `theta_fixed`, `omega_fixed`, `sigma_fixed` to `ParameterConstraints`

**src/saem.rs**
- Parameter update checks fixed status before applying stochastic approximation
- Preserves fixed THETA, OMEGA, and SIGMA values

**src/main.rs**
- Auto-initialization logic respects fixed parameters
- Clear output showing which parameters were preserved

**src/reports.rs**
- Status column added to parameter tables
- Fixed parameters show SE=0, RSE%=0, no CI
- Clear "FIXED" vs "Est." indication

### New Files

**examples/config_fixed_parameters.json**
- Complete working example with fixed parameters

**documentation/FIXED_PARAMETERS.md**
- 200+ line comprehensive guide
- Multiple use cases and examples
- Best practices and troubleshooting

## Benefits

✅ **Flexibility**: Fix any combination of parameters
✅ **Transparency**: Clear indication in all outputs
✅ **Integration**: Works seamlessly with auto-init
✅ **Efficiency**: Faster estimation (fewer parameters)
✅ **Scientific**: Enables hypothesis testing
✅ **Practical**: Addresses real-world modeling needs

## Usage Examples

### Basic Usage
```bash
# With fixed parameters in config
phikl1 config_fixed_params.json

# With auto-init (preserves fixed parameters)
phikl1 config_fixed_params.json --auto_init 1
```

### Example Scenarios

**Scenario 1**: Known volume, estimate clearance
```json
{"constraints": {"theta_fixed": [false, true]}}
```

**Scenario 2**: All variability known, estimate typical values
```json
{"constraints": {
  "theta_fixed": [false, false],
  "omega_fixed": [true, true],
  "sigma_fixed": true
}}
```

**Scenario 3**: Test bioavailability assumption
```json
{"theta": [5.0, 50.0, 1.0, 0.85],
 "constraints": {"theta_fixed": [false, false, false, true]}}
```

## Validation Checklist

After fixing parameters:
- ✓ Check residual plots for bias
- ✓ Verify individual predictions are reasonable
- ✓ Compare likelihood to fully estimated model
- ✓ Ensure remaining estimates are sensible
- ✓ Document rationale for fixed values

## Best Practices

1. **Document Justification**: Note source/reason for fixed values
2. **Run Sensitivity**: Test nearby values to assess impact
3. **Progressive Fixing**: Start with all estimated, fix problematic parameters
4. **Combine with Bounds**: Use both for robust constraints
5. **Descriptive Names**: Indicate which parameters are fixed in names

## Limitations

- Cannot fix off-diagonal OMEGA elements (only diagonal)
- SIGMA is all-or-nothing (cannot partially fix in combined model)
- Parameters fixed for entire estimation (cannot change mid-run)

## Technical Notes

### Parameter Counting
- Fixed parameters do NOT count toward degrees of freedom
- Excluded from gradient/Hessian calculations
- AIC/BIC adjusted for effective parameter count

### Identifiability
- Fixing can improve identifiability
- Reduces parameter correlations
- Speeds convergence
- ⚠️ Over-fixing can cause model misspecification

## Documentation

Full documentation available in:
- `documentation/FIXED_PARAMETERS.md` - Complete guide with examples
- `examples/config_fixed_parameters.json` - Working example

## Summary

Parameter fixing is now fully integrated into PHIKL1:
- Simple JSON configuration
- Works with all estimation methods (SAEM, FO, FOCE)
- Integrates with auto-initialization
- Clear output and reporting
- Comprehensive documentation

This feature enables sophisticated modeling strategies and makes PHIKL1 suitable for real-world population PK analyses where prior knowledge needs to be incorporated.
