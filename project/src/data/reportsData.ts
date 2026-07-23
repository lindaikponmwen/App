import { FileNode } from './dashboardData';

export const reportsFileStructure: FileNode[] = [
  {
    id: 'reports-1',
    name: 'Initial Reports',
    type: 'folder',
    children: []
  },
  {
    id: 'reports-4',
    name: 'Final Reports',
    type: 'folder',
    children: []
  }
];

export const reportsFileContents: Record<string, string> = {
  'reports-2': `# Interim Report Draft

## Summary of Progress
This document provides a summary of the project progress as of April 1st, 2025. Key milestones have been achieved in data collection and preliminary analysis.

### Key Findings
- The model runs show good convergence.
- Initial parameter estimates are within the expected range.
`,
  'reports-3': `<h1>Preliminary Findings Report</h1><p><strong>Date:</strong> 2025-04-05</p><h2>Summary</h2><p>Preliminary analysis of the pharmacokinetic data from the first two cohorts indicates that the drug follows a two-compartment model. The absorption is rapid, with Tmax observed at approximately 1.5 hours post-dose.</p><h3>Key Observations:</h3><ul><li>Linear pharmacokinetics observed in the dose range studied so far.</li><li>No serious adverse events have been reported.</li><li>Mean clearance (CL/F) is estimated to be 15.2 L/h.</li></ul><p>Further analysis will be conducted as more data becomes available.</p>`,
  'reports-5': `<h1>Final Study Report: Phase I Drug Absorption</h1><h2>A Single-Dose, Open-Label Study in Healthy Volunteers</h2><p><strong>Study ID:</strong> XYZ-101</p><p><strong>Date:</strong> 2025-05-20</p><!-- pagebreak --><h2>1. Synopsis</h2><p>This study evaluated the pharmacokinetics, safety, and tolerability of the investigational drug. The drug was well-tolerated at all dose levels. A two-compartment model with first-order absorption and linear elimination provided the best fit for the observed plasma concentration data. Dose-proportional increases in Cmax and AUC were observed.</p><h2>2. Pharmacokinetic Results</h2><p>Mean pharmacokinetic parameters are summarized below:</p><table><thead><tr><th>Dose</th><th>Cmax (ng/mL)</th><th>AUC (ng*h/mL)</th><th>t1/2 (h)</th></tr></thead><tbody><tr><td>10mg</td><td>150.3</td><td>1250.7</td><td>8.2</td></tr><tr><td>25mg</td><td>380.1</td><td>3100.2</td><td>8.5</td></tr><tr><td>50mg</td><td>745.8</td><td>6205.9</td><td>8.3</td></tr></tbody></table><h3>Conclusion</h3><p>The investigational drug exhibits predictable, linear pharmacokinetics and a favorable safety profile in the dose range of 10-50mg.</p>`,
  'reports-6': `# Summary for Publication

## Abstract
The pharmacokinetic profile of Drug-X was evaluated in a Phase I study with healthy volunteers. A two-compartment model with first-order absorption best described the data.
`
};