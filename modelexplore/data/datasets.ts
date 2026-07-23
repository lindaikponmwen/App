import { DataRecord } from '../types';

export interface DatasetDerivationOp {
  type: string;
  id: string;
  params: any;
}

export interface DatasetConfig {
  id: string;
  name: string;
  description: string;
  rowCount: number;
  columns: string[];
  data: DataRecord[];
  createdAt: string;
  parentDatasetId?: string | null;
  pipeline?: DatasetDerivationOp[];
}

/**
 * Generates a random number from a normal distribution using the Box-Muller transform.
 * @param mean The mean of the distribution.
 * @param stdDev The standard deviation of the distribution.
 */
function randomNormal(mean = 0, stdDev = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1 || 1e-9)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdDev * randStdNormal;
}

/**
 * Simulates a full NONMEM output table for a 2-compartment PK model.
 * This function generates individual parameters, predictions, and residuals for 10 subjects.
 */
function generateNONMEMOutput(): DataRecord[] {
  // Population PK parameters (typical values for a 2-compartment model)
  const POP_PARAMS = {
    CL: 5,    // Clearance (L/hr)
    Ka: 1.5,  // Absorption rate constant (1/hr)
    Vc: 20,   // Central volume of distribution (L)
    Vp: 30,   // Peripheral volume of distribution (L)
    Q: 10,    // Inter-compartmental clearance (L/hr)
  };

  // Inter-individual variability (Omega - standard deviation of ETAs)
  const OMEGA = { CL: 0.3, Ka: 0.5, Vc: 0.2, Vp: 0.2 };

  const subjects: any[] = [];
  // 1. Generate individual parameters and demographics for 10 subjects
  for (let i = 1; i <= 10; i++) {
    const ETA_CL = randomNormal(0, OMEGA.CL);
    const ETA_Ka = randomNormal(0, OMEGA.Ka);
    const ETA_Vc = randomNormal(0, OMEGA.Vc);
    const ETA_Vp = randomNormal(0, OMEGA.Vp);
    
    subjects.push({
      ID: i,
      GROUP: i <= 3 ? 'A' : i <= 6 ? 'B' : 'C',
      DOSE: i <= 3 ? 100 : i <= 6 ? 200 : 400,
      AGE: Math.floor(randomNormal(45, 15)),
      WT: parseFloat(randomNormal(75, 12).toFixed(1)),
      SEX: Math.random() > 0.5 ? 'Female' : 'Male',
      CL: POP_PARAMS.CL * Math.exp(ETA_CL),
      Ka: POP_PARAMS.Ka * Math.exp(ETA_Ka),
      Vc: POP_PARAMS.Vc * Math.exp(ETA_Vc),
      Vp: POP_PARAMS.Vp * Math.exp(ETA_Vp),
      ETA_CL, ETA_Ka, ETA_Vc, ETA_Vp
    });
  }
  
  const timepoints = [0, 0.5, 1, 2, 4, 8, 12, 24];
  const allRecords: DataRecord[] = [];

  // 2-compartment model concentration function
  const concentration2Cpt = (t: number, dose: number, Ka: number, CL: number, Vc: number, Vp: number, Q: number): number => {
    if (t === 0) return 0;
    const k10 = CL / Vc;
    const k12 = Q / Vc;
    const k21 = Q / Vp;

    const alpha_beta_term = Math.sqrt(Math.pow(k10 + k12 + k21, 2) - 4 * k10 * k21);
    const alpha = 0.5 * ((k10 + k12 + k21) + alpha_beta_term);
    const beta = 0.5 * ((k10 + k12 + k21) - alpha_beta_term);

    const A = (Ka * (k21 - alpha)) / ((Ka - alpha) * (beta - alpha));
    const B = (Ka * (k21 - beta)) / ((Ka - beta) * (alpha - beta));

    const conc = (dose / Vc) * (A * Math.exp(-alpha * t) + B * Math.exp(-beta * t) - (A + B) * Math.exp(-Ka * t));
    return Math.max(0, conc);
  };

  // 2. Generate time-based records for each subject
  subjects.forEach(subject => {
    timepoints.forEach(time => {
      const PRED = concentration2Cpt(time, subject.DOSE, POP_PARAMS.Ka, POP_PARAMS.CL, POP_PARAMS.Vc, POP_PARAMS.Vp, POP_PARAMS.Q);
      const IPRED = concentration2Cpt(time, subject.DOSE, subject.Ka, subject.CL, subject.Vc, subject.Vp, POP_PARAMS.Q);
      
      // Simulate residual error (proportional + additive)
      const proportionalError = IPRED * 0.2 * randomNormal();
      const additiveError = 0.5 * randomNormal();
      const DV = Math.max(0, IPRED + proportionalError + additiveError);
      
      const RES = DV - IPRED;
      // Simplified CWRES calculation using a combined error model weight
      const WEIGHT = Math.sqrt(Math.pow(IPRED * 0.2, 2) + Math.pow(0.5, 2)) || 1;
      const CWRES = RES / WEIGHT;

      allRecords.push({
        ID: subject.ID,
        TIME: time,
        DV: parseFloat(DV.toFixed(3)),
        GROUP: subject.GROUP,
        DOSE: subject.DOSE,
        AGE: subject.AGE,
        WT: subject.WT,
        SEX: subject.SEX,
        PRED: parseFloat(PRED.toFixed(4)),
        IPRED: parseFloat(IPRED.toFixed(4)),
        RES: parseFloat(RES.toFixed(4)),
        CWRES: parseFloat(CWRES.toFixed(4)),
        CL: parseFloat(subject.CL.toFixed(3)),
        Ka: parseFloat(subject.Ka.toFixed(3)),
        Vc: parseFloat(subject.Vc.toFixed(3)),
        Vp: parseFloat(subject.Vp.toFixed(3)),
        ETA_CL: parseFloat(subject.ETA_CL.toFixed(3)),
        ETA_Ka: parseFloat(subject.ETA_Ka.toFixed(3)),
        ETA_Vc: parseFloat(subject.ETA_Vc.toFixed(3)),
        ETA_Vp: parseFloat(subject.ETA_Vp.toFixed(3)),
      });
    });
  });

  return allRecords;
}

export const SAMPLE_NONMEM_DATA: DataRecord[] = generateNONMEMOutput();

export const INITIAL_DATASETS: DatasetConfig[] = [
  {
    id: 'ds-001',
    name: 'nonmem_run_001.tab',
    description: 'Simulated NONMEM output with individual PK parameters, predictions, and residuals.',
    rowCount: SAMPLE_NONMEM_DATA.length,
    columns: [
      'ID', 'TIME', 'DV', 'PRED', 'IPRED', 'RES', 'CWRES',
      'GROUP', 'DOSE', 'AGE', 'WT', 'SEX', 
      'CL', 'Ka', 'Vc', 'Vp', 
      'ETA_CL', 'ETA_Ka', 'ETA_Vc', 'ETA_Vp'
    ],
    data: SAMPLE_NONMEM_DATA,
    createdAt: new Date().toISOString(),
    parentDatasetId: null
  }
];