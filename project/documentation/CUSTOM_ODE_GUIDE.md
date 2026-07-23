# Custom ODE Model Guide

## Overview

PHIKL1 supports user-defined ODE models directly in JSON configuration files. This allows you to implement any compartmental pharmacokinetic model without modifying the source code.

## Basic Structure

```json
{
  "model": {
    "model_type": "custom_ode",
    "custom_ode": {
      "n_compartments": 3,
      "parameters": ["CL", "V", "KA"],
      "equations": [
        "-KA * A[0]",
        "KA * A[0] - (CL/V) * A[1]"
      ],
      "observation_compartment": 1,
      "observation_scaling": "V"
    }
  }
}
```

## Components

### n_compartments
Total number of compartments in the model (integer).
- Includes depot compartment if oral dosing
- Must match the number of equations

### parameters
List of parameter names (strings).
- Order must match theta values in configuration
- Can be used directly in equations
- Case-sensitive

### equations
List of differential equations (strings).
- One equation per compartment
- Equation index corresponds to compartment index
- Evaluated left-to-right, top-to-bottom

**Variables Available in Equations:**
- `A[i]`: Amount in compartment i (0-indexed)
- Parameter names: Directly (e.g., `CL`, `V`, `KA`)
- `P[i]`: Alternative parameter access by index

**Supported Operators:**
- Arithmetic: `+`, `-`, `*`, `/`
- Power: `^`
- Parentheses: `(`, `)`

### observation_compartment
Index of compartment to observe (integer, 0-indexed).
- Usually the central compartment (1 for oral, 0 for IV)
- Must be valid compartment index

### observation_scaling
Expression to scale the observation (string, optional).
- Observation is divided by evaluated expression
- Can use any parameter name
- Supports full mathematical expressions

## Observation Scaling

The `observation_scaling` parameter works like NONMEM's `S` parameter. It converts compartment amounts to concentrations.

### Common Scaling Patterns

**Simple Volume Scaling:**
```json
"observation_scaling": "V"
```
Equivalent to: `Concentration = A[compartment] / V`

**Unit Conversion (ug to mg):**
```json
"observation_scaling": "V/1000"
```
Equivalent to: `Concentration_mg = A[compartment] / (V/1000)`

**Molecular Weight Conversion:**
```json
"observation_scaling": "V2 * 45"
```
Equivalent to: `Concentration = A[compartment] / (V2 * MW)`

### NONMEM Equivalents

| NONMEM | PHIKL1 |
|--------|--------|
| `S1 = V` | `"observation_scaling": "V"` |
| `S1 = V/1000` | `"observation_scaling": "V/1000"` |
| `S2 = V2*MW` | `"observation_scaling": "V2*45"` |
| `S1 = VC/F` | `"observation_scaling": "VC/F"` |

## Example Models

### 1. One-Compartment Model

```json
{
  "model": {
    "model_type": "custom_ode",
    "custom_ode": {
      "n_compartments": 2,
      "parameters": ["CL", "V", "KA"],
      "equations": [
        "-KA * A[0]",
        "KA * A[0] - (CL/V) * A[1]"
      ],
      "observation_compartment": 1,
      "observation_scaling": "V"
    }
  }
}
```

**Compartments:**
- A[0]: Depot (oral dose)
- A[1]: Central

**Equations:**
- dA[0]/dt = -KA × A[0]
- dA[1]/dt = KA × A[0] - (CL/V) × A[1]

### 2. Two-Compartment Model

```json
{
  "model": {
    "model_type": "custom_ode",
    "custom_ode": {
      "n_compartments": 3,
      "parameters": ["CL", "V1", "V2", "Q", "KA"],
      "equations": [
        "-KA * A[0]",
        "KA * A[0] - (CL/V1) * A[1] - (Q/V1) * A[1] + (Q/V2) * A[2]",
        "(Q/V1) * A[1] - (Q/V2) * A[2]"
      ],
      "observation_compartment": 1,
      "observation_scaling": "V1"
    }
  }
}
```

**Compartments:**
- A[0]: Depot
- A[1]: Central
- A[2]: Peripheral

