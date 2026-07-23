import { authService } from './authService';
import type { User, ExperimentItem } from '../types';

const API_BASE_URL = '';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class DataService {
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
      console.error('Data API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async getExperimentsForUser(): Promise<ExperimentItem[]> {
    const response = await this.request<{ experiments: ExperimentItem[] }>(
      'data/experiments.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return response.data.experiments;
    }

    console.error('Failed to fetch experiments:', response.error);
    return [];
  }

  async getTeamMembersForUser(): Promise<User[]> {
    const response = await this.request<{ teamMembers: User[] }>(
      'data/team-members.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return response.data.teamMembers;
    }

    console.error('Failed to fetch team members:', response.error);
    return [];
  }

  async getAllAvailableTeamMembers(): Promise<User[]> {
    const response = await this.request<{ teamMembers: User[] }>(
      'data/all-team-members.php',
      {
        method: 'GET',
      }
    );
    
    if (response.success && response.data) {
      return response.data.teamMembers;
    }

    console.error('Failed to fetch all team members:', response.error);
    return [];
  }

  async updateExperiment(
    experimentId: string,
    data: Partial<ExperimentItem>
  ): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('data/update-experiment.php', {
      method: 'PUT',
      body: JSON.stringify({
        id: experimentId,
        ...data,
      }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update experiment',
    };
  }

  async createExperiment(
    data: Partial<ExperimentItem>
  ): Promise<{ success: boolean; experiment?: ExperimentItem; error?: string }> {
    const response = await this.request<{ experiment: ExperimentItem }>(
      'data/create-experiment.php',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        experiment: response.data.experiment,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to create experiment',
    };
  }

  async deleteExperiment(experimentId: string): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('data/delete-experiment.php', {
      method: 'DELETE',
      body: JSON.stringify({ id: experimentId }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to delete experiment',
    };
  }
}

export const dataService = new DataService();
export default dataService;