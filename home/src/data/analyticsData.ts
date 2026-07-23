// PHP Backend Integration (commented out)
// import { analyticsService } from '../services/analyticsService';

// Mock data (for development without PHP backend)

export interface AnalyticsMetrics {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  avgSessionDuration: string;
  storageUsed: string;
  storageLimit: string;
  activeProjects: number;
  totalProjects: number;
  teamMembers: number;
}

export interface VisitData {
  date: string;
  visits: number;
  visitors: number;
  pageViews: number;
}

export interface PageUsageData {
  page: string;
  visits: number;
  percentage: number;
  trend: string;
}

export interface ProjectUsageData {
  project: string;
  users: string[];
  lastAccessed: string;
  totalHours: number;
  status: 'active' | 'completed' | 'paused';
}

export interface TeamActivityData {
  memberId: string;
  projectsActive: number;
  hoursThisWeek: number;
  lastActive: string;
  efficiency: number;
}

export interface StorageBreakdown {
  category: string;
  size: string;
  percentage: number;
  color: string;
}

export interface TimeRange {
  value: string;
  label: string;
}

// Analytics metrics
export const analyticsMetrics: AnalyticsMetrics = {
  totalVisits: 12847,
  uniqueVisitors: 3421,
  pageViews: 28934,
  avgSessionDuration: '4m 32s',
  storageUsed: '2.4 GB',
  storageLimit: '10 GB',
  activeProjects: 2,
  totalProjects: 3,
  teamMembers: 4
};

// Visit data for the last 7 days
export const visitData: VisitData[] = [
  { date: '2025-01-09', visits: 1240, visitors: 890, pageViews: 2340 },
  { date: '2025-01-10', visits: 1580, visitors: 1120, pageViews: 2890 },
  { date: '2025-01-11', visits: 1320, visitors: 980, pageViews: 2560 },
  { date: '2025-01-12', visits: 1890, visitors: 1340, pageViews: 3120 },
  { date: '2025-01-13', visits: 2100, visitors: 1450, pageViews: 3450 },
  { date: '2025-01-14', visits: 1750, visitors: 1200, pageViews: 2980 },
  { date: '2025-01-15', visits: 1967, visitors: 1431, pageViews: 3184 }
];

// Page usage analytics
export const pageUsageData: PageUsageData[] = [
  { page: 'Projects', visits: 4521, percentage: 35.2, trend: '+12%' },
  { page: 'Profile', visits: 3240, percentage: 25.2, trend: '+8%' },
  { page: 'Team Members', visits: 2180, percentage: 17.0, trend: '+15%' },
  { page: 'Find Publication', visits: 1890, percentage: 14.7, trend: '+22%' },
  { page: 'Analytics', visits: 1016, percentage: 7.9, trend: '+5%' }
];

// Project usage data
export const projectUsageData: ProjectUsageData[] = [
  { 
    project: 'Phase I Drug Absorption Study', 
    users: ['1', '2', '3'], 
    lastAccessed: '2 hours ago', 
    totalHours: 45.2, 
    status: 'active' 
  },
  { 
    project: 'Bioequivalence Analysis', 
    users: ['3', '4'], 
    lastAccessed: '1 day ago', 
    totalHours: 32.8, 
    status: 'completed' 
  },
  { 
    project: 'Population PK Modeling', 
    users: ['1', '4'], 
    lastAccessed: '3 days ago', 
    totalHours: 28.5, 
    status: 'paused' 
  }
];

// Team activity data
export const teamActivityData: TeamActivityData[] = [
  { memberId: '1', projectsActive: 2, hoursThisWeek: 28.5, lastActive: '2 hours ago', efficiency: 94 },
  { memberId: '2', projectsActive: 1, hoursThisWeek: 32.2, lastActive: '4 hours ago', efficiency: 87 },
  { memberId: '3', projectsActive: 2, hoursThisWeek: 29.8, lastActive: '1 day ago', efficiency: 91 },
  { memberId: '4', projectsActive: 1, hoursThisWeek: 25.1, lastActive: '6 hours ago', efficiency: 89 }
];

// Storage breakdown
export const storageBreakdown: StorageBreakdown[] = [
  { category: 'Project Files', size: '1.2 GB', percentage: 50, color: 'bg-blue-500' },
  { category: 'Data Sets', size: '680 MB', percentage: 28, color: 'bg-emerald-500' },
  { category: 'Documents', size: '320 MB', percentage: 13, color: 'bg-purple-500' },
  { category: 'Images', size: '200 MB', percentage: 9, color: 'bg-orange-500' }
];

// Time range options
export const timeRanges: TimeRange[] = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' }
];

// Growth trends data
export const growthTrends = {
  visits: '+12.5%',
  visitors: '+8.3%',
  sessionDuration: '+15.2%',
  storageUsage: '24% used'
};

// Real-time metrics (could be updated via API)
export const realtimeMetrics = {
  activeUsers: 23,
  onlineTeamMembers: 3,
  currentSessions: 15,
  serverLoad: 67
};

// Performance metrics
export const performanceMetrics = {
  pageLoadTime: '1.2s',
  serverResponseTime: '245ms',
  uptime: '99.9%',
  errorRate: '0.1%'
};