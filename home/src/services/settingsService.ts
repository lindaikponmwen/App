import { authService } from './authService';
import type { ProjectInfo, AccountInfo } from '../data/settingsData';

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || '/auth';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class SettingsService {
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
      console.error('Settings API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async getProjectInfo(): Promise<{
    success: boolean;
    projectInfo?: ProjectInfo;
    error?: string;
  }> {
    const response = await this.request<{ projectInfo: ProjectInfo }>(
      'settings/project-info.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        projectInfo: response.data.projectInfo,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch project info',
    };
  }

  async updateProjectInfo(
    projectData: Partial<ProjectInfo>
  ): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('settings/update-project.php', {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update project info',
    };
  }

  async getAccountInfo(): Promise<{
    success: boolean;
    accountInfo?: AccountInfo;
    error?: string;
  }> {
    const response = await this.request<{ accountInfo: AccountInfo }>(
      'settings/account-info.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        accountInfo: response.data.accountInfo,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch account info',
    };
  }

  async updateAccountInfo(
    accountData: Partial<AccountInfo>
  ): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('settings/update-account.php', {
      method: 'PUT',
      body: JSON.stringify(accountData),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update account info',
    };
  }

  async getAppearanceSettings(): Promise<{
    success: boolean;
    settings?: {
      theme: 'light' | 'dark' | 'auto';
      accentColor: string;
      fontSize: 'small' | 'medium' | 'large';
      compactMode: boolean;
    };
    error?: string;
  }> {
    const response = await this.request<{
      settings: {
        theme: 'light' | 'dark' | 'auto';
        accentColor: string;
        fontSize: 'small' | 'medium' | 'large';
        compactMode: boolean;
      };
    }>('settings/appearance.php', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        settings: response.data.settings,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch appearance settings',
    };
  }

  async updateAppearanceSettings(settings: {
    theme?: 'light' | 'dark' | 'auto';
    accentColor?: string;
    fontSize?: 'small' | 'medium' | 'large';
    compactMode?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('settings/update-appearance.php', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update appearance settings',
    };
  }

  async getNotificationSettings(): Promise<{
    success: boolean;
    settings?: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      notificationTypes: string[];
      frequency: 'instant' | 'hourly' | 'daily';
    };
    error?: string;
  }> {
    const response = await this.request<{
      settings: {
        emailNotifications: boolean;
        pushNotifications: boolean;
        notificationTypes: string[];
        frequency: 'instant' | 'hourly' | 'daily';
      };
    }>('settings/notifications.php', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        settings: response.data.settings,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch notification settings',
    };
  }

  async updateNotificationSettings(settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    notificationTypes?: string[];
    frequency?: 'instant' | 'hourly' | 'daily';
  }): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('settings/update-notifications.php', {
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

  async getSecuritySettings(): Promise<{
    success: boolean;
    settings?: {
      twoFactorEnabled: boolean;
      sessionTimeout: number;
      passwordLastChanged: Date;
      loginAlerts: boolean;
    };
    error?: string;
  }> {
    const response = await this.request<{
      settings: {
        twoFactorEnabled: boolean;
        sessionTimeout: number;
        passwordLastChanged: Date;
        loginAlerts: boolean;
      };
    }>('settings/security.php', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        settings: response.data.settings,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch security settings',
    };
  }

  async updateSecuritySettings(settings: {
    twoFactorEnabled?: boolean;
    sessionTimeout?: number;
    loginAlerts?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('settings/update-security.php', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update security settings',
    };
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('settings/change-password.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to change password',
    };
  }

  async getBillingInfo(): Promise<{
    success: boolean;
    billing?: {
      plan: string;
      storageUsed: string;
      storageLimit: string;
      nextBillingDate: Date;
      billingCycle: 'monthly' | 'yearly';
    };
    error?: string;
  }> {
    const response = await this.request<{
      billing: {
        plan: string;
        storageUsed: string;
        storageLimit: string;
        nextBillingDate: Date;
        billingCycle: 'monthly' | 'yearly';
      };
    }>('settings/billing.php', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        billing: response.data.billing,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch billing info',
    };
  }
}

export const settingsService = new SettingsService();
export default settingsService;
