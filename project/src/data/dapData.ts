import { FileNode } from './dashboardData';

export const dapFileStructure: FileNode[] = [
  {
    id: 'dap-1',
    name: 'Initial Plan',
    type: 'folder',
    children: []
  },
  {
    id: 'dap-4',
    name: 'Final Plan',
    type: 'folder',
    children: []
  }
];

export const dapFileContents: Record<string, string> = {
  'dap-2': `# Initial Data Analysis Plan

## 1. Introduction
This document outlines the initial plan for data analysis for the Phase I Drug Absorption Study. It covers the primary and secondary endpoints, statistical methods, and data handling procedures.

## 2. Objectives
- **Primary objective:** To determine the pharmacokinetic profile of the investigational drug.
- **Secondary objective:** To assess the safety and tolerability of the drug in healthy volunteers.

## 3. Pharmacokinetic Model
The pharmacokinetic profile of the drug will be evaluated using nonlinear mixed-effects modeling. Both one- and two-compartment models will be considered.

### One-Compartment Model
A one-compartment model with first-order absorption and linear elimination will be initially fitted to the data. The differential equations are:

$$
\frac{d(Depot)}{dt} = -K_a \cdot Depot
$$
$$
\frac{d(Central)}{dt} = K_a \cdot Depot - \frac{CL}{V} \cdot Central
$$

Where $K_a$ is the absorption rate constant, $CL$ is the clearance, and $V$ is the volume of distribution. The concentration in the central compartment is given by:

$$
C = \frac{Central}{V}
$$

### Two-Compartment Model
A two-compartment model will also be explored to account for potential distribution into a peripheral compartment.

$$
C(t) = \frac{F \cdot \text{Dose} \cdot k_a}{V_d \cdot (k_a - k_e)} (e^{-k_e t} - e^{-k_a t})
$$
$$
\frac{d(Central)}{dt} = K_a \cdot Depot - \frac{CL}{V_1} \cdot Central - \frac{Q}{V_1} \cdot Central + \frac{Q}{V_2} \cdot Peripheral
$$
$$
\frac{d(Peripheral)}{dt} = \frac{Q}{V_1} \cdot Central - \frac{Q}{V_2} \cdot Peripheral
$$

Where $Q$ is the inter-compartmental clearance, $V_1$ is the central volume, and $V_2$ is the peripheral volume.
`,
  'dap-3': `<h1>Data Analysis Plan - Version 1.0</h1><p><strong>Project:</strong> Phase I Drug Absorption Study</p><p><strong>Date:</strong> 2025-02-03</p><p><strong>Author:</strong> Dr. Sarah Chen</p><p>&nbsp;</p><h2>1.0 Introduction</h2><p>This document details the planned statistical analyses for the Phase I Drug Absorption Study. The primary goal is to characterize the pharmacokinetic (PK) profile of the investigational drug.</p><!-- pagebreak --><h2>2.0 Study Objectives</h2><h3>2.1 Primary Objective</h3><ul><li>To assess the single-dose pharmacokinetic parameters (Cmax, AUC, Tmax) of the drug in healthy adult subjects.</li></ul><h3>2.2 Secondary Objectives</h3><ul><li>To evaluate the safety and tolerability of a single dose of the drug.</li><li>To explore the dose proportionality of the drug across different dose levels.</li></ul><h2>3.0 Analysis Methods</h2><p>Non-compartmental analysis (NCA) will be performed on the plasma concentration-time data for each subject. Key parameters will be summarized using descriptive statistics.</p>`,
  'dap-5': 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL1Jlc291cmNlcyA8PC9Gb250IDw8L0YxIDIgMCBSID4+ID4+Ci9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYT4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUgL1BhZ2VzCi9LaWRzIFsxIDAgUiBdCi9Db3VudCAxPj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDU1Pj4Kc3RyZWFtCkJUCjcwIDcwMCBUZAovRjEgMTIgVGYKKFRoaXMgaXMgYSBzYW1wbGUgUERGLikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSPj4KZW5kb2JqCjYgMCBvYmoKPDwvQ3JlYXRvciAoZG9tcGRmKQovUHJvZHVjZXIgKGRvbXBkZik+PgplbmRvYmoKeHJlZgowIDcgMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNzQgMDAwMDAgbiAKMDAwMDAwMDEzMSAwMDAwMCBuIAowMDAwMDAwMTgzIDAwMDAwIG4gCjAwMDAwMDAyOTggMDAwMDAgbiAKMDAwMDAwMDMzMyAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNwovUm9vdCA1IDAgUgovSW5mbyA2IDAgUgo+PgpzdGFydHhyZWYKMzk0CiUlRU9GCg==',
  'dap-6': `# Statistical Analysis Plan (SAP)

## Version 2.0 - Final

This document provides a detailed description of the statistical methods to be employed for the analysis of data from the study. This SAP is based on the protocol version 3.0, dated 2025-02-20.

### Analysis Sets
- **Safety Set:** All subjects who received at least one dose of the study drug.
- **Pharmacokinetic (PK) Set:** All subjects in the Safety Set with a measurable plasma concentration profile.
`
};