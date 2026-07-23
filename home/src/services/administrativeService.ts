import { authService } from './authService';
import type {
  ComplianceItem,
  AuditLog,
  SystemMetric,
  PolicyDocument,
  UserPermission,
  BackupStatus,
} from '../data/administrativeData';

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || '/auth';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class AdministrativeService {
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
      console.error('Administrative API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async getComplianceItems(): Promise<{
    success: boolean;
    items?: ComplianceItem[];
    error?: string;
  }> {
    const response = await this.request<{ items: ComplianceItem[] }>(
      'admin/compliance.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        items: response.data.items,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch compliance items',
    };
  }

  async updateComplianceItem(
    itemId: number,
    data: Partial<ComplianceItem>
  ): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('admin/update-compliance.php', {
      method: 'PUT',
      body: JSON.stringify({ itemId, ...data }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update compliance item',
    };
  }

  async getAuditLogs(filters?: {
    category?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<{
    success: boolean;
    logs?: AuditLog[];
    error?: string;
  }> {
    const queryParams = new URLSearchParams();
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) queryParams.append('endDate', filters.endDate.toISOString());
    if (filters?.userId) queryParams.append('userId', filters.userId);

    const endpoint = `admin/audit-logs.php${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await this.request<{ logs: AuditLog[] }>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        logs: response.data.logs,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch audit logs',
    };
  }

  async createAuditLog(logData: {
    action: string;
    details: string;
    category: AuditLog['category'];
  }): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('admin/create-audit-log.php', {
      method: 'POST',
      body: JSON.stringify(logData),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to create audit log',
    };
  }

  async getSystemMetrics(): Promise<{
    success: boolean;
    metrics?: SystemMetric[];
    error?: string;
  }> {
    const response = await this.request<{ metrics: SystemMetric[] }>(
      'admin/system-metrics.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        metrics: response.data.metrics,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch system metrics',
    };
  }

  async getPolicyDocuments(): Promise<{
    success: boolean;
    policies?: PolicyDocument[];
    error?: string;
  }> {
    const response = await this.request<{ policies: PolicyDocument[] }>(
      'admin/policies.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        policies: response.data.policies,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch policy documents',
    };
  }

  async updatePolicyDocument(
    policyId: number,
    data: Partial<PolicyDocument>
  ): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('admin/update-policy.php', {
      method: 'PUT',
      body: JSON.stringify({ policyId, ...data }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update policy document',
    };
  }

  async getUserPermissions(): Promise<{
    success: boolean;
    permissions?: UserPermission[];
    error?: string;
  }> {
    const response = await this.request<{ permissions: UserPermission[] }>(
      'admin/user-permissions.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        permissions: response.data.permissions,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch user permissions',
    };
  }

  async updateUserPermissions(
    userId: string,
    permissions: string[]
  ): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('admin/update-permissions.php', {
      method: 'PUT',
      body: JSON.stringify({ userId, permissions }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update user permissions',
    };
  }

  async updateUserStatus(
    userId: string,
    status: 'active' | 'inactive' | 'suspended'
  ): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('admin/update-user-status.php', {
      method: 'PUT',
      body: JSON.stringify({ userId, status }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update user status',
    };
  }

  async getBackupStatus(): Promise<{
    success: boolean;
    backups?: BackupStatus[];
    error?: string;
  }> {
    const response = await this.request<{ backups: BackupStatus[] }>(
      'admin/backup-status.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        backups: response.data.backups,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch backup status',
    };
  }

  async initiateBackup(type: 'full' | 'incremental' | 'differential'): Promise<{
    success: boolean;
    error?: string;
  }> {
    const response = await this.request('admin/initiate-backup.php', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to initiate backup',
    };
  }

  async getAdministrativeStats(): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    const response = await this.request<{ stats: any }>('admin/stats.php', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        stats: response.data.stats,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch administrative stats',
    };
  }
}

export const administrativeService = new AdministrativeService();
export default administrativeService;
