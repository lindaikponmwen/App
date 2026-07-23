import { GlossaryItem } from './types';

export const glossaryData: GlossaryItem[] = [
  {
    term: 'Pharmacokinetics (PK)',
    definition: 'The study of how an organism affects a drug, covering absorption, distribution, metabolism, and excretion (ADME).',
    category: 'General',
  },
  {
    term: 'Pharmacodynamics (PD)',
    definition: 'The study of what a drug does to the body, including the mechanism of action and the relationship between drug concentration and effect.',
    category: 'General',
  },
  {
    term: 'Clearance (CL)',
    definition: 'The volume of plasma from which a substance is completely removed per unit of time. It quantifies the rate of drug elimination from the body.',
    category: 'PK Parameters',
  },
  {
    term: 'Volume of Distribution (Vd)',
    definition: 'The theoretical volume that would be necessary to contain the total amount of an administered drug at the same concentration that it is observed in the blood plasma.',
    category: 'PK Parameters',
  },
  {
    term: 'Half-life (t½)',
    definition: 'The time required for the amount of a drug in the body to decrease by one-half.',
    category: 'PK Parameters',
  },
  {
    term: 'Bioavailability (F)',
    definition: 'The fraction of an administered dose of unchanged drug that reaches the systemic circulation.',
    category: 'PK Parameters',
  },
  {
    term: 'AUC',
    definition: 'Area Under the Curve, representing the total drug exposure over time.',
    category: 'PK Parameters',
  },
  {
    term: 'Cmax',
    definition: 'The maximum (or peak) serum concentration that a drug achieves in a specified compartment or test area of the body after the drug has been administered and before the administration of a second dose.',
    category: 'PK Parameters',
  },
  {
    term: 'NONMEM',
    definition: 'A software package for population pharmacokinetic/pharmacodynamic modeling, widely used in drug development.',
    category: 'Software',
  },
  {
    term: 'Monolix',
    definition: 'A software platform for population modeling in pharmacometrics, known for its user-friendly interface and robust algorithms.',
    category: 'Software',
  },
  {
    term: '$PK Block',
    definition: 'In NONMEM, this block contains the code that defines the pharmacokinetic model parameters.',
    category: 'NONMEM',
  },
  {
    term: '$ERROR Block',
    definition: 'In NONMEM, this block defines the residual error model, which describes the variability between observed and predicted concentrations.',
    category: 'NONMEM',
  },
  {
    term: '$PROB',
    definition: 'A NONMEM control record used to provide a title or brief description for the analysis problem.',
    category: 'NONMEM Control Records',
  },
  {
    term: '$INPUT',
    definition: 'A NONMEM control record that lists the names of the data items in the order they appear in the data file.',
    category: 'NONMEM Control Records',
  },
  {
    term: '$DATA',
    definition: 'A NONMEM control record that specifies the path to the dataset to be used for the analysis.',
    category: 'NONMEM Control Records',
  },
  {
    term: '$SUBROUTINES',
    definition: 'A NONMEM control record that specifies which predefined ADVAN model and TRANS parameterization to use.',
    category: 'NONMEM Control Records',
  },
  {
    term: '$THETA',
    definition: 'A vector of fixed-effect parameters that represent typical population values (e.g., typical clearance).',
    category: 'NONMEM Control Records',
  },
  {
    term: '$OMEGA',
    definition: 'The variance-covariance matrix for inter-individual random effects (ETAs), describing between-subject variability.',
    category: 'NONMEM Control Records',
  },
  {
    term: '$SIGMA',
    definition: 'The variance-covariance matrix for residual random effects (EPSILONs), describing residual unexplained variability.',
    category: 'NONMEM Control Records',
  },
  {
    term: '$ESTIMATION',
    definition: 'A NONMEM control record specifying the estimation method (e.g., FOCE-I) and options for model fitting.',
    category: 'NONMEM Control Records',
  },
  {
    term: '$TABLE',
    definition: 'A NONMEM control record used to request a tabular output file containing user-specified items like PRED, CWRES, etc.',
    category: 'NONMEM Control Records',
  },
  {
    term: 'ADVAN',
    definition: 'A library of subroutines in NONMEM that define the structural model, such as a one or two-compartment model.',
    category: 'NONMEM Core Concepts',
  },
  {
    term: 'TRANS',
    definition: 'A library of subroutines in NONMEM that define the parameterization of an ADVAN model (e.g., Clearance/Volume vs. micro-rate constants).',
    category: 'NONMEM Core Concepts',
  },
  {
    term: 'ETA (η)',
    definition: 'A random variable representing the deviation of an individual\'s parameter from the typical population value. It quantifies between-subject variability.',
    category: 'NONMEM Core Concepts',
  },
  {
    term: 'EPSILON (ε)',
    definition: 'A random variable representing the residual error, i.e., the difference between an observed value and the individual model prediction.',
    category: 'NONMEM Core Concepts',
  },
  {
    term: 'DV (Dependent Variable)',
    definition: 'A data item representing the observed value, typically a drug concentration.',
    category: 'NONMEM Data Items',
  },
  {
    term: 'EVID (Event ID)',
    definition: 'A data item indicating the type of event for a record. E.g., 0 for observation, 1 for dose.',
    category: 'NONMEM Data Items',
  },
  {
    term: 'AMT (Amount)',
    definition: 'A data item representing the amount of drug administered in a dose record.',
    category: 'NONMEM Data Items',
  },
  {
    term: 'Census 2',
    definition: 'A comprehensive project manager for NONMEM that provides detailed summaries, comparisons, and overviews of model runs. It includes features for post-run processing and output display but is no longer maintained.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'Finch Studio',
    definition: 'An integrated modeling environment designed for pharmacometricians to visualize, develop, and organize population PK/PD models and data. It features a powerful NONMEM code editor, a large model library, and interactive data visualizations.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'Improve',
    definition: 'A tool focused on providing control and traceability for the entire modeling and simulation workflow, functioning similarly to a standard file explorer to track files and decisions.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'InSysBio',
    definition: 'A provider of Quantitative Systems Pharmacology (QSP) modeling services and developer of a suite of QSP tools, including Heta language, Immune Response Template (IRT), and various databases.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'IQR Tools',
    definition: 'An R package for seamless modeling across systems pharmacology and pharmacometrics. It provides interfaces for NONMEM, MONOLIX, and NLMIXR, allowing users to switch between different estimation platforms.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'IQReport',
    definition: 'A solution for reproducible research and efficient reporting in Microsoft Word, using an extended markdown language to create customized corporate-style documents.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'jinko',
    definition: 'An in-silico trial design and simulation platform that uses computer modeling, disease models, and virtual populations to design and simulate clinical trials.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'mrgsolve',
    definition: 'A free, open-source R package developed by Metrum Research Group for simulating from hierarchical, nonlinear models, commonly used in pharmacometrics for PK/PD simulations.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'N.I.M.R.O.D.',
    definition: 'A Fortran program for Bayesian estimation in Ordinary Differential Equations (ODE) models with random effects, using a normal approximation of the posterior distribution.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'Open Systems Pharmacology (OSP) Suite',
    definition: 'A free, open-source software suite for whole-body physiologically-based pharmacokinetic (PBPK) and QSP modeling. Its best-known tools are PK-Sim and MoBi.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'PFIM',
    definition: 'An R package available on CRAN for evaluating and optimizing population experimental designs based on the Fisher Information Matrix (FIM) in nonlinear mixed-effects models.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'Pirana',
    definition: 'A modeling environment for NONMEM and PsN that provides a toolkit for running, managing, editing, and interpreting models. It supports local and cluster computing and integrates with R, Xpose, and Excel.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'PopED',
    definition: 'An R package that computes optimal experimental designs for both population and individual studies based on nonlinear mixed-effect models, often using the Fisher Information Matrix.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'Perl-speaks-NONMEM (PsN)',
    definition: 'A collection of Perl modules and programs that aid in the development of non-linear mixed-effect models with NONMEM, offering functionality from parameter extraction to advanced computer-intensive statistical methods.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'pyDarwin',
    definition: 'An open-source Python solution for machine learning-based model selection in NONMEM, utilizing algorithms like Genetic Algorithm, Bayesian Optimization, and Random Forest.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'rxode2',
    definition: 'A free, open-source R package for solving and simulating from ODE-based models. It compiles models written in a mini-language to C for rapid execution.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'Simcyp',
    definition: 'A simulation and data analysis tool from Certara for PBPK/PD applications. It features an extensive database of physiological and biological parameters for model-based drug development.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'Simulations Plus',
    definition: 'A premier developer of modeling & simulation software (e.g., GastroPlus™, ADMET Predictor™) and consulting services for drug discovery and development.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'Wings for NONMEM (WFN)',
    definition: 'A set of DOS batch command files and awk scripts designed to enhance productivity for NONMEM users, originally developed in 1989.',
    category: 'Pharmacometrics Software',
  },
  {
    term: 'Xpose',
    definition: 'A model-building aid for population analysis with NONMEM, written in R. It produces various plots and analyses for data checkout, goodness-of-fit, model diagnostics, and visualization.',
    category: 'Pharmacometrics Software',
  }
];