**Parameters:**
- CL: Clearance
- V1: Central volume
- V2: Peripheral volume
- Q: Inter-compartmental clearance
- KA: Absorption rate

### 3. Three-Compartment Model with Unit Conversion

```json
{
  "model": {
    "model_type": "custom_ode",
    "custom_ode": {
      "n_compartments": 4,
      "parameters": ["CL", "V1", "V2", "V3", "Q2", "Q3", "KA"],
      "equations": [
        "-KA * A[0]",
        "KA * A[0] - (CL/V1) * A[1] - (Q2/V1) * A[1] + (Q2/V2) * A[2] - (Q3/V1) * A[1] + (Q3/V3) * A[3]",
        "(Q2/V1) * A[1] - (Q2/V2) * A[2]",
        "(Q3/V1) * A[1] - (Q3/V3) * A[3]"
      ],
      "observation_compartment": 1,
      "observation_scaling": "V1/1000"
    }
  }
}
```

**Compartments:**
- A[0]: Depot
- A[1]: Central
- A[2]: Peripheral 1
- A[3]: Peripheral 2

**Note:** Observation scaling `V1/1000` converts ug/L to mg/L.

### 4. TMDD Model (Quasi-Steady-State)

Michaelis-Menten approximation for target-mediated drug disposition:

```json
{
  "model": {
    "model_type": "custom_ode",
    "custom_ode": {
      "n_compartments": 3,
      "parameters": ["CL", "V1", "V2", "Q", "KA", "VMAX", "KM"],
      "equations": [
        "-KA * A[0]",
        "KA * A[0] - (CL/V1) * A[1] - (Q/V1) * A[1] + (Q/V2) * A[2] - (VMAX * (A[1]/V1)) / (KM + (A[1]/V1))",
        "(Q/V1) * A[1] - (Q/V2) * A[2]"
      ],
      "observation_compartment": 2,
      "observation_scaling": "V2 * 45"
    }
  }
}
```

**Compartments:**
- A[0]: Depot
- A[1]: Central (with saturable elimination)
- A[2]: Peripheral (observation compartment)

**Saturable Elimination:**
The term `(VMAX * C) / (KM + C)` represents Michaelis-Menten kinetics where:
- VMAX: Maximum elimination rate
- KM: Michaelis constant (concentration at half-maximal rate)
- C = A[1]/V1: Concentration in central compartment

**Complex Scaling:**
`V2 * 45` could represent molecular weight conversion for peripheral observations.

### 5. Full Mechanistic TMDD Model

```json
{
  "model": {
    "model_type": "custom_ode",
    "custom_ode": {
      "n_compartments": 4,
      "parameters": ["CL", "V1", "V2", "Q", "KA", "KON", "KOFF", "KINT", "KDEG", "KSYN"],
      "equations": [
        "-KA * A[0]",
        "KA * A[0] - (CL/V1) * A[1] - (Q/V1) * A[1] + (Q/V2) * A[2] - KON * (A[1]/V1) * A[3] + KOFF * A[3] * V1",
        "(Q/V1) * A[1] - (Q/V2) * A[2]",
        "KSYN - KDEG * A[3] - KON * (A[1]/V1) * A[3] + KOFF * A[3] - KINT * A[3]"
      ],
      "observation_compartment": 1,
      "observation_scaling": "V1/1000"
    }
  }
}
```

**Compartments:**
- A[0]: Depot
- A[1]: Free drug in central
- A[2]: Peripheral
- A[3]: Free receptor/target

**TMDD Parameters:**
- KON: Drug-target association rate
- KOFF: Drug-target dissociation rate
- KINT: Drug-target complex internalization rate
- KDEG: Target degradation rate
- KSYN: Target synthesis rate

**Mass Balance:**
```
Free Drug (A[1]) + Drug-Target Complex ↔ Elimination
Free Target (A[3]) + Drug ↔ Complex → Internalization
```

## Tips and Best Practices

### 1. Start Simple
Begin with a simple model and verify it works before adding complexity.

### 2. Use Clear Parameter Names
```json
// Good
"parameters": ["CL", "V1", "V2", "Q", "KA"]

// Less clear
"parameters": ["P1", "P2", "P3", "P4", "P5"]
```

