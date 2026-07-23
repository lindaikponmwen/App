
export interface AnalysisItem {
  name: string;
  description: string;
}

export interface CustomTemplateFile {
  name: string;
  content: string;
}

export interface AnalysisTemplate {
  id: string;
  title: string;
  description: string;
  plots: AnalysisItem[];
  tables: AnalysisItem[];
  files?: CustomTemplateFile[];
  customFiles?: CustomTemplateFile[];
  isCustom?: boolean;
}

export const analysisTemplates: AnalysisTemplate[] = [
  {
    id: 'eda',
    title: 'Exploratory Data Analysis (EDA)',
    description: "The goal of EDA is to understand the raw dataset's structure, identify potential issues (outliers, data entry errors), and generate initial hypotheses about the PK/PD relationship.",
    plots: [
      { name: 'Individual Concentration-Time Profiles', description: 'Plots of observed concentration vs. time for each subject, often overlaid or faceted by subject ID.' },
      { name: 'Aggregate Concentration-Time Profiles', description: 'Observed concentrations plotted against time, with data from all subjects overlaid on a single graph to visualize the overall trend and variability.' },
      { name: 'Concentration vs. Time by Dose/Covariate', description: 'Stratifying the concentration-time data by dose level, formulation, or key covariates (e.g., age group, renal function) to explore potential relationships visually.' },
      { name: 'Histograms/Density Plots', description: 'For key variables like AUC, Cmax, baseline biomarkers, or covariates to understand their distribution (e.g., normality, skewness).' },
      { name: 'Scatter Plots', description: 'To explore relationships between two continuous variables (e.g., concentration vs. a continuous covariate like weight or creatinine clearance).' },
      { name: 'Box Plots/Violin Plots', description: 'To compare the distribution of a PK parameter (e.g., clearance) or a biomarker across different categorical groups (e.g., sex, genotype).' },
    ],
    tables: [
      { name: 'Summary Statistics Tables', description: 'Mean, median, standard deviation, range, and quartiles for key covariates and derived PK parameters.' },
      { name: 'Demographics Table', description: 'A standard table in clinical reports summarizing the baseline characteristics of the study population.' },
    ],
    files: [
        {
            name: 'eda_script.R',
            content: `# EDA Script
library(ggplot2)
library(dplyr)
library(readr)

# Load Data
data <- read_csv("../Data/eda_dataset.csv")

# 1. Summary Statistics
summary(data)

# 2. Individual Plots
ggplot(data, aes(x=TIME, y=DV, group=ID)) +
  geom_line() + geom_point() +
  scale_y_log10() +
  labs(title="Individual Profiles", x="Time (h)", y="Concentration (ng/mL)")

# 3. Stratified by Dose
ggplot(data, aes(x=TIME, y=DV, group=ID, color=as.factor(DOSE))) +
  geom_line(alpha=0.5) +
  labs(title="Profiles by Dose", color="Dose")
`
        },
        {
            name: 'eda_dataset.csv',
            content: `ID,TIME,DV,DOSE,WT,AGE
1,0,0,100,70,45
1,1,5.2,100,70,45
1,2,8.1,100,70,45
1,4,6.5,100,70,45
2,0,0,100,65,50
2,1,4.8,100,65,50
2,2,7.5,100,65,50
2,4,5.9,100,65,50`
        },
        {
            name: 'eda_dap.md',
            content: `# EDA Data Analysis Plan

## Objectives
To characterize the pharmacokinetics of the study drug using exploratory data analysis techniques.

## Methods
- Data cleaning and verification.
- Visualization of individual and aggregate concentration-time profiles.
- Analysis of covariate relationships (Weight, Age).
`
        },
        {
            name: 'eda_report.md',
            content: `# EDA Preliminary Report

## Findings
- The dataset contains 2 subjects.
- Concentration-time profiles show expected absorption and elimination phases.
- No obvious outliers detected in this subset.
`
        },
        {
            name: 'eda_talk.pptx',
            content: `{"id":"eda-pres","title":"EDA Findings.pptx","themeId":"office","slides":[{"id":"s1","background":{"color":"#FFFFFF"},"elements":[{"id":"e1","type":"text","content":"Exploratory Data Analysis Findings","position":{"top":"20%","left":"10%"},"size":{"width":"80%","height":"auto"},"style":{"fontSize":"48px","fontWeight":"bold","textAlign":"center","color":"#2F5496"}},{"id":"e2","type":"text","content":"Preliminary Overview","position":{"top":"50%","left":"10%"},"size":{"width":"80%","height":"auto"},"style":{"fontSize":"24px","textAlign":"center","color":"#444444"}}]}]}`
        }
    ]
  },
  {
    id: 'nca',
    title: 'Non-Compartmental Analysis (NCA)',
    description: 'NCA is used to derive empirical PK parameters from the concentration-time data without assuming a specific compartmental model.',
    plots: [
      { name: 'Individual NCA Profiles', description: 'A concentration-time plot for each subject that includes key NCA-derived parameters like Cmax, Tmax, and the terminal elimination phase.' },
      { name: 'Semi-Log Concentration-Time Plots', description: 'Concentration (on a log scale) vs. time to easily visualize the terminal elimination phase.' },
    ],
    tables: [
      { name: 'Individual PK Parameter Table', description: 'A table listing all calculated NCA parameters (e.g., AUC0-t, AUC0-inf, Cmax, Tmax, t1/2) for each subject.' },
      { name: 'Summary PK Parameter Table', description: 'A table of summary statistics (mean, median, CV%) for all NCA parameters, often stratified by treatment group.' },
    ],
  },
  {
    id: 'model-diagnostics',
    title: 'Model Diagnostics (for Population PK/PD Models)',
    description: "These are used during model development to assess the model's fit to the data and to identify structural or stochastic model misspecifications.",
    plots: [
      { name: 'Goodness-of-Fit (GOF) Plots', description: 'A standard panel of four plots: DV vs. PRED, DV vs. IPRED, IWRES vs. IPRED, and IWRES vs. Time.' },
      { name: 'Conditional Weighted Residuals (CWRES) Plots', description: 'A more robust diagnostic than IWRES, especially for detecting model misspecifications. Plots include CWRES vs. Time and CWRES vs. PRED.' },
      { name: 'Normalized Prediction Distribution Errors (NPDE) Plots', description: 'Another advanced diagnostic to evaluate the entire predictive distribution of the model. Plots include NPDE vs. PRED, NPDE vs. Time, and a Q-Q plot of NPDE.' },
      { name: 'Covariate-Parameter Plots', description: 'Plots of Empirical Bayes Estimates (EBEs) of a parameter (e.g., CL) vs. a covariate to visually assess the effect of that covariate on the parameter.' },
    ],
    tables: [
      { name: 'Model Parameter Table', description: 'Lists all final model parameters, including fixed effects, random effects (IIV), and residual error parameters.' },
    ],
  },
  {
    id: 'model-validation',
    title: 'Model Validation / Qualification',
    description: "This step evaluates the final model's robustness, stability, and predictive performance.",
    plots: [
      { name: 'Visual Predictive Check (VPC)', description: 'Shows the observed data overlaid with the percentiles (e.g., 5th, 50th, 95th) of the model-simulated data to check predictive performance.' },
      { name: 'Numerical Predictive Check (NPC)', description: 'A statistical complement to the VPC, often presented as a plot of p-values across time bins or as a table.' },
      { name: 'Bootstrap Results Plot', description: 'A histogram or dot plot of the parameter estimates from the bootstrap replicates overlaid with the final model estimate to assess parameter precision and bias.' },
    ],
    tables: [
      { name: 'Bootstrap Results Table', description: 'A table summarizing the median, 95% confidence interval, and %RSE of the model parameters from the bootstrap analysis.' },
      { name: 'VPC Summary Table', description: 'A table quantifying the percentage of observed data that falls below, within, and above the simulated prediction intervals.' },
    ],
  },
  {
    id: 'simulations',
    title: 'Simulations',
    description: 'Model-based simulations are used to answer "what-if" questions for future scenarios.',
    plots: [
      { name: 'Concentration-Time Simulation Profiles', description: 'Shows the simulated concentration-time profiles for a virtual population, often with prediction intervals (e.g., 90% PI).' },
      { name: 'Probability of Target Attainment (PTA) Plots', description: 'Shows the percentage of a virtual population achieving a predefined PK/PD target across different doses or regimens.' },
      { name: 'Dose-Exposure/Response Plots', description: 'Shows the relationship between a simulated dose and a simulated exposure metric (e.g., AUC, Cmax) or PD response.' },
    ],
    tables: [
      { name: 'Simulation Summary Table', description: 'Summarizes the results of the simulation, for example, the median and 90% prediction interval of an exposure metric.' },
      { name: 'PTA Table', description: 'A table listing the PTA (%) for various doses and patient subgroups.' },
    ],
  },
  {
    id: 'dose-optimization',
    title: 'Dose Optimization',
    description: 'A specific application of simulations to identify the best dose or regimen.',
    plots: [
      { name: 'Exposure-Response (E-R) Plots', description: 'Central to dose optimization, these plots show the relationship between a simulated exposure metric and a clinical or biomarker response.' },
      { name: 'Dose Regimen Comparison Plots', description: 'Overlays concentration-time profiles or exposure metrics for various candidate dosing regimens to visually compare them.' },
      { name: 'Risk-Benefit Plots', description: 'Plots that juxtapose the probability of efficacy and the probability of an adverse event against dose or exposure.' },
    ],
    tables: [
      { name: 'Dose Selection Rationale Table', description: 'Summarizes the key simulation results (e.g., PTA for efficacy, PTA for safety) for each candidate dose.' },
    ],
  },
  {
    id: 'clinical-trial-reporting',
    title: 'Clinical Trial Reporting',
    description: 'These are the final outputs used to communicate results to regulators, clinicians, and other stakeholders.',
    plots: [
      { name: 'Final Summary Concentration-Time Plot', description: 'A clean, publication-ready plot of the observed data with the final model\'s prediction overlaid.' },
      { name: 'Final VPC Plot', description: 'A high-quality VPC for the final model, demonstrating its predictive performance.' },
      { name: 'Forest Plots', description: 'To show the effect size of different covariates on a PK parameter (e.g., clearance) in an easily interpretable format.' },
      { name: 'PK/PD Time Profiles', description: 'For trials with PD endpoints, plots showing the time course of both the drug concentration and the PD biomarker.' },
    ],
    tables: [
      { name: 'Final Model Parameter Table', description: 'The definitive table of all model parameters for the final, validated model.' },
      { name: 'Covariate Analysis Table', description: 'A table detailing the magnitude and statistical significance of each covariate\'s effect on PK parameters.' },
      { name: 'Dose Recommendations Table', description: 'A clear table stating the recommended dose(s) for the target population and any specific subpopulations.' },
    ],
  },
];
