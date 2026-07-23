# Command-Line Options

PHIKL1 supports command-line options to override configuration file settings without modifying the JSON file.

## Available Options

### Output and Data Options

- `--o <directory>` - Override output directory
- `--data <file>` - Override data file path

### Estimation Options

- `--n_burn_in <num>` - Override number of burn-in iterations
- `--n_iter <num>` - Override number of estimation iterations
- `--n_chains <num>` - Override number of chains
- `--seed <num>` - Override random seed
- `--auto_init <0|1>` - Auto-derive initial parameters from data (0=use config values, 1=auto-derive)
- `--method <method>` - Estimation method (SAEM, FO, FOCE, FOCE-I)

## Examples

### Basic Usage

```bash
./target/release/phikl1 examples/config_1comp.json
```

### Override Output Directory

```bash
./target/release/phikl1 examples/config_1comp.json --o results_run1
```

### Override Estimation Parameters

```bash
./target/release/phikl1 examples/config_1comp.json --n_iter 500 --n_burn_in 200
```

### Multiple Overrides

```bash
./target/release/phikl1 examples/config_1comp.json \
  --o results_final \
  --n_iter 1000 \
  --n_burn_in 300 \
  --n_chains 5 \
  --seed 99999
```

### Override Data File

```bash
./target/release/phikl1 examples/config_1comp.json \
  --data mydata.csv \
  --o results_mydata
```

### Auto-Derive Initial Parameters

```bash
# Use data-driven initial parameter estimates
./target/release/phikl1 examples/config_1comp.json --auto_init 1

# Combine with other options
./target/release/phikl1 examples/config_1comp.json --auto_init 1 --n_iter 500
```

### Estimation Methods

```bash
# Use FOCE estimation instead of SAEM
./target/release/phikl1 examples/config_1comp.json --method FOCE

# Use FOCE-I estimation
./target/release/phikl1 examples/config_1comp.json --method FOCE-I

# Use FO for quick exploratory analysis
./target/release/phikl1 examples/config_1comp.json --method FO --n_iter 100

# Combine estimation method with other options
./target/release/phikl1 examples/config_1comp.json --method FOCE --n_iter 300 --auto_init 1
```

## Parameter Constraints

Configuration files now support optional parameter constraints to bound the parameter search space during estimation:

```json
"parameters": {
  "theta": [5.0, 50.0, 1.0],
  "constraints": {
    "theta_lower": [0.1, 1.0, 0.01],
    "theta_upper": [100.0, 500.0, 10.0]
  },
  "omega": [...],
  "sigma": 1.0
}
```

The constraints are optional. If not specified, parameters will be estimated without bounds.

## Residual Error Models

PHIKL1 supports three types of residual error models that can be specified in the configuration file:

### Additive Error Model

```json
"parameters": {
  "theta": [5.0, 50.0, 1.0],
  "omega": [...],
  "sigma": 1.0,
  "error_model": "additive"
}
```

**Formula:** `Y = F + ε`, where `ε ~ N(0, σ²)`

The residual error is constant and does not depend on the prediction.

### Proportional Error Model

```json
"parameters": {
  "theta": [5.0, 50.0, 1.0],
  "omega": [...],
  "sigma": 0.15,
  "sigma_proportional": 0.15,
  "error_model": "proportional"
}
```

**Formula:** `Y = F + F·ε`, where `ε ~ N(0, σ²prop)`

The residual error increases proportionally with the prediction magnitude.

### Combined Error Model (Default)

```json
"parameters": {
  "theta": [5.0, 50.0, 1.0],
  "omega": [...],
  "sigma": 0.5,
  "sigma_proportional": 0.1,
  "error_model": "combined"
}
```

**Formula:** `Y = F + ε₁ + F·ε₂`, where `ε₁ ~ N(0, σ²add)` and `ε₂ ~ N(0, σ²prop)`

Combines both additive and proportional error components.

**Note:** If `error_model` is not specified, the combined error model is used by default.

## Auto-Derived Initial Parameters

The `--auto_init` option allows PHIKL1 to automatically estimate initial THETA parameter values from the data instead of using the values specified in the configuration file.

### How It Works

When `--auto_init 1` is specified:

1. **Data Analysis:** The program analyzes concentration-time profiles for all subjects
2. **Route Inference:** Determines the route of administration (oral, IV bolus, etc.) based on Tmax and dose characteristics
3. **PK Parameter Estimation (THETA only):**
   - **Clearance (CL):** Estimated from AUC using trapezoidal rule
   - **Volume (V):** Estimated from Cmax and dose (for bolus) or from CL and half-life
   - **Absorption rate (Ka):** Estimated from Tmax using the equation: `Tmax = (ln(Ka) - ln(Ke)) / (Ka - Ke)`
   - **Half-life:** Estimated using log-linear regression on the terminal phase
4. **Population Averaging:** Individual estimates are averaged across all subjects
5. **Model-Specific Parameters:** For two-compartment models, additional parameters (V2, Q) are estimated using heuristics

**Important:** Only THETA parameters are estimated. OMEGA and SIGMA values from the configuration file are preserved. If not specified in the configuration, OMEGA defaults to 0.01 and SIGMA defaults to 1.0.

### Benefits

