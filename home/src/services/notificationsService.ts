import { authService } from './authService';
import type { Notification } from '../data/notificationsData';

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || '/auth';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class NotificationsService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}/${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const csrfToken = authService.getCsrfToken();
    if (csrfToken && options.method !== 'GET') {
      headers['X-CSRF-Token'] = csrfToken;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Notifications API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async getNotifications(): Promise<Notification[]> {
    const response = await this.request<{ notifications: Notification[] }>(
      'notifications/list.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return response.data.notifications;
    }

    console.error('Failed to fetch notifications:', response.error);
    return [];
  }

  async getUnreadCount(): Promise<number> {
    const response = await this.request<{ count: number }>(
      'notifications/unread-count.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return response.data.count;
    }

    console.error('Failed to fetch unread count:', response.error);
    return 0;
  }

  async markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('notifications/mark-read.php', {
      method: 'POST',
      body: JSON.stringify({ notificationId }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to mark notification as read',
    };
  }

  async markAllAsRead(): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('notifications/mark-all-read.php', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to mark all notifications as read',
    };
  }

  async createNotification(notificationData: {
    type: Notification['type'];
    title: string;
    description: string;
    priority: Notification['priority'];
    recipientId?: string;
    actionUrl?: string;
    metadata?: Notification['metadata'];
  }): Promise<{
    success: boolean;
    notification?: Notification;
    error?: string;
  }> {
    const response = await this.request<{ notification: Notification }>(
      'notifications/create.php',
      {
        method: 'POST',
        body: JSON.stringify(notificationData),
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        notification: response.data.notification,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to create notification',
    };
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('notifications/delete.php', {
      method: 'DELETE',
      body: JSON.stringify({ notificationId }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to delete notification',
    };
  }

  async getNotificationsByPriority(): Promise<Notification[]> {
    const response = await this.request<{ notifications: Notification[] }>(
      'notifications/by-priority.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return response.data.notifications;
    }

    console.error('Failed to fetch notifications by priority:', response.error);
    return [];
  }

  async updateNotificationSettings(settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    notificationTypes?: string[];
  }): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('notifications/update-settings.php', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update notification settings',
    };
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
