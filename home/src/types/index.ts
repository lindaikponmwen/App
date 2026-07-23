export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  title?: string;
}

export interface SearchUser extends User {
  location?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerUserId: string;
  isOwner: boolean;
  memberCount: number;
  joinedDate: Date;
}

export interface TeamMember extends User {
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'on-leave';
  permissions: string[];
  joinedDate: Date;
  phoneNumber?: string;
  location?: string;
  skills: string[];
  currentProjects: string[];
  tasksCompleted: number;
  tasksInProgress: number;
  performanceScore: number;
  attendance: number;
  hoursThisWeek: number;
  reportsTo?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  assignedBy: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId?: string;
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  tags: string[];
  estimatedHours: number;
  actualHours?: number;
}

export interface TeamMessage {
  id: string;
  fromId: string;
  toId: string | 'all';
  subject: string;
  content: string;
  type: 'direct' | 'announcement';
  priority: 'normal' | 'important' | 'urgent';
  createdAt: Date;
  read: boolean;
  attachments?: string[];
}

export interface TimeEntry {
  id: string;
  memberId: string;
  date: Date;
  checkIn: string;
  checkOut?: string;
  hoursWorked: number;
  status: 'present' | 'late' | 'absent' | 'on-leave';
  notes?: string;
}

export interface PerformanceReview {
  id: string;
  memberId: string;
  reviewerId: string;
  period: string;
  score: number;
  strengths: string[];
  areasForImprovement: string[];
  goals: string[];
  comments: string;
  createdAt: Date;
}

export interface TeamDocument {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  uploadedAt: Date;
  size: string;
  sharedWith: string[];
  category: string;
  url?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  attendees: string[];
  type: 'meeting' | 'deadline' | 'event' | 'leave';
  location?: string;
  isRecurring: boolean;
}

export interface Project {
  id: string;
  uid?: string;
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
  type: 'status' | 'date';
  value: string;
}

export interface ExperimentItem {
  id: string;
  uid?: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  selectedMembers: string[];
  keywords: string[];
  analysisTypes: string[];
  startDate: Date;
  endDate?: Date;
  files: ExperimentFile[];
  fileCount?: number;
  createdBy?: string;
}