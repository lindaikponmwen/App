# PHIKL1 Model Library

This document describes the pharmacokinetic and pharmacodynamic models implemented in PHIKL1, based on the PFIM reference documentation.

## Pharmacokinetic Models

All PK models implement first-order absorption with oral dosing via a depot compartment.

### 1. One-Compartment Model (`1comp`, `one_compartment`)

**Parameters (3):**
- `CL`: Clearance (L/h)
- `V`: Volume of distribution (L)
- `KA`: Absorption rate constant (1/h)

**Equation (PFIM 1.7):**
```
C(t) = (D/V) * (ka/(ka-k)) * (e^(-k*dt) - e^(-ka*dt))
```
where `k = CL/V`

**Reference:** PFIM Section 1.2.1.3, Equation 1.7

### 2. Two-Compartment Model (`2comp`, `two_compartment`)

**Parameters (5):**
- `CL`: Clearance (L/h)
- `V1`: Central volume of distribution (L)
- `V2`: Peripheral volume of distribution (L)
- `Q`: Inter-compartmental clearance (L/h)
- `KA`: Absorption rate constant (1/h)

**Eigenvalue Decomposition:**
```
β = 0.5 * [(k + k12 + k21) - sqrt((k + k12 + k21)² - 4*k*k21)]
α = (k * k21) / β
```

where:
- `k = CL/V1` (elimination rate)
- `k12 = Q/V1` (central to peripheral)
- `k21 = Q/V2` (peripheral to central)

**Coefficients:**
```
A = (k21 - α)/(β - α)
B = (k21 - β)/(α - β)
```

**Reference:** PFIM Section 1.2.2.3, Equations 1.16-1.18

### 3. Three-Compartment Model (`3comp`, `three_compartment`)

**Parameters (7):**
- `CL`: Clearance (L/h)
- `V1`: Central volume of distribution (L)
- `V2`: First peripheral volume (L)
- `V3`: Second peripheral volume (L)
- `Q2`: Inter-compartmental clearance 1-2 (L/h)
- `Q3`: Inter-compartmental clearance 1-3 (L/h)
- `KA`: Absorption rate constant (1/h)

**Three Eigenvalues (α, β, γ):**

Calculated by solving the characteristic polynomial:
```
a0 = k*k21*k31
a1 = k*k31 + k21*k31 + k21*k13 + k*k21 + k31*k12
a2 = k + k12 + k13 + k21 + k31
```

Using Cardano's method for cubic equations to obtain α, β, and γ.

**Reference:** PFIM Section 1.2.3.3, Equations 1.25-1.27

## Pharmacodynamic Models

### Immediate Response Models

These models describe immediate drug effects without temporal dynamics.

#### 1. Emax Model (`emax`)

**Parameters (3):**
- `S0`: Baseline effect
- `EMAX`: Maximum effect
- `C50`: Concentration producing 50% of maximum effect

**Equation (PFIM 2.5):**
```
E(t) = S0 + (EMAX * C(t)) / (C(t) + C50)
```

**Reference:** PFIM Section 2.1.1, Equation 2.5

#### 2. Sigmoid Emax Model (`sigmoid_emax`, `sigmoidmax`)

**Parameters (4):**
- `S0`: Baseline effect
- `EMAX`: Maximum effect
- `C50`: Concentration producing 50% of maximum effect
- `GAMMA`: Hill coefficient (sigmoidicity factor)

**Equation (PFIM 2.6):**
```
E(t) = S0 + (EMAX * C(t)^γ) / (C(t)^γ + C50^γ)
```

**Reference:** PFIM Section 2.1.1, Equation 2.6

#### 3. Imax Model (`imax`)

**Parameters (3):**
- `S0`: Baseline effect
- `IMAX`: Maximum inhibition (0-1)
- `C50`: Concentration producing 50% of maximum inhibition

**Equation (PFIM 2.7):**
```
E(t) = S0 * (1 - (IMAX * C(t)) / (C(t) + C50))
```

**Reference:** PFIM Section 2.1.1, Equation 2.7

#### 4. Sigmoid Imax Model (`sigmoid_imax`, `sigmoidimax`)

**Parameters (4):**
- `S0`: Baseline effect
- `IMAX`: Maximum inhibition (0-1)
- `C50`: Concentration producing 50% of maximum inhibition
- `GAMMA`: Hill coefficient

**Equation (PFIM 2.8):**
```
E(t) = S0 * (1 - (IMAX * C(t)^γ) / (C(t)^γ + C50^γ))
```

**Reference:** PFIM Section 2.1.1, Equation 2.8

### Turnover Response Models

These models describe indirect drug effects on synthesis (Rin) or degradation (kout) rates.

#### 5. Turnover with Stimulation of Input (`turnover_rin_emax`)

**Parameters (5):**
- `RIN`: Zero-order production rate
- `KOUT`: First-order degradation rate constant
- `EMAX`: Maximum stimulation of Rin
- `C50`: Concentration producing 50% of maximum stimulation
- `GAMMA`: Hill coefficient

**Differential Equation (PFIM 2.16):**
```
dR/dt = Rin * (1 + (EMAX*C)/(C + C50)) - kout * R
```

**Baseline:** `R0 = Rin/kout`

**Reference:** PFIM Section 2.2.1, Equation 2.16

#### 6. Turnover with Inhibition of Output (`turnover_kout_imax`)

**Parameters (5):**
- `RIN`: Zero-order production rate
- `KOUT`: First-order degradation rate constant
- `IMAX`: Maximum inhibition of kout
- `C50`: Concentration producing 50% of maximum inhibition
- `GAMMA`: Hill coefficient

**Differential Equation (PFIM 2.24):**
```
dR/dt = Rin - kout * (1 - (IMAX*C)/(C + C50)) * R
```

**Baseline:** `R0 = Rin/kout`

**Reference:** PFIM Section 2.2.2, Equation 2.24

## Model Usage

### Creating PK Models

```rust
use phikl1::models::create_model;

// One-compartment
let model = create_model("1comp");

// Two-compartment
let model = create_model("2comp");

// Three-compartment
let model = create_model("3comp");
```

### Creating PD Models

```rust
use phikl1::models::create_pd_model;

// Immediate response
let pd_model = create_pd_model("emax");
let pd_model = create_pd_model("sigmoid_emax");
let pd_model = create_pd_model("imax");
let pd_model = create_pd_model("sigmoid_imax");

// Turnover models
let pd_model = create_pd_model("turnover_rin_emax");
let pd_model = create_pd_model("turnover_kout_imax");
```

## Implementation Notes

### PK Models
- All models use analytical solutions for computational efficiency
- Time evolution is computed incrementally using `ModelState`
- Eigenvalue decomposition follows PFIM methodology exactly
- Parameters use clearance/volume parameterization (not micro-constants)

### PD Models
- **Immediate response models:** Algebraic equations, no state
- **Turnover models:** Require numerical integration (Euler method with adaptive step size)
- PDState maintains response value and time for turnover models
- Baseline initialization: `R0 = Rin/kout` at t=0

### Numerical Stability
- All exponential terms use Rust's native `exp()` function
- Division by zero protected in all concentration-dependent terms
- Eigenvalue calculations use robust cubic root finding for 3-compartment
- Turnover models use small time steps (0.1 time units) for accuracy

## References

1. Dubois A, Bertrand J, Mentré F. "Mathematical Expressions of the Pharmacokinetic and Pharmacodynamic Models implemented in the PFIM software." UMR738, INSERM, University Paris Diderot. March 2011.

2. PFIM Software: www.pfim.biostat.fr

3. Monolix Software: software.monolix.org
