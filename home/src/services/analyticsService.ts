import { authService } from './authService';
import type {
  AnalyticsMetrics,
  VisitData,
  PageUsageData,
  ProjectUsageData,
  TeamActivityData,
  StorageBreakdown,
} from '../data/analyticsData';

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || '/auth';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class AnalyticsService {
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
      console.error('Analytics API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async getMetrics(timeRange?: string): Promise<{
    success: boolean;
    metrics?: AnalyticsMetrics;
    error?: string;
  }> {
    const endpoint = timeRange
      ? `analytics/metrics.php?range=${timeRange}`
      : 'analytics/metrics.php';

    const response = await this.request<{ metrics: AnalyticsMetrics }>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        metrics: response.data.metrics,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch analytics metrics',
    };
  }

  async getVisitData(timeRange?: string): Promise<{
    success: boolean;
    visitData?: VisitData[];
    error?: string;
  }> {
    const endpoint = timeRange
      ? `analytics/visits.php?range=${timeRange}`
      : 'analytics/visits.php';

    const response = await this.request<{ visitData: VisitData[] }>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        visitData: response.data.visitData,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch visit data',
    };
  }

  async getPageUsage(timeRange?: string): Promise<{
    success: boolean;
    pageUsage?: PageUsageData[];
    error?: string;
  }> {
    const endpoint = timeRange
      ? `analytics/page-usage.php?range=${timeRange}`
      : 'analytics/page-usage.php';

    const response = await this.request<{ pageUsage: PageUsageData[] }>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        pageUsage: response.data.pageUsage,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch page usage data',
    };
  }

  async getProjectUsage(): Promise<{
    success: boolean;
    projectUsage?: ProjectUsageData[];
    error?: string;
  }> {
    const response = await this.request<{ projectUsage: ProjectUsageData[] }>(
      'analytics/project-usage.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        projectUsage: response.data.projectUsage,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch project usage data',
    };
  }

  async getTeamActivity(): Promise<{
    success: boolean;
    teamActivity?: TeamActivityData[];
    error?: string;
  }> {
    const response = await this.request<{ teamActivity: TeamActivityData[] }>(
      'analytics/team-activity.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        teamActivity: response.data.teamActivity,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch team activity data',
    };
  }

  async getStorageBreakdown(): Promise<{
    success: boolean;
    storage?: StorageBreakdown[];
    error?: string;
  }> {
    const response = await this.request<{ storage: StorageBreakdown[] }>(
      'analytics/storage-breakdown.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        storage: response.data.storage,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch storage breakdown',
    };
  }

  async getGrowthTrends(timeRange?: string): Promise<{
    success: boolean;
    trends?: {
      visits: string;
      visitors: string;
      sessionDuration: string;
      storageUsage: string;
    };
    error?: string;
  }> {
    const endpoint = timeRange
      ? `analytics/growth-trends.php?range=${timeRange}`
      : 'analytics/growth-trends.php';

    const response = await this.request<{
      trends: {
        visits: string;
        visitors: string;
        sessionDuration: string;
        storageUsage: string;
      };
    }>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        trends: response.data.trends,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch growth trends',
    };
  }

  async getRealtimeMetrics(): Promise<{
    success: boolean;
    realtime?: {
      activeUsers: number;
      onlineTeamMembers: number;
      currentSessions: number;
      serverLoad: number;
    };
    error?: string;
  }> {
    const response = await this.request<{
      realtime: {
        activeUsers: number;
        onlineTeamMembers: number;
        currentSessions: number;
        serverLoad: number;
      };
    }>('analytics/realtime.php', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        realtime: response.data.realtime,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch realtime metrics',
    };
  }

  async getPerformanceMetrics(): Promise<{
    success: boolean;
    performance?: {
      pageLoadTime: string;
      serverResponseTime: string;
      uptime: string;
      errorRate: string;
    };
    error?: string;
  }> {
    const response = await this.request<{
      performance: {
        pageLoadTime: string;
        serverResponseTime: string;
        uptime: string;
        errorRate: string;
      };
    }>('analytics/performance.php', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        performance: response.data.performance,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch performance metrics',
    };
  }

  async trackEvent(eventData: {
    category: string;
    action: string;
    label?: string;
    value?: number;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('analytics/track-event.php', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to track event',
    };
  }

  async exportAnalytics(format: 'csv' | 'json' | 'pdf', filters?: {
    startDate?: Date;
    endDate?: Date;
    includeCharts?: boolean;
  }): Promise<{
    success: boolean;
    downloadUrl?: string;
    error?: string;
  }> {
    const response = await this.request<{ downloadUrl: string }>(
      'analytics/export.php',
      {
        method: 'POST',
        body: JSON.stringify({ format, ...filters }),
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        downloadUrl: response.data.downloadUrl,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to export analytics',
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
