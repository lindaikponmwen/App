// PHP Backend Integration (commented out)
// import { notificationsService } from '../services/notificationsService';

// Mock data (for development without PHP backend)

export interface Notification {
  id: string;
  type: 'team_member' | 'project' | 'approval' | 'message' | 'system' | 'deadline';
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: {
    projectId?: string;
    userId?: string;
    documentId?: string;
    messageId?: string;
  };
}

export const notifications: Notification[] = [
  {
    id: '1',
    type: 'approval',
    title: 'Document Approval Required',
    description: 'Phase I Study Protocol v2.1 requires your approval for the Drug Absorption Study project.',
    timestamp: new Date('2025-01-15T14:30:00'),
    isRead: false,
    priority: 'urgent',
    actionUrl: '/profile?tab=approvals',
    metadata: {
      projectId: '1',
      documentId: 'doc-001'
    }
  },
  {
    id: '2',
    type: 'team_member',
    title: 'New Team Member Added',
    description: 'Dr. Amanda Foster has been added to your core research team.',
    timestamp: new Date('2025-01-15T11:20:00'),
    isRead: false,
    priority: 'medium',
    actionUrl: '/team-members',
    metadata: {
      userId: '5'
    }
  },
  {
    id: '3',
    type: 'message',
    title: 'New Message from Dr. Michael Rodriguez',
    description: 'Hi Sarah, could you review the latest PK analysis results? I\'ve uploaded the files...',
    timestamp: new Date('2025-01-15T10:30:00'),
    isRead: false,
    priority: 'medium',
    actionUrl: '/profile?tab=inbox',
    metadata: {
      userId: '2',
      messageId: 'msg-001'
    }
  },
  {
    id: '4',
    type: 'project',
    title: 'New Project Created',
    description: 'Population PK Modeling project has been created and assigned to your team.',
    timestamp: new Date('2025-01-15T09:15:00'),
    isRead: false,
    priority: 'low',
    actionUrl: '/projects',
    metadata: {
      projectId: '3'
    }
  },
  {
    id: '5',
    type: 'deadline',
    title: 'Project Deadline Approaching',
    description: 'Bioequivalence Analysis project deadline is in 3 days. Please review progress.',
    timestamp: new Date('2025-01-14T16:45:00'),
    isRead: false,
    priority: 'high',
    actionUrl: '/',
    metadata: {
      projectId: '2'
    }
  },
  {
    id: '6',
    type: 'system',
    title: 'System Maintenance Scheduled',
    description: 'Scheduled maintenance will occur on January 20th from 2:00 AM to 4:00 AM EST.',
    timestamp: new Date('2025-01-14T14:20:00'),
    isRead: false,
    priority: 'low'
  },
  {
    id: '7',
    type: 'approval',
    title: 'Document Approved',
    description: 'Your Safety Analysis Summary for Drug Absorption Study has been approved.',
    timestamp: new Date('2025-01-14T12:15:00'),
    isRead: true,
    priority: 'medium',
    metadata: {
      projectId: '1',
      documentId: 'doc-002'
    }
  },
  {
    id: '8',
    type: 'team_member',
    title: 'Team Member Status Update',
    description: 'Dr. James Liu has updated their availability status for the Population PK project.',
    timestamp: new Date('2025-01-13T15:30:00'),
    isRead: true,
    priority: 'low',
    actionUrl: '/team-members',
    metadata: {
      userId: '4'
    }
  }
];

export const getUnreadNotificationsCount = (): number => {
  // PHP Backend Integration (commented out)
  // Uncomment below to use PHP backend
  // return notificationsService.getUnreadCount();

  // Mock implementation (remove when using PHP backend)
  return notifications.filter(notification => !notification.isRead).length;
};

export const markAllNotificationsAsRead = (): void => {
  // PHP Backend Integration (commented out)
  // Uncomment below to use PHP backend
  // notificationsService.markAllAsRead();
  // return;

  // Mock implementation (remove when using PHP backend)
  notifications.forEach(notification => {
    notification.isRead = true;
  });
};

export const markNotificationAsRead = (notificationId: string): void => {
  // PHP Backend Integration (commented out)
  // Uncomment below to use PHP backend
  // notificationsService.markAsRead(notificationId);
  // return;

  // Mock implementation (remove when using PHP backend)
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.isRead = true;
  }
};

export const getNotificationsByPriority = () => {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  return notifications.sort((a, b) => {
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1; // Unread first
    }
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};