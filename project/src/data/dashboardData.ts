
import { API_BASE_URL } from './appConfig';


export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  extension?: string;
  children?: FileNode[];
  content?: string;
  size?: number;
  lastModified?: string;
}

// --- PHP BACKEND INTEGRATION ---

export const fetchFileStructureFromBackend = async (projectId: string): Promise<FileNode[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/project1/get.php?uid=${projectId}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.project && data.project.files) {
            const files = data.project.files;
            
            // Construct the Standard Folder Structure
            const root: FileNode[] = [
                { id: '1', name: 'Data', type: 'folder', children: [] },
                { id: '5', name: 'Models', type: 'folder', children: [] },
                { id: '9', name: 'Scripts', type: 'folder', children: [] },
                { id: '13', name: 'Results', type: 'folder', children: [] },
                { id: 'dap-1', name: 'Initial Plan', type: 'folder', children: [] },
                { id: 'dap-4', name: 'Final Plan', type: 'folder', children: [] },
                { id: 'reports-1', name: 'Initial Reports', type: 'folder', children: [] },
                { id: 'reports-4', name: 'Final Reports', type: 'folder', children: [] },
                { id: 'pres-1', name: 'Abstracts', type: 'folder', children: [] },
                { id: 'pres-3', name: 'Posters', type: 'folder', children: [] },
                { id: 'pres-5', name: 'Talks', type: 'folder', children: [] },
            ];

            // Helper to find folder by name
            const findFolder = (name: string) => root.find(n => n.name === name);

            files.forEach((f: any) => {
                // Determine folder based on extension or naming convention if path isn't explicit
                // In a real app, file_path would be stored in the DB.
                let targetFolder = findFolder('Data'); // Default fallback
                const ext = f.name.split('.').pop().toLowerCase();
                
                if (['mod', 'ctl', 'mlxtran'].includes(ext)) targetFolder = findFolder('Models');
                else if (['r', 'py', 'jl', 'm'].includes(ext)) targetFolder = findFolder('Scripts');
                else if (['txt', 'pdf', 'png', 'jpg'].includes(ext)) targetFolder = findFolder('Results');
                else if (['docx', 'md'].includes(ext)) {
                    if (f.name.toLowerCase().includes('report')) targetFolder = findFolder('Final Reports');
                    else if (f.name.toLowerCase().includes('plan')) targetFolder = findFolder('Final Plan');
                }
                else if (['pptx'].includes(ext)) targetFolder = findFolder('Talks');
                
                if (targetFolder && targetFolder.children) {
                    targetFolder.children.push({
                        id: f.id,
                        name: f.name,
                        type: 'file',
                        extension: ext,
                        size: parseInt(f.fileSize || '0'),
                        lastModified: f.lastModified,
                        content: '' // Content loaded on demand
                    });
                }
            });

            return root;
        }
        return [];
    } catch (e) {
        console.error("Failed to load files from backend", e);
        return [];
    }
}

// ------------------------------------------------


export const mockFileStructure: FileNode[] = [
  {
    id: '1',
    name: 'Data',
    type: 'folder',
    children: []
  },
  {
    id: '5',
    name: 'Models',
    type: 'folder',
    children: []
  },
  {
    id: '9',
    name: 'Scripts',
    type: 'folder',
    children: []
  },
  {
    id: '13',
    name: 'Results',
    type: 'folder',
    children: []
  }
];

