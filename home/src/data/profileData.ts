// Mock data (for development without PHP backend)

export interface JobInformation {
  department: string;
  division: string;
  manager: string;
  hireDate: string;
  location: string;
}

export interface RecentActivity {
  id: number;
  user: {
    name: string;
    initials: string;
    avatar?: string;
  };
  action: string;
  date: string;
  time: string;
}

export interface CompensationData {
  amount: string;
  effectiveDate: string;
}

export interface Message {
  id: number;
  sender: {
    name: string;
    initials: string;
    id: string;
  };
  content: string;
  timestamp: Date;
  isRead: boolean;
  recipientId?: string;
}

export interface Approval {
  id: number;
  document: string;
  project: string;
  status: 'approved' | 'rejected' | 'pending';
  approver: string;
  date: Date;
  comments: string;
}

export interface PersonalFile {
  id: number;
  name: string;
  type: string;
  size: string;
  modified: Date;
  category: string;
}

export interface UserProfile {
  personalInfo: {
    phone: string;
    dateOfBirth: string;
    nationalId: string;
    title: string;
    hireDate: string;
    address: string;
    cityState: string;
    postcode: string;
  };
  professionalInfo: {
    role: string;
    department: string;
    memberSince: string;
  };
}

// Job Information Data
export const jobInformation: JobInformation[] = [
  { department: 'Clinical Pharmacology', division: 'Research & Development', manager: 'Dr. Alex Foster', hireDate: 'May 13, 2024', location: 'San Francisco, CA' },
  { department: 'Biostatistics', division: 'Data Science', manager: 'Dr. Jack Daniels', hireDate: 'Sep 05, 2024', location: 'Boston, MA' },
  { department: 'Regulatory Affairs', division: 'Compliance', manager: 'Dr. Alina Staska', hireDate: 'Jun 08, 2023', location: 'Washington, DC' },
  { department: 'Clinical Operations', division: 'Project Management', manager: 'Dr. John Miller', hireDate: 'Sep 13, 2022', location: 'Chicago, IL' },
  { department: 'Pharmacovigilance', division: 'Safety', manager: 'Dr. Mark Baldwin', hireDate: 'Jul 07, 2023', location: 'Miami, FL' }
];

// Recent Activity Data
export const recentActivity: RecentActivity[] = [
  { 
    id: 1, 
    user: { name: 'John Miller', initials: 'JM', avatar: null },
    action: 'last login on',
    date: 'Jul 13, 2024',
    time: '05:36 PM'
  },
  { 
    id: 2, 
    user: { name: 'Merva Sahin', initials: 'MS', avatar: null },
    action: 'date created on',
    date: 'Sep 08, 2024',
    time: '03:12 PM'
  },
  { 
    id: 3, 
    user: { name: 'Tammy Collier', initials: 'TC', avatar: null },
    action: 'updated on',
    date: 'Aug 15, 2023',
    time: '05:36 PM'
  }
];

// Compensation Data
export const compensationData: CompensationData[] = [
  { amount: '862.00 USD per month', effectiveDate: 'May 10, 2015' },
  { amount: '1560.00 USD per quarter', effectiveDate: 'Jun 08, 2022' },
  { amount: '378.00 USD per week', effectiveDate: 'Jun 08, 2022' }
];

// Messages Data - Expanded conversation between Sarah (1) and Emily (3)
export const initialMessages: Message[] = [
  {
    id: 1,
    sender: { name: 'Dr. Michael Rodriguez', initials: 'MR', id: '2' },
    content: 'Hi Sarah, could you review the latest PK analysis results? I\'ve uploaded the files to the project folder.',
    timestamp: new Date('2025-01-15T10:30:00'),
    isRead: false,
    recipientId: '1'
  },
  {
    id: 2,
    sender: { name: 'Dr. Emily Watson', initials: 'EW', id: '3' },
    content: 'The bioequivalence study data looks good. Ready for the next phase when you are.',
    timestamp: new Date('2025-01-15T09:15:00'),
    isRead: true,
    recipientId: '1'
  },
  {
    id: 3,
    sender: { name: 'Dr. James Liu', initials: 'JL', id: '4' },
    content: 'Meeting scheduled for tomorrow at 2 PM to discuss the population PK modeling approach.',
    timestamp: new Date('2025-01-14T16:45:00'),
    isRead: true,
    recipientId: '1'
  },
  {
    id: 4,
    sender: { name: 'Dr. Selina Anosike', initials: 'SA', id: '1' },
    content: 'Emily, I\'ve reviewed the VPC plots for the TAK-6742 model. The 95% confidence intervals are slightly over-predicting Cmax at the highest dose level in the pediatric cohort.',
    timestamp: new Date('2025-01-15T11:00:00'),
    isRead: true,
    recipientId: '3'
  },
  {
    id: 5,
    sender: { name: 'Dr. Emily Watson', initials: 'EW', id: '3' },
    content: 'I see what you mean. That might be due to the non-linear clearance saturating earlier than we anticipated in the Michaelis-Menten estimation. Should we adjust the Km parameter or look into body-weight normalization?',
    timestamp: new Date('2025-01-15T11:20:00'),
    isRead: false,
    recipientId: '1'
  },
  {
    id: 6,
    sender: { name: 'Dr. Selina Anosike', initials: 'SA', id: '1' },
    content: 'Let\'s try a sensitivity analysis on Km first. I suspect the inter-individual variability on clearance is masking the saturation effect in the older subjects. Also, please check if the proportional error model still holds up with the new outliers from the phase 1b site.',
    timestamp: new Date('2025-01-15T11:45:00'),
    isRead: true,
    recipientId: '3'
  }
];

// User Profile Data
export const mockUserProfile: UserProfile = {
  personalInfo: {
    phone: '(629) 555-0123',
    dateOfBirth: '1988-09-26',
    nationalId: 'GER10654',
    title: 'Senior Project Scientist',
    hireDate: '2023-01-05',
    address: '990 Market Street, Suite 200',
    cityState: 'San Francisco CA',
    postcode: '94102'
  },
  professionalInfo: {
    role: 'Principal Investigator',
    department: 'Clinical Pharmacology',
    memberSince: 'Jan 2024'
  }
};

// Tab Configuration - Added My teams
export const profileTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'my-teams', label: 'My teams' },
  { id: 'inbox', label: 'Inbox' }
];