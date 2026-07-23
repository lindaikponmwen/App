import type { AgentRole } from './types';

// ── API / Network ────────────────────────────────────────────────────────────
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_DEFAULT_API_KEY =
  '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';
export const OPENROUTER_HTTP_REFERER = 'https://claude.ai';
export const OPENROUTER_APP_TITLE = 'PharmaCo MultiAgent';

// ── Demo / Sample Session (read-only, protected from edit/delete/duplicate) ──
export const DEMO_SESSION_ID = 'a1b2c3d4-0001-0001-0001-000000000001';

// ── LLM Models ───────────────────────────────────────────────────────────────
export const MODELS = [
  { id: 'google/gemma-4-31b-it:free', label: 'Gemma', provider: 'Google AI' },
  { id: 'moonshotai/kimi-k2.6:free', label: 'Kimi K2.6', provider: 'Moonshot AI' },
  { id: 'deepseek/deepseek-v4-flash:free', label: 'DeepSeek V4 Flash', provider: 'DeepSeek' },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', label: 'Nemotron Nano 30B', provider: 'NVIDIA' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free', label: 'Qwen3 80B', provider: 'Qwen' },
  { id: 'openai/gpt-oss-120b:free', label: 'GPT-OSS 120B', provider: 'OpenAI' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', label: 'Hermes 3 405B', provider: 'NousResearch' },
];

// ── LLM Token Limits ─────────────────────────────────────────────────────────
export const LLM_MAX_TOKENS_ORCHESTRATOR = 2048;
export const LLM_MAX_TOKENS_SUBAGENT = 3000;

// ── Orchestrator Behaviour ───────────────────────────────────────────────────
export const ORCHESTRATOR_HISTORY_WINDOW = 10;
export const ORCHESTRATOR_PRIOR_CONTEXT_MESSAGES = 3;
export const ORCHESTRATOR_PRIOR_CONTEXT_CHARS = 300;
export const AUTONOMOUS_MAX_TASKS = 25;

// ── Agent Labels / UI ────────────────────────────────────────────────────────
export const AGENT_LABELS: Record<AgentRole, string> = {
  scientist_ii: 'Scientist II',
  project_manager: 'Project Manager',
  pharmacometrician: 'Pharmacometrician',
  data_manager: 'Data Manager',
  medical_writer: 'Medical Writer',
  qc_manager: 'QC Manager',
};

export const AGENT_COLORS: Record<AgentRole, string> = {
  scientist_ii: 'text-green-400 bg-green-950 border-green-700',
  project_manager: 'text-blue-400 bg-blue-950 border-blue-700',
  pharmacometrician: 'text-emerald-400 bg-emerald-950 border-emerald-700',
  data_manager: 'text-violet-400 bg-violet-950 border-violet-700',
  medical_writer: 'text-amber-400 bg-amber-950 border-amber-700',
  qc_manager: 'text-rose-400 bg-rose-950 border-rose-700',
};

export const AGENT_AVATAR_COLORS: Record<AgentRole, string> = {
  scientist_ii: 'bg-green-700',
  project_manager: 'bg-blue-700',
  pharmacometrician: 'bg-emerald-700',
  data_manager: 'bg-violet-700',
  medical_writer: 'bg-amber-700',
  qc_manager: 'bg-rose-700',
};

export const AGENT_INITIALS: Record<AgentRole, string> = {
  scientist_ii: 'SII',
  project_manager: 'PM',
  pharmacometrician: 'PMx',
  data_manager: 'DM',
  medical_writer: 'MW',
  qc_manager: 'QC',
};

// ── Right Panel ───────────────────────────────────────────────────────────────
export const RIGHT_PANEL_DEFAULT_WIDTH = 320;
export const RIGHT_PANEL_MIN_WIDTH = 240;
export const RIGHT_PANEL_MAX_WIDTH = 640;

