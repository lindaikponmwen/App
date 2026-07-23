// PHP Backend Integration (commented out)
// import { settingsService } from '../services/settingsService';

// Mock data (for development without PHP backend)

export interface SettingSection {
  id: string;
  title: string;
  icon: any;
  content: any;
}

export interface ProjectInfo {
  name: string;
  description: string;
  createdDate: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    initials: string;
  }>;
  tags: string[];
  templates: number;
}

export interface AccountInfo {
  name: string;
  email: string;
  initials: string;
}

// Project Information
export const projectInfo: ProjectInfo = {
  name: 'Pharmacokinetic Research Platform',
  description: 'Advanced platform for pharmacokinetic modeling and analysis',
  createdDate: 'November 1, 2024',
  members: [
    { id: '1', name: 'Dr. Sarah Chen', email: 'sarah.chen@research.com', initials: 'SC' },
    { id: '2', name: 'Dr. Michael Rodriguez', email: 'michael.r@research.com', initials: 'MR' },
    { id: '3', name: 'Dr. Emily Watson', email: 'emily.watson@research.com', initials: 'EW' },
    { id: '4', name: 'Dr. James Liu', email: 'james.liu@research.com', initials: 'JL' }
  ],
  tags: ['Pharmacokinetics', 'Clinical Trial', 'Bioequivalence'],
  templates: 3
};

// Account Information
export const accountInfo: AccountInfo = {
  name: 'Dr. Sarah Chen',
  email: 'sarah.chen@research.com',
  initials: 'SC'
};

// Settings Navigation Items
export const settingsNavItems = [
  { id: 'account', label: 'My Account' },
  { id: 'project', label: 'Project' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'billing', label: 'Usage & Billing' }
];