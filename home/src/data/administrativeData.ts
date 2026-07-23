// PHP Backend Integration (commented out)
// import { administrativeService } from '../services/administrativeService';

// Mock data (for development without PHP backend)

export interface ComplianceItem {
  id: number;
  title: string;
  status: 'compliant' | 'pending' | 'overdue';
  dueDate: Date;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AuditLog {
  id: number;
  action: string;
  user: {
    name: string;
    initials: string;
    id: string;
  };
  timestamp: Date;
  details: string;
  category: 'security' | 'data' | 'access' | 'system';
}

export interface SystemMetric {
  id: string;
  name: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  description: string;
  lastUpdated: Date;
}

export interface PolicyDocument {
  id: number;
  title: string;
  version: string;
  lastUpdated: Date;
  category: string;
  status: 'active' | 'draft' | 'archived';
  description: string;
}

export interface UserPermission {
  userId: string;
  userName: string;
  userInitials: string;
  role: string;
  permissions: string[];
  lastAccess: Date;
  status: 'active' | 'inactive' | 'suspended';
}

export interface BackupStatus {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'running' | 'failed';
  timestamp: Date;
  size: string;
  location: string;
}

// Compliance Items
export const complianceItems: ComplianceItem[] = [
  {
    id: 1,
    title: 'HIPAA Security Risk Assessment',
    status: 'compliant',
    dueDate: new Date('2025-03-15'),
    description: 'Annual security risk assessment for HIPAA compliance',
    category: 'Security',
    priority: 'high'
  },
  {
    id: 2,
    title: 'Data Retention Policy Review',
    status: 'pending',
    dueDate: new Date('2025-02-01'),
    description: 'Review and update data retention policies',
    category: 'Data Management',
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Staff Security Training',
    status: 'overdue',
    dueDate: new Date('2025-01-10'),
    description: 'Mandatory security awareness training for all staff',
    category: 'Training',
    priority: 'high'
  },
  {
    id: 4,
    title: 'Backup System Verification',
    status: 'compliant',
    dueDate: new Date('2025-04-01'),
    description: 'Quarterly backup system integrity check',
    category: 'System',
    priority: 'medium'
  },
  {
    id: 5,
    title: 'Access Control Audit',
    status: 'pending',
    dueDate: new Date('2025-02-15'),
    description: 'Review user access permissions and roles',
    category: 'Access Control',
    priority: 'high'
  }
];

// Audit Logs
export const auditLogs: AuditLog[] = [
  {
    id: 1,
    action: 'User login',
    user: { name: 'Dr. Sarah Chen', initials: 'SC', id: '1' },
    timestamp: new Date('2025-01-15T09:30:00'),
    details: 'Successful login from IP 192.168.1.100',
    category: 'security'
  },
  {
    id: 2,
    action: 'Data export',
    user: { name: 'Dr. Michael Rodriguez', initials: 'MR', id: '2' },
    timestamp: new Date('2025-01-15T08:45:00'),
    details: 'Exported patient data for Study PK-2025-001',
    category: 'data'
  },
  {
    id: 3,
    action: 'Permission change',
    user: { name: 'System Admin', initials: 'SA', id: 'admin' },
    timestamp: new Date('2025-01-14T16:20:00'),
    details: 'Updated access permissions for Dr. Emily Watson',
    category: 'access'
  },
  {
    id: 4,
    action: 'System backup',
    user: { name: 'System', initials: 'SY', id: 'system' },
    timestamp: new Date('2025-01-14T02:00:00'),
    details: 'Automated daily backup completed successfully',
    category: 'system'
  },
  {
    id: 5,
    action: 'Failed login attempt',
    user: { name: 'Unknown', initials: 'UN', id: 'unknown' },
    timestamp: new Date('2025-01-13T14:30:00'),
    details: 'Multiple failed login attempts from IP 203.0.113.45',
    category: 'security'
  },
  {
    id: 6,
    action: 'Data modification',
    user: { name: 'Dr. James Liu', initials: 'JL', id: '4' },
    timestamp: new Date('2025-01-13T11:15:00'),
    details: 'Updated project metadata for Bioequivalence Analysis',
    category: 'data'
  }
];

// System Metrics
export const systemMetrics: SystemMetric[] = [
  {
    id: 'uptime',
    name: 'System Uptime',
    value: '99.9%',
    status: 'good',
    description: 'System availability over the last 30 days',
    lastUpdated: new Date('2025-01-15T10:00:00')
  },
  {
    id: 'storage',
    name: 'Storage Usage',
    value: '67%',
    status: 'warning',
    description: 'Total storage utilization across all systems',
    lastUpdated: new Date('2025-01-15T10:00:00')
  },
  {
    id: 'security',
    name: 'Security Score',
    value: '94/100',
    status: 'good',
    description: 'Overall security posture assessment',
    lastUpdated: new Date('2025-01-15T09:45:00')
  },
  {
    id: 'performance',
    name: 'System Performance',
    value: '85%',
    status: 'good',
    description: 'Average system response time and throughput',
    lastUpdated: new Date('2025-01-15T10:00:00')
  },
  {
    id: 'compliance',
    name: 'Compliance Status',
    value: '78%',
    status: 'warning',
    description: 'Percentage of compliance requirements met',
    lastUpdated: new Date('2025-01-15T08:30:00')
  },
  {
    id: 'backups',
    name: 'Backup Health',
    value: '100%',
    status: 'good',
    description: 'Success rate of automated backups',
    lastUpdated: new Date('2025-01-15T02:00:00')
  }
];

// Policy Documents
export const policyDocuments: PolicyDocument[] = [
  {
    id: 1,
    title: 'Data Privacy and Protection Policy',
    version: '2.1',
    lastUpdated: new Date('2024-12-01'),
    category: 'Privacy',
    status: 'active',
    description: 'Comprehensive policy covering data privacy, HIPAA compliance, and patient data protection'
  },
  {
    id: 2,
    title: 'Information Security Policy',
    version: '3.0',
    lastUpdated: new Date('2024-11-15'),
    category: 'Security',
    status: 'active',
    description: 'Security protocols, access controls, and incident response procedures'
  },
  {
    id: 3,
    title: 'Research Data Management Policy',
    version: '1.5',
    lastUpdated: new Date('2024-10-20'),
    category: 'Research',
    status: 'active',
    description: 'Guidelines for research data collection, storage, and sharing'
  },
  {
    id: 4,
    title: 'User Access Control Policy',
    version: '2.0',
    lastUpdated: new Date('2024-09-30'),
    category: 'Access Control',
    status: 'active',
    description: 'User authentication, authorization, and access management procedures'
  },
  {
    id: 5,
    title: 'Incident Response Plan',
    version: '1.8',
    lastUpdated: new Date('2024-08-15'),
    category: 'Security',
    status: 'draft',
    description: 'Procedures for handling security incidents and data breaches'
  }
];

// User Permissions
export const userPermissions: UserPermission[] = [
  {
    userId: '1',
    userName: 'Dr. Sarah Chen',
    userInitials: 'SC',
    role: 'Principal Investigator',
    permissions: ['read', 'write', 'delete', 'admin', 'export'],
    lastAccess: new Date('2025-01-15T09:30:00'),
    status: 'active'
  },
  {
    userId: '2',
    userName: 'Dr. Michael Rodriguez',
    userInitials: 'MR',
    role: 'Senior Researcher',
    permissions: ['read', 'write', 'export'],
    lastAccess: new Date('2025-01-15T08:45:00'),
    status: 'active'
  },
  {
    userId: '3',
    userName: 'Dr. Emily Watson',
    userInitials: 'EW',
    role: 'Research Scientist',
    permissions: ['read', 'write'],
    lastAccess: new Date('2025-01-14T16:20:00'),
    status: 'active'
  },
  {
    userId: '4',
    userName: 'Dr. James Liu',
    userInitials: 'JL',
    role: 'Research Scientist',
    permissions: ['read', 'write'],
    lastAccess: new Date('2025-01-13T11:15:00'),
    status: 'active'
  },
  {
    userId: '5',
    userName: 'Dr. Amanda Foster',
    userInitials: 'AF',
    role: 'Research Associate',
    permissions: ['read'],
    lastAccess: new Date('2025-01-12T14:30:00'),
    status: 'inactive'
  }
];

// Backup Status
export const backupStatus: BackupStatus[] = [
  {
    id: 'backup-001',
    type: 'full',
    status: 'completed',
    timestamp: new Date('2025-01-15T02:00:00'),
    size: '2.4 GB',
    location: 'AWS S3 - Primary'
  },
  {
    id: 'backup-002',
    type: 'incremental',
    status: 'completed',
    timestamp: new Date('2025-01-14T02:00:00'),
    size: '156 MB',
    location: 'AWS S3 - Primary'
  },
  {
    id: 'backup-003',
    type: 'incremental',
    status: 'completed',
    timestamp: new Date('2025-01-13T02:00:00'),
    size: '203 MB',
    location: 'AWS S3 - Primary'
  },
  {
    id: 'backup-004',
    type: 'full',
    status: 'failed',
    timestamp: new Date('2025-01-12T02:00:00'),
    size: '0 MB',
    location: 'AWS S3 - Secondary'
  },
  {
    id: 'backup-005',
    type: 'incremental',
    status: 'completed',
    timestamp: new Date('2025-01-11T02:00:00'),
    size: '89 MB',
    location: 'AWS S3 - Primary'
  }
];

// Administrative tabs configuration
export const administrativeTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'audit', label: 'Audit Logs' },
  { id: 'users', label: 'User Management' },
  { id: 'policies', label: 'Policies' },
  { id: 'backups', label: 'Backups' }
];

// Summary statistics
export const administrativeStats = {
  totalUsers: userPermissions.length,
  activeUsers: userPermissions.filter(u => u.status === 'active').length,
  complianceScore: Math.round((complianceItems.filter(c => c.status === 'compliant').length / complianceItems.length) * 100),
  overdueItems: complianceItems.filter(c => c.status === 'overdue').length,
  recentAudits: auditLogs.length,
  systemHealth: 'Good',
  lastBackup: backupStatus.find(b => b.status === 'completed')?.timestamp || new Date(),
  storageUsed: '2.4 GB',
  uptime: '99.9%'
};