// ── Project Folder Structure ─────────────────────────────────────────────────
export const PROJECT_FOLDERS = [
  'Data',
  'Scripts/Models',
  'Scripts/R',
  'Scripts/NONMEM',
  'Results/Tables',
  'Results/Estimates',
  'Plots/GOF',
  'Plots/VPC',
  'Plots/Covariates',
  'Reports',
  'Config',
];

export function detectFolder(ext: string): string {
  const e = ext.toLowerCase();
  if (['.md', '.docx', '.doc', '.txt'].includes(e)) return 'Reports';
  if (['.csv', '.tab', '.xls', '.xlsx'].includes(e)) return 'Data';
  if (['.r'].includes(e)) return 'Scripts/R';
  if (['.ctl', '.mod', '.lst'].includes(e)) return 'Scripts/NONMEM';
  if (['.py', '.cpp', '.jl', '.m'].includes(e)) return 'Scripts/Models';
  if (['.json', '.yaml', '.yml'].includes(e)) return 'Config';
  return 'Reports';
}

const DATASET_EXTENSIONS = new Set(['.csv', '.tab', '.xls', '.xlsx', '.xpt', '.sas7bdat']);

function fileExtLower(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

/**
 * Enforce folder routing rules on any artifact path before saving:
 *  - Dataset files (.csv .tab .xls .xlsx .xpt .sas7bdat) → Data/<filename>
 *  - Non-dataset files that land in Data/ → Reports/<filename>
 */
export function sanitizeArtifactPath(path: string): string {
  const parts = path.replace(/^\//, '').split('/').filter(Boolean);
  if (parts.length === 0) return path;
  const filename = parts[parts.length - 1];
  const ext = fileExtLower(filename);
  const topFolder = parts[0];

  if (DATASET_EXTENSIONS.has(ext)) {
    if (topFolder !== 'Data') return `Data/${filename}`;
    return path;
  }

  if (topFolder === 'Data') {
    return `Reports/${parts.slice(1).join('/')}`;
  }

  return path;
}

// ── Welcome Screen Suggestions ───────────────────────────────────────────────
export const ANALYSIS_SUGGESTIONS = [
  'Run a population PK analysis for compound XYZ-001 using NONMEM and nlmixr2',
  'Explain how to set up a 2-compartment PopPK model in NONMEM',
  'What covariate screening approach should I use for this dataset?',
  'Help me interpret CWRES vs TIME plots showing a trend',
  'Describe the VPC simulation approach for a 1-compartment model',
  'What are typical %RSE thresholds for PK parameter acceptance?',
];

// ── Scope / Domain Gating ────────────────────────────────────────────────────
export const SCOPE_KEYWORDS = [
  'pk', 'pd', 'pkpd', 'pharmacokinetic', 'pharmacodynamic', 'pharmacometrics',
  'nonmem', 'nlmixr', 'monolix', 'rxode', 'mrgsolve',
  'clearance', 'volume', 'bioavailability', 'half-life', 'auc', 'cmax',
  'compartment', 'model', 'simulation', 'population', 'covariate',
  'absorption', 'distribution', 'metabolism', 'elimination',
  'iiv', 'eta', 'omega', 'sigma', 'theta', 'ofv', 'aic', 'bic',
  'vpc', 'gof', 'cwres', 'ipred', 'pred', 'residual',
  'nca', 'eda', 'dataset', 'data', 'cdisc', 'sdtm', 'adam',
  'report', 'presentation', 'qc', 'validation',
  'drug', 'compound', 'dose', 'concentration', 'clinical', 'trial',
  'pbpk', 'qsp', 'systems pharmacology',
  'checklist', 'analysis', 'project', 'initialize',
];

// ── Default Checklist ────────────────────────────────────────────────────────
export const DEFAULT_CHECKLIST_SECTIONS = [
  {
    number: '1',
    title: 'Project Initialization & Software Specification',
    tasks: [
      { ref: '1.1', description: 'Set up Session folder structure. Begin initial data analysis plan document Reports/analysis_plan.md' },
      { ref: '1.2', description: 'Specify software stack (R, NONMEM 7.5, nlmixr2, rxode2) in analysis plan' },
      { ref: '1.3', description: 'Define analysis objectives and scope in analysis plan' },
      { ref: '1.4', description: 'Specify methodology and anticipated recents in analysis plan' },
      { ref: '1.5', description: 'Document software versions and dependencies in analysis plan' },
      { ref: '1.5', description: 'Document references in analysis plan' },
    ],
  },
  {
    number: '2',
    title: 'Data Preparation',
    tasks: [
      { ref: '2.1', description: 'Obtain/upload source data files' },
      { ref: '2.2', description: 'Perform data import and integrity checks' },
      { ref: '2.3', description: 'Map data to CDISC SDTM/ADaM standards (if applicable)' },
      { ref: '2.4', description: 'Create analysis-ready NONMEM dataset (required columns: ID, TIME, DV, AMT, CMT, EVID, MDV, covariates)' },
      { ref: '2.5', description: 'Document data derivations and assumptions' },
      { ref: '2.6', description: 'Generate data specification document' },
    ],
  },
  {
    number: '3',
    title: 'Exploratory Data Analysis (EDA)',
    tasks: [
      { ref: '3.1', description: 'Generate summary statistics (demographics, dosing, PK concentrations)' },
      { ref: '3.2', description: 'Plot concentration-time profiles (individual and population-level, linear and semi-log)' },
      { ref: '3.3', description: 'Assess dose proportionality' },
      { ref: '3.4', description: 'Identify potential outliers and BQL handling strategy' },
      { ref: '3.5', description: 'Explore covariate distributions and correlations' },
      { ref: '3.6', description: 'Assess data richness and sampling adequacy' },
      { ref: '3.7', description: 'Generate EDA summary report with preliminary observations' },
    ],
  },
  {
    number: '4',
    title: 'Non-Compartmental Analysis (NCA)',
    tasks: [
      { ref: '4.1', description: 'Perform NCA using validated R package (PKNCA) or NONMEM' },
      { ref: '4.2', description: 'Estimate key PK parameters: CL/F, Vd/F, AUC, Cmax, Tmax, t½' },
      { ref: '4.3', description: 'Tabulate NCA results by dose group' },
      { ref: '4.4', description: 'Use NCA estimates as initial parameter estimates for compartmental modeling' },
      { ref: '4.5', description: 'Document NCA methodology and results' },
    ],
  },
  {
    number: '5',
    title: 'Base Structural Model Selection',
    tasks: [
      { ref: '5.1', description: 'Create NONMEM control stream for 1-compartment model (first-order absorption)' },
      { ref: '5.2', description: 'Create NONMEM control stream for 2-compartment model (first-order absorption)' },
      { ref: '5.3', description: 'Create NONMEM control stream for 1-compartment model (transit absorption, if applicable)' },
      { ref: '5.4', description: 'Execute all base model runs' },
      { ref: '5.5', description: 'Retrieve and compile results (OFV, AIC, BIC, parameter estimates, %RSE)' },
      { ref: '5.6', description: 'Compare models using OFV, AIC, BIC, and diagnostic plots' },
      { ref: '5.7', description: 'Select best structural model with scientific justification' },
      { ref: '5.8', description: 'Document model selection rationale' },
    ],
  },
  {
    number: '6',
    title: 'Random Effects Model Development',
    tasks: [
      { ref: '6.1', description: 'Add IIV on CL, V (and Ka, Q, V2 as applicable)' },
      { ref: '6.2', description: 'Evaluate IIV on each parameter individually and in combination' },
      { ref: '6.3', description: 'Test different omega structures (diagonal, block)' },
      { ref: '6.4', description: 'Evaluate residual error models (additive, proportional, combined)' },
      { ref: '6.5', description: 'Select best random effects structure based on ΔOFV > 3.84 (p<0.05)' },
      { ref: '6.6', description: 'Document random effects model development' },
    ],
  },
  {
    number: '7',
    title: 'Covariate Analysis',
    tasks: [
      { ref: '7.1', description: 'Perform graphical covariate screening (ETAs vs covariates)' },
      { ref: '7.2', description: 'Test body weight effect on CL and V (allometric scaling)' },
      { ref: '7.3', description: 'Evaluate additional covariates: age, sex, renal function, hepatic function' },
      { ref: '7.4', description: 'Perform forward inclusion (ΔOFV > 3.84, p<0.05)' },
      { ref: '7.5', description: 'Perform backward elimination (ΔOFV > 6.63, p<0.01)' },
      { ref: '7.6', description: 'Build full and reduced (final) covariate models' },
      { ref: '7.7', description: 'Tabulate covariate analysis results (parameter, ΔOFV, p-value, % change)' },
      { ref: '7.8', description: 'Select covariates with clinical and statistical justification' },
      { ref: '7.9', description: 'Document covariate analysis methodology and results' },
    ],
  },
  {
    number: '8',
    title: 'Final Model Refinement',
    tasks: [
      { ref: '8.1', description: 'Refine final model parameterization' },
      { ref: '8.2', description: 'Verify model convergence and successful minimization' },
      { ref: '8.3', description: 'Check condition number (< 1000 acceptable)' },
      { ref: '8.4', description: 'Verify parameter estimates are physiologically plausible' },
      { ref: '8.5', description: 'Ensure %RSE values indicate acceptable precision' },
      { ref: '8.6', description: 'Run final model with $COV step for variance-covariance matrix' },
      { ref: '8.7', description: 'Document final model specification' },
    ],
  },
  {
    number: '9',
    title: 'Model Diagnostics & Goodness-of-Fit',
    tasks: [
      { ref: '9.1', description: 'Generate standard GOF plots (DV vs PRED, DV vs IPRED, CWRES vs TIME/PRED)' },
      { ref: '9.2', description: 'Generate ETA distribution plots (histograms, boxplots)' },
      { ref: '9.3', description: 'Generate ETA correlation plots (ETA vs ETA scatter matrix)' },
      { ref: '9.4', description: 'Generate ETA vs covariate plots (post-final model)' },
      { ref: '9.5', description: 'Generate individual fit plots for representative subjects' },
      { ref: '9.6', description: 'Create parameter estimate table with %RSE and 95% CI' },
      { ref: '9.7', description: 'Compile all diagnostics into a summary report' },
    ],
  },
  {
    number: '10',
    title: 'Visual Predictive Check (VPC) & Model Qualification',
    tasks: [
      { ref: '10.1', description: 'Simulate 500–1000 replicates from the final model' },
      { ref: '10.2', description: 'Generate VPC plots (observed percentiles vs simulated prediction intervals: 5th, 50th, 95th)' },
      { ref: '10.3', description: 'Generate pcVPC (prediction-corrected VPC) if applicable' },
      { ref: '10.4', description: 'Assess VPC for adequate model performance across dose groups' },
      { ref: '10.5', description: 'Generate numerical predictive check (NPC) if appropriate' },
      { ref: '10.6', description: 'Document model qualification results and conclusions' },
      { ref: '10.7', description: 'Final model confirmed adequate for intended use' },
    ],
  },
  {
    number: '11',
    title: 'Reporting & Communication',
    tasks: [
      { ref: '11.1', description: 'Prepare full pharmacometrics final analysis report (Word): background, methods, results, discussion, conclusions, appendices' },
      { ref: '11.2', description: 'Prepare PowerPoint presentation: objectives, methods, EDA, model development, final parameters, GOF/VPC, conclusions' },
      { ref: '11.3', description: 'Generate Data Analysis Plan (DAP) if not previously created' },
      { ref: '11.4', description: 'QC review of all deliverables (report, presentation, scripts, data)' },
      { ref: '11.5', description: 'Address QC findings and finalize all documents' },
      { ref: '11.6', description: 'Archive all analysis files with version control' },
    ],
  },
];