- **Better Convergence:** Starting closer to true values can improve convergence
- **Reduced Setup Time:** No need to manually estimate initial THETA values
- **Data-Driven:** Uses actual data characteristics rather than generic defaults
- **Flexible Variance:** Keeps your chosen OMEGA and SIGMA values for inter-individual and residual variability

### When to Use

- When you don't have good prior knowledge of parameter values
- When dealing with new compounds or formulations
- When starting values from config lead to poor convergence
- For exploratory analysis

### Output

When auto-init is enabled, the program displays:

```
═══════════════════════════════════════════════════════════════════
Auto-Deriving Initial Parameters from Data
═══════════════════════════════════════════════════════════════════
  Original THETA: [5.0, 50.0, 1.0]
  Estimated THETA: [4.8, 45.3, 0.85]
✓ Initial parameters derived from data
═══════════════════════════════════════════════════════════════════
```

The estimated values are also recorded in the run log file.

## Estimation Methods

PHIKL1 supports four estimation methods, similar to those available in NONMEM. The estimation method can be specified in the JSON configuration file or overridden via command line.

### Available Methods

#### SAEM (Stochastic Approximation Expectation-Maximization)
**Default method** - Robust stochastic algorithm for population models.

**Configuration:**
```json
"estimation": {
  "method": "SAEM",
  "n_burn_in": 100,
  "n_iter": 300,
  "n_chains": 3,
  "seed": 12345
}
```

**Characteristics:**
- Most robust for nonlinear mixed-effects models
- Uses stochastic simulation (MCMC) for random effects
- Two-phase algorithm: burn-in + convergence
- Less sensitive to initial values
- Can escape local minima
- Slower than FO/FOCE but more reliable

**Best for:**
- Final model estimation
- Complex nonlinear models
- When convergence issues with FOCE
- Models with many random effects

#### FO (First Order)
Linearizes the model around zero random effects (η = 0).

**Configuration:**
```json
"estimation": {
  "method": "FO",
  "n_iter": 100
}
```

**Characteristics:**
- Fastest estimation method
- Assumes η = 0 for all individuals
- No individual parameter estimates
- Less accurate for nonlinear models
- Good convergence properties

**Best for:**
- Initial exploratory analysis
- Screening many candidate models
- Approximately linear models
- When speed is priority

#### FOCE (First Order Conditional Estimation)
Linearizes around empirical Bayes estimates of individual random effects.

**Configuration:**
```json
"estimation": {
  "method": "FOCE",
  "n_iter": 200
}
```

**Characteristics:**
- Estimates individual random effects (η)
- More accurate than FO for nonlinear models
- Iterative optimization with gradient-based methods
- Provides empirical Bayes estimates (EBEs)
- Moderate computational cost

**Best for:**
- Additive error models
- Moderately nonlinear models
- When individual predictions needed
- Balance between speed and accuracy

#### FOCE-I (FOCE with Interaction)
FOCE with interaction between random effects and residual error.

**Configuration:**
```json
"estimation": {
  "method": "FOCE-I",
  "n_iter": 200
}
```

**Characteristics:**
- Accounts for η-ε interaction
- Most accurate for heteroscedastic errors
- Essential for proportional error models
- Most computationally intensive
- Better handling of error model complexity

**Best for:**
- Proportional or combined error models
- Final model with heteroscedasticity
- When highest accuracy required
- Models showing error variance changes

### Command-Line Override

The `--method` option overrides the method specified in the configuration file:

```bash
# Override config to use FOCE
./target/release/phikl1 config.json --method FOCE

# Use FO for quick initial run
./target/release/phikl1 config.json --method FO --n_iter 50
```

### Comparison Table

| Method   | Speed    | Accuracy | Individual η | η-ε Interaction | Best Use Case          |
|----------|----------|----------|--------------|-----------------|------------------------|
| SAEM     | Slowest  | High     | Yes          | No              | Final robust estimates |
| FO       | Fastest  | Low      | No (η=0)     | No              | Initial screening      |
| FOCE     | Fast     | Medium   | Yes          | No              | Additive error model   |
| FOCE-I   | Moderate | Highest  | Yes          | Yes             | Proportional errors    |

### Workflow Recommendation

1. **Initial Exploration**: Use `FO` with low iterations for quick model screening
2. **Model Development**: Use `FOCE` or `FOCE-I` (depending on error model) for iterative refinement
3. **Final Estimation**: Use `SAEM` for robust final parameter estimates
4. **Comparison**: Compare FOCE-I and SAEM results; if similar, both methods validate the model

Example workflow:
```bash
# Step 1: Quick screening with FO
./target/release/phikl1 config.json --method FO --n_iter 50

# Step 2: Refine with FOCE
./target/release/phikl1 config.json --method FOCE --n_iter 200

# Step 3: Final robust estimation with SAEM
./target/release/phikl1 config.json --method SAEM --n_iter 500
```

## Output Files

The individual predictions CSV file now includes both IWRES (Individual Weighted Residuals) and CWRES (Conditional Weighted Residuals):

```
ID,TIME,DV,PRED,IPRED,IWRES,CWRES
1,0.5,4.5,4.2,4.3,0.15,-0.12
1,1.0,8.2,7.9,8.1,0.08,-0.05
...
```

- **IWRES:** Measures deviation from individual prediction
- **CWRES:** Measures deviation from population prediction
