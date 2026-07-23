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
 * Raw CSV Content representing a PK/PD NONMEM-style dataset.
 * 10 Participants, 3 Groups (A, B, C), 2-Compartment simplified kinetics.
 */
export const RAW_CSV_DATA = `ID,TIME,DV,GROUP,DOSE
1,0,0,A,100
1,0.5,8.42,A,100
1,1,12.15,A,100
1,2,14.28,A,100
1,4,11.34,A,100
1,8,6.12,A,100
1,12,3.45,A,100
1,24,0.82,A,100
2,0,0,A,100
2,0.5,7.91,A,100
2,1,11.82,A,100
2,2,13.95,A,100
2,4,10.88,A,100
2,8,5.94,A,100
2,12,3.12,A,100
2,24,0.75,A,100
3,0,0,A,100
3,0.5,9.12,A,100
3,1,12.85,A,100
3,2,15.12,A,100
3,4,11.95,A,100
3,8,6.45,A,100
3,12,3.68,A,100
3,24,0.91,A,100
4,0,0,B,200
4,0.5,15.42,B,200
4,1,22.15,B,200
4,2,26.48,B,200
4,4,21.34,B,200
4,8,12.12,B,200
4,12,6.85,B,200
4,24,1.82,B,200
5,0,0,B,200
5,0.5,14.91,B,200
5,1,21.82,B,200
5,2,25.95,B,200
5,4,20.88,B,200
5,8,11.94,B,200
5,12,6.52,B,200
5,24,1.75,B,200
6,0,0,B,200
6,0.5,16.12,B,200
6,1,23.85,B,200
6,2,28.12,B,200
6,4,22.95,B,200
6,8,13.45,B,200
6,12,7.68,B,200
6,24,2.01,B,200
7,0,0,C,400
7,0.5,28.42,C,400
7,1,41.15,C,400
7,2,48.28,C,400
7,4,39.34,C,400
7,8,22.12,C,400
7,12,12.45,C,400
7,24,3.42,C,400
8,0,0,C,400
8,0.5,30.91,C,400
8,1,44.82,C,400
8,2,52.95,C,400
8,4,43.88,C,400
8,8,24.94,C,400
8,12,14.12,C,400
8,24,3.95,C,400
9,0,0,C,400
9,0.5,27.12,C,400
9,1,39.85,C,400
9,2,46.12,C,400
9,4,37.95,C,400
9,8,21.45,C,400
9,12,11.68,C,400
9,24,3.01,C,400
10,0,0,C,400
10,0.5,29.42,C,400
10,1,42.15,C,400
10,2,49.28,C,400
10,4,40.34,C,400
10,8,23.12,C,400
10,12,13.45,C,400
10,24,3.72,C,400`;

/**
 * Utility to generate a normally distributed value using Box-Muller transform.
 */
function boxMuller(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1 || 1e-9)) * Math.cos(2.0 * Math.PI * u2);
  return Number((z0 * std + mean).toFixed(1));
}

export function parseCsv(csv: string): DataRecord[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const record: any = {};
    headers.forEach((header, index) => {
      const val = values[index];
      const isNumber = val !== '' && !isNaN(Number(val));
      record[header] = isNumber ? Number(val) : val;
    });
    return record as DataRecord;
  });
}

/**
 * Augments the basic dataset with AGE, WT, SEX, and SEXC columns.
 */
function augmentData(data: DataRecord[]): DataRecord[] {
  // Group by ID to ensure demographic variables are constant per participant
  const subjects: Record<number, Partial<DataRecord>> = {};
  const uniqueIds = Array.from(new Set(data.map(r => r.ID)));

  uniqueIds.forEach(id => {
    // Find first record of this subject to get their Group
    const firstRec = data.find(r => r.ID === id);
    const group = firstRec?.GROUP || 'A';
    
    // AGE: random between 18 and 65
    const age = Math.floor(Math.random() * (65 - 18 + 1)) + 18;
    
    // SEX: random Female or Male
    const sex: 'Female' | 'Male' = Math.random() > 0.5 ? 'Female' : 'Male';
    
    // SEXC: 1 for Female, 0 for Male
    const sexc = sex === 'Female' ? 1 : 0;
    
    // WT: Normal distribution based on Group (A: 60, B: 70, C: 80)
    let wtMean = 60;
    if (group === 'B') wtMean = 70;
    else if (group === 'C') wtMean = 80;
    // We assume a standard deviation of 15% of the mean for realistic biological variance
    const wt = boxMuller(wtMean, wtMean * 0.15);

    subjects[id] = {
      AGE: age,
      SEX: sex,
      SEXC: sexc,
      WT: wt
    };
  });

  return data.map(row => ({
    ...row,
    ...subjects[row.ID]
  }));
}

export const SAMPLE_NONMEM_DATA: DataRecord[] = augmentData(parseCsv(RAW_CSV_DATA));

export const INITIAL_DATASETS: DatasetConfig[] = [
  {
    id: 'ds-001',
    name: 'sample_study.csv',
    description: 'Pharmacometric dataset with concentration-time profiles and demographics',
    rowCount: SAMPLE_NONMEM_DATA.length,
    columns: ['ID', 'TIME', 'DV', 'GROUP', 'DOSE', 'AGE', 'WT', 'SEX', 'SEXC'],
    data: SAMPLE_NONMEM_DATA,
    createdAt: new Date().toISOString(),
    parentDatasetId: null
  }
];