### 3. Add Descriptions
Use `theta_names` and `omega_names` to document parameters:

```json
"theta_names": {
  "CL": "Clearance (L/h)",
  "V1": "Central volume (L)",
  "KA": "Absorption rate (1/h)"
}
```

### 4. Set Appropriate Bounds
Constrain parameters to physiologically plausible ranges:

```json
"constraints": {
  "theta_lower": [0.1, 5.0, 0.01],
  "theta_upper": [50.0, 500.0, 10.0]
}
```

### 5. Test Observation Scaling
Verify that your observation scaling produces expected concentration units:
- If amounts are in mg, and volume in L, `A/V` gives mg/L
- If you want ug/L, use `A/(V/1000)` or equivalently `A*1000/V`
- If you want mg/L from ug amounts, use `A/(V*1000)` or `V/1000`

### 6. Verify Equations
Double-check mass balance:
- Input = Absorption + Infusion
- Output = Elimination + Distribution
- Net change = Input - Output

### 7. Initial Estimates
Provide reasonable initial values in `theta`:
- Use literature values when available
- Run simple models first to get ballpark estimates
- Consider using `--auto-init` flag

## Common Pitfalls

### Division by Zero
Ensure parameters used in denominators are never zero:
```json
// Add bounds to prevent this
"constraints": {
  "theta_lower": [0.1, 1.0, 0.01],  // Minimum values > 0
}
```

### Equation Order
Equations are evaluated in order. Make sure dependencies are available:
```json
// Correct: A[0] available when evaluating equation 1
"equations": [
  "-KA * A[0]",
  "KA * A[0] - (CL/V) * A[1]"
]
```

### Compartment Indexing
Remember: compartments are 0-indexed!
```json
// Depot = A[0], Central = A[1], Peripheral = A[2]
"observation_compartment": 1  // Central, not 2!
```

### Parameter Name Consistency
Parameter names in `equations` must exactly match names in `parameters`:
```json
"parameters": ["CL", "V", "KA"],  // Case-sensitive!
"equations": [
  "-ka * A[0]"  // ERROR: 'ka' != 'KA'
]
```

## Debugging Custom ODE Models

### 1. Check Syntax
Verify equation syntax is valid mathematical expression.

### 2. Validate Parameter Count
Ensure `parameters` list matches `theta` values:
```json
"parameters": ["CL", "V", "KA"],  // 3 parameters
"theta": {
  "CL": 5.0,
  "V": 50.0,
  "KA": 1.0  // 3 values - correct!
}
```

### 3. Check Compartment Count
`n_compartments` must equal number of equations:
```json
"n_compartments": 3,
"equations": [  // Must have 3 equations
  "-KA * A[0]",
  "KA * A[0] - (CL/V) * A[1]",
  "..." // Missing equation 2!
]
```

### 4. Test with Simple Data
Use a simple dataset with known behavior to verify model works correctly.

### 5. Compare with Built-in Models
If implementing a standard model, compare results with built-in analytical version.

## Mathematical Functions

The expression evaluator supports:
- Basic operators: `+`, `-`, `*`, `/`, `^`
- Standard functions: `sqrt`, `exp`, `ln`, `log`, `log10`
- Trigonometric: `sin`, `cos`, `tan`
- Other: `abs`, `floor`, `ceil`, `round`

Example with functions:
```json
"equations": [
  "-KA * A[0]",
  "KA * A[0] - CL * (A[1] / V) - VMAX * (A[1]/V) / (KM + (A[1]/V))"
]
```

## Performance Considerations

Custom ODE models use RK4 (4th-order Runge-Kutta) numerical integration with adaptive step sizing. For most PK models, this provides:
- Accurate predictions (error < 0.1%)
- Fast computation (comparable to analytical solutions)
- Stable integration for stiff systems

## Further Reading

- See `examples/config_custom_ode_*.json` for complete examples
- Consult QUICK_START.md for basic usage
- See MODEL_LIBRARY.md for standard model implementations
- Review ADVANCED_ESTIMATION.md for optimization tips
