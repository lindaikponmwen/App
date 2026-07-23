export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  level:string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  members: User[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperimentFile {
  id: string;
  name: string;
  type: 'model' | 'data' | 'script';
  content: string;
  lastModified: Date;
}

export interface Filter {
  id: string;
  label: string;
  type: 'team' | 'status' | 'date';
  value: string;
}

export interface ExperimentItem {
  id:string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  team: string;
  selectedMembers: string[];
  keywords: string[];
  analysisTypes: string[];
  startDate: Date;
  endDate?: Date;
  files: ExperimentFile[];
}

export interface Step {
  label: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
}

export interface AiMessage {
  id: string;
  sender: 'user' | 'assistant';
  message: string;
  isStreaming?: boolean;
  timestamp: string;
  type?: 'text' | 'task_progress';
  progress?: Step[];
}

export interface AppFile {
  name: string;
  content: string;
}