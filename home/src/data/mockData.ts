import { User, Project, ExperimentItem, ExperimentFile } from '../types';
import { getCurrentUser } from './authData';
import { projectStorage } from '../utils/projectStorage';

// PHP Backend Integration (commented out)
// implement php loading of projects directly from database using information from the php-setup/project1 and php-setup/database

// Mock data (for development without PHP backend)
// All available team members in the organization
export const allAvailableTeamMembers: User[] = [
  {
    id: '1',
    name: 'DrLevy Support',
    email: 'support@drlevy.ai',
    avatar: 'https://images.pexels.com/photos/3823488/pexels-photo-3823488.jpeg?auto=compress&cs=tinysrgb&w=400',
    initials: 'LS'
  }
];

// Get current user from auth system
export const getCurrentUserProfile = (): User => {
  const authUser = getCurrentUser();
  if (!authUser) {
    // Fallback to Sarah if no auth user (shouldn't happen with AuthGuard)
    return allAvailableTeamMembers[0];
  }
  
  // Find the user in our team members list
  const userProfile = allAvailableTeamMembers.find(u => u.id === authUser.id);
  if (userProfile) {
    return userProfile;
  }
  
  // If not found, create profile from auth data
  return {
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    initials: authUser.initials,
    avatar: authUser.avatar
  };
};

export const availableAnalysisTypes = [
  'Non-compartmental Analysis',
  'Population PK',
  'Bioequivalence',
  'Safety Analysis',
  'Covariate Analysis',
  'Dosing Simulation',
  'Model Validation',
  'Statistical Analysis',
  'Regulatory Submission',
  'PKPD Modeling',
  'Monte Carlo Simulation',
  'Bayesian Analysis',
  'Meta-Analysis',
  'Exposure-Response Analysis',
  'Drug-Drug Interaction',
  'Renal Impairment Study',
  'Hepatic Impairment Study',
  'Pediatric Modeling',
  'Geriatric Analysis',
  'Food Effect Study',
  'Biomarker Analysis',
  'Pharmacogenomics',
  'Allometric Scaling',
  'Model-Based Drug Development',
  'Clinical Trial Simulation'
];

// Sample project to initialize localStorage
// Mock implementation
const sampleProject: ExperimentItem = {
  id: '1634',
  title: 'Sample PK/PD Modeling Project',
  description: 'Comprehensive nonlinear mixed-effects modeling to characterize the pharmacokinetic and pharmacodynamic properties of monoclonal antibody TAK-6742 in patients with advanced solid tumors. This analysis evaluates exposure-response relationships, optimal dosing regimens, and predictive biomarkers for clinical efficacy.',
  status: 'active',
  selectedMembers: ['1'],
  keywords: ['monoclonal antibody', 'PK/PD modeling', 'exposure-response', 'solid tumors', 'TAK-6742', 'nonlinear mixed-effects', 'oncology'],
  analysisTypes: ['PKPD Modeling', 'Population PK', 'Exposure-Response Analysis', 'Covariate Analysis', 'Dosing Simulation'],
  startDate: new Date('2025-01-01'),
  files: [],
  createdBy: '1'
};

// Initialize sample projects in localStorage if empty
projectStorage.initializeSampleProjects([sampleProject]);

// Get experiments for current user
export const getExperimentsForUser = (): ExperimentItem[] => {
  // Mock implementation using localStorage (for development without PHP backend)
  const authUser = getCurrentUser();
  if (!authUser) return [];

  return projectStorage.getProjects();
};

// Legacy export for backward compatibility
export const experiments: ExperimentItem[] = [
  {
    id: '1',
    title: 'Phase I Drug Absorption Study',
    description: 'Comprehensive two-compartment pharmacokinetic model analysis investigating drug absorption kinetics in healthy volunteers. This study evaluates bioavailability, clearance, and volume of distribution parameters.',
    status: 'active',
    selectedMembers: ['1', '2', '3'],
    keywords: ['pharmacokinetics', 'bioavailability', 'two-compartment model', 'drug absorption', 'clearance', 'volume of distribution'],
    analysisTypes: ['Non-compartmental Analysis', 'Population PK', 'Bioequivalence', 'Safety Analysis'],
    startDate: new Date('2025-01-01'),
    files: [],
    createdBy: '1'
  },
  {
    id: '2',
    title: 'Bioequivalence Analysis',
    description: 'Statistical comparison of pharmacokinetic parameters between test and reference formulations to establish therapeutic equivalence. Includes crossover study design and regulatory compliance analysis.',
    status: 'completed',
    selectedMembers: ['1', '4', '5'],
    keywords: ['bioequivalence', 'crossover design', 'AUC', 'Cmax', 'regulatory compliance', 'generic drugs'],
    analysisTypes: ['Bioequivalence Analysis', 'Statistical Analysis', 'Regulatory Submission'],
    startDate: new Date('2024-12-15'),
    endDate: new Date('2025-01-10'),
    files: [],
    createdBy: '1'
  },
  {
    id: '3',
    title: 'Population PK Modeling',
    description: 'Advanced population pharmacokinetic modeling incorporating patient covariates such as age, weight, renal function, and genetic polymorphisms to optimize dosing strategies.',
    status: 'paused',
    selectedMembers: ['1', '6'],
    keywords: ['population PK', 'covariates', 'NONMEM', 'dosing optimization', 'genetic polymorphisms', 'renal function'],
    analysisTypes: ['Population PK', 'Covariate Analysis', 'Dosing Simulation', 'Model Validation'],
    startDate: new Date('2024-12-20'),
    files: [],
    createdBy: '1'
  }
];


// Get team members for current user (role-based)
export const getTeamMembersForUser = (): User[] => {
    // Mock implementation (remove when using PHP backend)
  const authUser = getCurrentUser();
  if (!authUser) return [];

  switch (authUser.id) {
    case '1': // Sarah (Owner) - has Curtis in her core team
      return [
        allAvailableTeamMembers[2], // Curtis Lee
        allAvailableTeamMembers[3], // Dr. Amanda Foster
        allAvailableTeamMembers[4], // Dr. Robert Kim
      ];
    case '2': // William (Administrator) - has access to broader team
      return [
        allAvailableTeamMembers[0], // Sarah Chen
        allAvailableTeamMembers[2], // Curtis Lee
        allAvailableTeamMembers[5], // Dr. Lisa Thompson
        allAvailableTeamMembers[6], // Dr. David Martinez
      ];
    case '3': // Curtis (Member) - limited team view
      return [
        allAvailableTeamMembers[0], // Sarah Chen (his team lead)
        allAvailableTeamMembers[3], // Dr. Amanda Foster
      ];
    default:
      return [];
  }
};

// Legacy exports for backward compatibility
export const teamMembers: User[] = [
  allAvailableTeamMembers[1], // Dr. Michael Rodriguez
  allAvailableTeamMembers[2], // Dr. Emily Watson
  allAvailableTeamMembers[3]  // Dr. James Liu
];

export const currentUser: User = {
  ...allAvailableTeamMembers[0]
};

export const currentProject: Project = {
  id: '1',
  name: 'Pharmacokinetic Research Platform',
  description: 'Advanced platform for pharmacokinetic modeling and analysis',
  members: [allAvailableTeamMembers[0], ...teamMembers],
  createdAt: new Date('2024-11-01'),
  updatedAt: new Date('2025-01-15')
};