export const sampleCode = `# Two-Compartment Pharmacokinetic Model
# Phase I Drug Absorption Study

$PROBLEM Two-compartment model with first-order absorption
$INPUT ID TIME DV AMT EVID CMT

$DATA plasma_concentrations.csv IGNORE=@

$SUBROUTINES ADVAN4 TRANS4

$PK
TVCL = THETA(1)
TVV2 = THETA(2)
TVQ  = THETA(3)
TVV3 = THETA(4)
TVKA = THETA(5)

CL = TVCL * EXP(ETA(1))
V2 = TVV2 * EXP(ETA(2))
Q  = TVQ  * EXP(ETA(3))
V3 = TVV3 * EXP(ETA(4))
KA = TVKA * EXP(ETA(5))

S2 = V2

$ERROR
IPRED = F
Y = IPRED * (1 + EPS(1)) + EPS(2)

$THETA
(0, 10)    ; CL (L/h)
(0, 50)    ; V2 (L)
(0, 5)     ; Q (L/h)
(0, 100)   ; V3 (L)
(0, 1)     ; KA (1/h)

$OMEGA
0.1        ; IIV CL
0.1        ; IIV V2
0.1        ; IIV Q
0.1        ; IIV V3
0.1        ; IIV KA

$SIGMA
0.1        ; Proportional error
1          ; Additive error

$ESTIMATION METHOD=1 INTERACTION MAXEVAL=9999 PRINT=5
$COVARIANCE PRINT=E
$TABLE ID TIME DV PRED IPRED CWRES NPDE
       ONEHEADER NOPRINT FILE=sdtab001`;

