import { ExperimentItem } from '../types';
import { currentUser, teamMembers } from './appConfig';

export const experiments: ExperimentItem[] = [
  {
    id: '1',
    title: 'Phase I Drug Absorption Study',
    description: 'Comprehensive two-compartment pharmacokinetic model analysis investigating drug absorption kinetics in healthy volunteers. This study evaluates bioavailability, clearance, and volume of distribution parameters.',
    status: 'active',
    team: 'Growth Team',
    selectedMembers: [currentUser.id, teamMembers[0].id, teamMembers[1].id],
    keywords: ['pharmacokinetics', 'bioavailability', 'two-compartment model', 'drug absorption', 'clearance', 'volume of distribution'],
    analysisTypes: ['Non-compartmental Analysis', 'Population PK', 'Bioequivalence', 'Safety Analysis'],
    startDate: new Date('2025-01-01'),
    files: []
  },
  {
    id: '2',
    title: 'Bioequivalence Analysis',
    description: 'Statistical comparison of pharmacokinetic parameters between test and reference formulations to establish therapeutic equivalence. Includes crossover study design and regulatory compliance analysis.',
    status: 'completed',
    team: 'Clinical Team',
    selectedMembers: [teamMembers[1].id, teamMembers[2].id, teamMembers[0].id],
    keywords: ['bioequivalence', 'crossover design', 'AUC', 'Cmax', 'regulatory compliance', 'generic drugs'],
    analysisTypes: ['Bioequivalence Analysis', 'Statistical Analysis', 'Regulatory Submission'],
    startDate: new Date('2024-12-15'),
    endDate: new Date('2025-01-10'),
    files: []
  },
  {
    id: '3',
    title: 'Population PK Modeling',
    description: 'Advanced population pharmacokinetic modeling incorporating patient covariates such as age, weight, renal function, and genetic polymorphisms to optimize dosing strategies.',
    status: 'paused',
    team: 'Analytics Team',
    selectedMembers: [currentUser.id, teamMembers[2].id],
    keywords: ['population PK', 'covariates', 'NONMEM', 'dosing optimization', 'genetic polymorphisms', 'renal function'],
    analysisTypes: ['Population PK', 'Covariate Analysis', 'Dosing Simulation', 'Model Validation'],
    startDate: new Date('2024-12-20'),
    files: []
  }
];
