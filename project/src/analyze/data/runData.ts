export interface RunParameter {
  [key: string]: number | string;
}


export interface RunParameterEstimate {
  name: string;
  value: number;
  rse?: number | null;
  se?: number | null;
  backTransformed?: string;
  bsv?: string;
  shrinkage?: string;
}

export interface Run {
  id: string;
  model: string;
  status: 'Running' | 'Completed' | 'Failed' | 'Queued' | 'Cancelled';
  timestamp: string;
  progress?: number;
  folderPath?: string;
  jobId?: string;
  backendRunId?: string;
  engine?: 'nonmem' | 'r' | 'phikl';
  workerId?: string;
  isRejected?: boolean;
  objectiveFunction?: number;
  conditionNumber?: number;
  aic?: number;
  bic?: number;
  nObs?: number;
  nInd?: number;
  convergence?: string;
  parameterEstimates?: {
    theta: RunParameterEstimate[];
    omega: RunParameterEstimate[];
    sigma: RunParameterEstimate[];
  };
  omegaMatrix?: number[][];
  omegaLabels?: string[];
  shrinkageSummary?: Record<string, any>;
  parameters?: Record<string, string | number>;
  message?: string;
}

export const mockRuns: Run[] = [
  {
    id: 'RUN001',
    model: 'Base Model - 1CMT',
    status: 'Completed',
    timestamp: '2024-05-20 10:30',
    engine: 'nonmem',
    objectiveFunction: 1245.62,
    conditionNumber: 15.4,
    convergence: 'Successful',
    parameterEstimates: {
      theta: [
        { name: 'tvCL', value: 5.2, rse: 0.125, se: 0.65, backTransformed: '5.2 (4.1-6.5)' },
        { name: 'tvV', value: 45.0, rse: 0.082, se: 3.69, backTransformed: '45.0 (38-52)' }
      ],
      omega: [
        { name: 'ETA1', value: 0.09, rse: 0.254, bsv: '30%', shrinkage: '15' },
        { name: 'ETA2', value: 0.04, rse: 0.301, bsv: '20%', shrinkage: '12' }
      ],
      sigma: [
        { name: 'add.err', value: 0.15, rse: 0.102 }
      ]
    },
    omegaMatrix: [
      [0.09, 0.001],
      [0.001, 0.04]
    ],
    omegaLabels: ['ETA1', 'ETA2'],
    shrinkageSummary: {
      'sd shrinkage (%)': { 'ETA1': 15.2, 'ETA2': 12.4 },
      'var shrinkage (%)': { 'ETA1': 28.1, 'ETA2': 23.5 }
    },
    parameters: {
      'Objective Function': 1245.62,
      'CL': 5.2,
      'V': 45.0
    }
  },
  {
    id: 'RUN002',
    model: '2CMT - Linear Elimination',
    status: 'Completed',
    timestamp: '2024-05-21 14:15',
    engine: 'nonmem',
    objectiveFunction: 1180.45,
    conditionNumber: 42.1,
    convergence: 'Successful',
    parameterEstimates: {
      theta: [
        { name: 'CL (L/h)', value: 4.8, rse: 10.2 },
        { name: 'V1 (L)', value: 38.5, rse: 7.5 },
        { name: 'Q (L/h)', value: 12.4, rse: 15.8 },
        { name: 'V2 (L)', value: 120.0, rse: 18.2 }
      ],
      omega: [
        { name: 'IIV_CL', value: 0.08, rse: 22.1 },
        { name: 'IIV_V1', value: 0.05, rse: 28.4 }
      ],
      sigma: [
        { name: 'PROP_ERR', value: 0.12, rse: 9.5 }
      ]
    },
    parameters: {
      'Objective Function': 1180.45,
      'CL': 4.8,
      'V1': 38.5,
      'Q': 12.4,
      'V2': 120.0
    }
  },
  {
    id: 'RUN003',
    model: '2CMT - WT on CL',
    status: 'Running',
    timestamp: '2024-05-22 09:00',
    engine: 'r',
    progress: 65
  },
  {
    id: 'RUN004',
    model: '3CMT - Complex',
    status: 'Failed',
    timestamp: '2024-05-22 11:30',
    engine: 'phikl',
    convergence: 'Terminated'
  }
];