export const fileContents: Record<string, string> = {
  '2': `ID,TIME,DV,AMT,EVID,CMT
1,0,0,100,1,1
1,0.5,12.3,0,0,2
1,1,18.7,0,0,2
1,2,22.1,0,0,2
1,4,19.8,0,0,2
1,6,16.2,0,0,2
1,8,13.5,0,0,2
1,12,9.8,0,0,2
1,24,3.2,0,0,2
2,0,0,100,1,1
2,0.5,11.8,0,0,2
2,1,17.9,0,0,2
2,2,21.5,0,0,2
2,4,18.9,0,0,2
2,6,15.7,0,0,2
2,8,12.8,0,0,2
2,12,9.1,0,0,2
2,24,2.9,0,0,2`,
  '3': `ID,TIME,DOSE,ROUTE
1,0,100,PO
2,0,100,PO
3,0,100,PO
4,0,100,PO
5,0,100,PO`,
  '4': `ID,AGE,WEIGHT,SEX,RACE
1,25,70,M,1
2,32,65,F,1
3,28,75,M,2
4,45,68,F,1
5,38,72,M,1`,
  '6': sampleCode,
  '7': `$PROBLEM Population PK model with covariates
$INPUT ID TIME DV AMT EVID CMT AGE WEIGHT SEX

$DATA plasma_concentrations.csv IGNORE=@

$SUBROUTINES ADVAN4 TRANS4

$PK
TVCL = THETA(1) * (WEIGHT/70)**THETA(6) * (AGE/30)**THETA(7)
TVV2 = THETA(2) * (WEIGHT/70)**THETA(8)
TVQ  = THETA(3)
TVV3 = THETA(4)
TVKA = THETA(5)

CL = TVCL * EXP(ETA(1))
V2 = TVV2 * EXP(ETA(2))
Q  = TVQ  * EXP(ETA(3))
V3 = TVV3 * EXP(ETA(4))
KA = TVKA * EXP(ETA(5))

S2 = V2

$ERROR
IPRED = F
Y = IPRED * (1 + EPS(1)) + EPS(2)

$THETA
(0, 10)    ; CL (L/h)
(0, 50)    ; V2 (L)
(0, 5)     ; Q (L/h)
(0, 100)   ; V3 (L)
(0, 1)     ; KA (1/h)
(0, 0.75)  ; Weight effect on CL
(0, -0.3)  ; Age effect on CL
(0, 1)     ; Weight effect on V2

$OMEGA
0.1        ; IIV CL
0.1        ; IIV V2
0.1        ; IIV Q
0.1        ; IIV V3
0.1        ; IIV KA

$SIGMA
0.1        ; Proportional error
1          ; Additive error`,
  '8': `$PROBLEM Covariate model development
$INPUT ID TIME DV AMT EVID CMT AGE WEIGHT SEX CRCL

$DATA plasma_concentrations.csv IGNORE=@

$SUBROUTINES ADVAN4 TRANS4

$PK
; Covariate effects
CLCOV = (WEIGHT/70)**0.75 * (CRCL/100)**0.8 * (1 + 0.2*(SEX-1))
V2COV = (WEIGHT/70)**1.0

TVCL = THETA(1) * CLCOV
TVV2 = THETA(2) * V2COV
TVQ  = THETA(3)
TVV3 = THETA(4)
TVKA = THETA(5)

CL = TVCL * EXP(ETA(1))
V2 = TVV2 * EXP(ETA(2))
Q  = TVQ  * EXP(ETA(3))
V3 = TVV3 * EXP(ETA(4))
KA = TVKA * EXP(ETA(5))

S2 = V2`,
  '10': `# Data Preparation Script
# Load required libraries
library(dplyr)
library(ggplot2)
library(readr)

# Read plasma concentration data
plasma_data <- read_csv("Data/plasma_concentrations.csv")

# Read dosing records
dosing_data <- read_csv("Data/dosing_records.csv")

# Read demographics
demo_data <- read_csv("Data/demographics.csv")

# Merge datasets
combined_data <- plasma_data %>%
  left_join(dosing_data, by = "ID") %>%
  left_join(demo_data, by = "ID")

# Data cleaning and validation
# Remove missing values
clean_data <- combined_data %>%
  filter(!is.na(DV), DV > 0) %>%
  mutate(
    LNDV = log(DV),
    WEIGHT_NORM = WEIGHT / 70,
    AGE_NORM = AGE / 30
  )

# Export cleaned data
write_csv(clean_data, "Data/cleaned_data.csv")

# Summary statistics
summary(clean_data)`,
  '11': `# Model Fitting Script
library(nlmixr)
library(dplyr)

# Load cleaned data
data <- read_csv("Data/cleaned_data.csv")

# Define two-compartment model
two_comp_model <- function() {
  ini({
    tcl <- log(10)    # log Cl (L/h)
    tv2 <- log(50)    # log V2 (L)
    tq <- log(5)      # log Q (L/h)
    tv3 <- log(100)   # log V3 (L)
    tka <- log(1)     # log Ka (1/h)
    
    eta.cl ~ 0.1
    eta.v2 ~ 0.1
    eta.q ~ 0.1
    eta.v3 ~ 0.1
    eta.ka ~ 0.1
    
    prop.err <- 0.1
    add.err <- 1
  })
  
  model({
    cl <- exp(tcl + eta.cl)
    v2 <- exp(tv2 + eta.v2)
    q <- exp(tq + eta.q)
    v3 <- exp(tv3 + eta.v3)
    ka <- exp(tka + eta.ka)
    
    d/dt(depot) <- -ka * depot
    d/dt(central) <- ka * depot - (cl/v2) * central - (q/v2) * central + (q/v3) * peripheral
    d/dt(peripheral) <- (q/v2) * central - (q/v3) * peripheral
    
    cp <- central / v2
    cp ~ prop(prop.err) + add(add.err)
  })
}

# Fit model
fit <- nlmixr(two_comp_model, data, est="focei")

# Print results
print(fit)`,
  '12': `# Model Diagnostics Script
library(ggplot2)
library(gridExtra)

# Load model fit results
load("Results/model_fit.RData")

# Goodness of fit plots
p1 <- ggplot(fit, aes(PRED, DV)) +
  geom_point(alpha = 0.6) +
  geom_smooth(method = "lm", se = FALSE, color = "red") +
  geom_abline(slope = 1, intercept = 0, linetype = "dashed") +
  labs(x = "Population Predictions", y = "Observations") +
  theme_minimal()

p2 <- ggplot(fit, aes(IPRED, DV)) +
  geom_point(alpha = 0.6) +
  geom_smooth(method = "lm", se = FALSE, color = "red") +
  geom_abline(slope = 1, intercept = 0, linetype = "dashed") +
  labs(x = "Individual Predictions", y = "Observations") +
  theme_minimal()

p3 <- ggplot(fit, aes(PRED, CWRES)) +
  geom_point(alpha = 0.6) +
  geom_smooth(method = "loess", se = FALSE, color = "red") +
  geom_hline(yintercept = 0, linetype = "dashed") +
  labs(x = "Population Predictions", y = "CWRES") +
  theme_minimal()

p4 <- ggplot(fit, aes(TIME, CWRES)) +
  geom_point(alpha = 0.6) +
  geom_smooth(method = "loess", se = FALSE, color = "red") +
  geom_hline(yintercept = 0, linetype = "dashed") +
  labs(x = "Time", y = "CWRES") +
  theme_minimal()

# Combine plots
grid.arrange(p1, p2, p3, p4, ncol = 2)

# Save plots
ggsave("Results/goodness_of_fit.pdf", width = 12, height = 10)`,
  '14': `Parameter Estimates - Two Compartment Model
========================================

THETA Estimates:
THETA(1) CL:    9.85 L/h    (RSE: 8.2%)
THETA(2) V2:    48.3 L      (RSE: 12.1%)
THETA(3) Q:     4.92 L/h    (RSE: 15.3%)
THETA(4) V3:    95.7 L      (RSE: 18.7%)
THETA(5) KA:    1.12 1/h    (RSE: 22.4%)

OMEGA (Inter-individual Variability):
OMEGA(1,1) CL:  0.089       (RSE: 25.6%)
OMEGA(2,2) V2:  0.124       (RSE: 28.9%)
OMEGA(3,3) Q:   0.156       (RSE: 35.2%)
OMEGA(4,4) V3:  0.198       (RSE: 42.1%)
OMEGA(5,5) KA:  0.234       (RSE: 38.7%)

SIGMA (Residual Variability):
SIGMA(1,1):     0.087       (RSE: 12.3%)
SIGMA(2,2):     0.95        (RSE: 15.8%)

Model Fit Statistics:
Objective Function: -2LL = 1245.67
AIC = 1265.67
BIC = 1298.45

Condition Number: 45.2`,
  '15': 'JVBERi0xLjQKMSAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA1OTUgODQyXS9SZXNvdXJjZXM8PC9Gb250PDwvRm9udDEgMyAwIFI+Pj4+L0NvbnRlbnRzIDQgMCBSPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9LaWRzWzEgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDI5MD4+CnN0cmVhbQpCVAovRm9udDEgMTIgVGYKNzIgNzUwIFRECihHb29kbmVzcyBvZiBGaXQgKEdPRikgYXNzZXNzbWVudCBpcyBhIGNyaXRpY2FsIHN0ZXAgaW4gcGhhcm1hY29tZXRyaWNzIG1vZGVsKSBUagowIC0xNSBUZAooZGV2ZWxvcG1lbnQgYW5kIHZhbGlkYXRpb24uIEl0IGV2YWx1YXRlcyBob3cgd2VsbCBhIGRldmVsb3BlZCBtb2RlbCBkZXNjcmliZXMpIFRqCjAgLTE1IFRkCih0aGUgb2JzZXJ2ZWQgZGF0YSBhbmQgaGVscHMgaWRlbnRpZnkgcG90ZW50aWFsIG1vZGVsIG1pc3NwZWNpZmljYXRpb25zLikgVGoKRVQNZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxNjAgMDAwMDAgbiAKMDAwMDAwMjE3IDAwMDAwIG4gCjAwMDAwMDAyODQgMDAwMDAgbiAKMDAwMDAwNjE4IDAwMDAwIG4gCjAwMDAwMDA2NjMgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDcvUm9vdCA1IDAgUj4+CnN0YXJ0eHJlZgo3MDkKJSVFT0YK',
  '16': 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL1Jlc291cmNlcyA8PC9Gb250IDw8L0YxIDIgMCBSID4+ID4+Ci9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYT4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUgL1BhZ2VzCi9LaWRzIFsxIDAgUiBdCi9Db3VudCAxPj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDU1Pj4Kc3RyZWFtCkJUCjcwIDcwMCBUZAovRjEgMTIgVGYKKFRoaXMgaXMgYSBzYW1wbGUgUERGLikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSPj4KZW5kb2JqCjYgMCBvYmoKPDwvQ3JlYXRvciAoZG9tcGRmKQovUHJvZHVjZXIgKGRvbXBkZik+PgplbmRvYmoKeHJlZgowIDcgMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNzQgMDAwMDAgbiAKMDAwMDAwMDEzMSAwMDAwMCBuIAowMDAwMDAwMTgzIDAwMDAwIG4gCjAwMDAwMDAyOTggMDAwMDAgbiAKMDAwMDAwMDMzMyAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNwovUm9vdCA1IDAgUgovSW5mbyA2IDAgUgo+PgpzdGFydHhyZWYKMzk0CiUlRU9GCg==',
  '17': `SUBJID,VISIT,LBTEST,LBORRES,LBORRESU
101,SCREENING,ALT,25,U/L
101,SCREENING,AST,30,U/L
101,WEEK 1,ALT,28,U/L
101,WEEK 1,AST,32,U/L
102,SCREENING,ALT,40,U/L
102,SCREENING,AST,45,U/L
102,WEEK 1,ALT,42,U/L
102,WEEK 1,AST,48,U/L`,
  '18': `ID,TIME,DV,AMT,EVID,CMT,AGE,WT,SEX
1,0,.,100,1,1,35,75,0
1,1,5.2,.,0,2,35,75,0
1,2,8.9,.,0,2,35,75,0
1,4,9.1,.,0,2,35,75,0
1,8,6.5,.,0,2,35,75,0
1,12,4.3,.,0,2,35,75,0
1,24,1.1,.,0,2,35,75,0
2,0,.,100,1,1,42,68,1
2,1,6.1,.,0,2,42,68,1
2,2,9.8,.,0,2,42,68,1
2,4,10.2,.,0,2,42,68,1
2,8,7.2,.,0,2,42,68,1
2,12,5.1,.,0,2,42,68,1
2,24,1.5,.,0,2,42,68,1
3,0,.,100,1,1,28,82,0
3,1,4.8,.,0,2,28,82,0
3,2,8.1,.,0,2,28,82,0
3,4,8.5,.,0,2,28,82,0
3,8,5.9,.,0,2,28,82,0
3,12,3.9,.,0,2,28,82,0
3,24,0.9,.,0,2,28,82,0`,
  '19': `# plots_table.py
# This script demonstrates creating a pandas DataFrame and a matplotlib plot.

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# 1. Create a pandas DataFrame (a table)
# This DataFrame will be visible in the 'Environment' panel and can be clicked to view in the 'Tables' panel.
data = {
    'subject_id': range(1, 11),
    'age': np.random.randint(25, 55, size=10),
    'weight_kg': np.round(np.random.normal(75, 10, size=10), 1),
    'concentration': np.round(np.random.uniform(5.0, 50.0, size=10), 2)
}
patient_data_df = pd.DataFrame(data)

# You can print the head of the dataframe to the console
print("Patient Data DataFrame head:")
print(patient_data_df.head())


# 2. Create a Matplotlib plot
# This plot will automatically appear in the 'Plots' panel after the script is run.
plt.figure(figsize=(8, 6))
plt.scatter(patient_data_df['weight_kg'], patient_data_df['concentration'], c=patient_data_df['age'], cmap='viridis')
plt.title('Concentration vs. Weight')
plt.xlabel('Weight (kg)')
plt.ylabel('Drug Concentration (ng/mL)')
plt.colorbar(label='Age (years)')
plt.grid(True)
# The plt.show() command is not needed; the environment automatically captures the figure.


# 3. Create a second plot (a histogram)
# Multiple plots can be generated in a single script run.
plt.figure(figsize=(8, 5))
plt.hist(patient_data_df['age'], bins=5, color='skyblue', edgecolor='black')
plt.title('Distribution of Patient Ages')
plt.xlabel('Age (years)')
plt.ylabel('Frequency')
plt.grid(axis='y', alpha=0.75)

print("\\nScript finished. Check the Environment, Tables, and Plots panels for output.")
`
};
