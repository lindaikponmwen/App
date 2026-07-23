# Implementation Notes: PHIKL1

## Architecture Overview

The program is organized into modular components following Rust best practices:

### Core Modules

1. **main.rs**: Entry point, CLI interface, and workflow orchestration
2. **config.rs**: JSON configuration parsing and validation
3. **dataset.rs**: Data loading and management
4. **models.rs**: Pharmacokinetic model implementations
5. **saem.rs**: SAEM algorithm implementation
6. **reports.rs**: Output report generation
7. **utils.rs**: Utility functions

## SAEM Algorithm Implementation

### Algorithm Flow

```
1. Initialize parameters (THETA, OMEGA, SIGMA)
2. For each iteration:
   a. E-step: Sample individual random effects (ETA) using MCMC
   b. For estimation iterations (after burn-in):
      - Compute sufficient statistics
      - M-step: Update parameters using stochastic approximation
3. Generate predictions and reports
```

### Key Features

#### 1. Stochastic Approximation

Step size decreases with iterations:
```
step_size = 1 / (iteration - burn_in + 1)
```

This ensures convergence while maintaining exploration early on.

#### 2. Individual Parameter Sampling

Uses Metropolis-Hastings MCMC to sample individual ETAs:
- Proposes new ETA values from normal distribution
- Accepts/rejects based on likelihood ratio
- Multiple proposals per iteration for better mixing

#### 3. Parameter Transformation

Individual parameters are computed as:
```
Individual_param[i] = THETA[i] * exp(ETA[i])
```

This ensures positive parameters (typical for PK parameters).

## Model Implementations

### One-Compartment Model

Implemented using analytical solutions for:
- Depot compartment decay: `A_depot(t) = A_depot(0) * exp(-KA * t)`
- Central compartment: Analytical solution for absorption + elimination

Advantages:
- Fast computation
- Numerically stable
- Exact solutions

### Two-Compartment Model

Uses hybrid approach:
- Calculates micro-constants from macro-parameters (CL, V1, V2, Q, KA)
- Employs eigenvalue method for two-compartment kinetics
- Analytical solutions where possible

### Custom ODE Model

Implements RK4 (Runge-Kutta 4th order) integration:
- Adaptive step sizing
- Suitable for arbitrary differential equations
- Framework for user-defined models

## Data Handling

### Dataset Structure

- Observations stored in vector for efficient access
- Subject data indexed by HashMap for O(1) lookup
- Supports standard NONMEM dataset format

### Event Handling

- `EVID = 1`: Dosing event (adds to depot compartment)
- `EVID = 0`: Observation event (used for likelihood calculation)
- Missing observations (DV = ".") properly handled

## Statistical Computations

### Log-Likelihood

Computed for each individual:
```
LL = Σ(-0.5 * (residual² / sigma + ln(sigma))) - 0.5 * (ETA' * OMEGA⁻¹ * ETA)
```

Components:
1. Observation likelihood (residual error model)
2. Random effects prior (multivariate normal)

### Model Fit Statistics

- Log-likelihood
- -2 Log-likelihood (for comparison to NONMEM)
- AIC: -2*LL + 2*n_params

## Output Reports

### 1. Summary Report (summary.txt)

Formatted for readability:
- Dataset statistics
- Model specification
- Parameter estimates with precision
- Individual parameter distributions

### 2. Individual Predictions (individual_predictions.csv)

Similar to NONMEM TABLE output:
- ID, TIME, DV, PRED, IPRED, IWRES
- One row per observation
- Easy to import into R/Python for diagnostics

### 3. Population Parameters (population_parameters.csv)

Individual-level estimates:
- Subject-specific parameters
- Individual ETAs
- Useful for post-hoc analysis

### 4. Run Log (run.log)

Detailed execution log:
- Configuration summary
- Convergence history
- Timestamps
- Similar to NONMEM .lst file

## Progress Monitoring

Real-time display shows:
- Current iteration number
- Log-likelihood (-2LL)
- Current THETA[0] value
- Current OMEGA[0,0] value
- Current SIGMA value

Updated every 10 iterations to balance information and performance.

## Performance Considerations

### Optimizations

1. **Release Builds**: Use `--release` flag for 10-100x speedup
2. **Efficient Data Structures**: HashMap indexing, vector storage
3. **Minimal Allocations**: Reuse of state vectors
4. **Parallel Potential**: Framework supports future parallelization (rayon dependency included)

### Typical Performance

For datasets with 10 subjects and 8-10 observations each:
- One-compartment: ~10-30 seconds for 400 iterations
- Two-compartment: ~20-60 seconds for 400 iterations

## Convergence Assessment

### Monitoring Convergence

Watch for:
1. Stabilization of parameter values (THETA, OMEGA, SIGMA)
2. -2LL reaching plateau
3. Consistency across iterations

### Recommendations

- Run at least 300 estimation iterations after burn-in
- Use 100-200 burn-in iterations
- Check convergence plots of theta_history

## Extending the Framework

### Adding New Models

1. Create struct implementing `PharmacokineticModel` trait
2. Implement required methods:
   - `predict()`: Compute concentration at given time
   - `n_parameters()`: Return parameter count
   - `parameter_names()`: Return parameter labels
3. Register in `create_model()` function

### Adding Covariates

To incorporate covariate effects:

1. Modify `compute_individual_params()` in saem.rs
2. Example: `CL = THETA[0] * exp(ETA[0] + THETA[3] * WEIGHT)`
3. Update parameter counts and initial values

### Adding New ODE Solvers

Current implementation uses RK4. To add other solvers:
1. Implement in models.rs
2. Add solver selection in configuration
3. Consider stiff solvers (e.g., LSODA) for stiff systems

## Known Limitations

1. **Covariate Models**: Not yet fully implemented (framework ready)
2. **Inter-Occasion Variability**: Not implemented
3. **Parallel Chains**: Single-threaded currently (parallel framework ready)
4. **Diagnostic Plots**: Not generated (use external tools like R/Python)
5. **Non-Normal Random Effects**: Only normal distribution supported

## Future Enhancements

Potential additions:
- Parallel MCMC chains
- Diagnostic plots (VPC, GOF plots)
- Covariate model building
- Non-linear residual error models
- Inter-occasion variability
- Bootstrap for uncertainty quantification
- More sophisticated ODE solvers
- Model comparison tools (LRT, BIC)

## Technical Notes

### Dependencies

- `nalgebra`: Linear algebra (matrices, vectors)
- `csv`: Dataset reading
- `serde/serde_json`: Configuration parsing
- `rand/rand_distr`: Random number generation
- `statrs`: Statistical distributions
- `chrono`: Timestamps
- `rayon`: Parallel processing framework (not yet utilized)

### Numerical Stability

- Matrix inversions use `try_inverse()` with fallback to identity
- Exponential transformations prevent negative parameters
- Log-likelihood calculations avoid underflow
- Time step adaptation in ODE solver

## Validation

To validate implementation:
1. Compare results to NONMEM/MONOLIX on same dataset
2. Check parameter recovery with simulated data
3. Verify convergence with multiple random seeds
4. Test with known analytical solutions

## References

Algorithm based on:
- Kuhn & Lavielle (2005) "Maximum likelihood estimation in nonlinear mixed effects models"
- MONOLIX implementation details
- NONMEM methodology

## Support

For issues or questions:
- Check parameter initial values
- Increase iterations if not converged
- Verify dataset format
- Review log file for detailed diagnostics
