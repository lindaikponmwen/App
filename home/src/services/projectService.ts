import axios from 'axios';

// PHP Backend Integration
// Uncomment the line below and configure the URL based on your PHP server setup
// const API_BASE_URL = 'http://localhost/php-setup';
// For production: 'https://yourdomain.com/php-setup'

const API_BASE_URL = '';

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pausedProjects: number;
  completionRate: number;
  createdByMe: number;
  memberOf: number;
  totalFiles: number;
}

interface Project {
  id: number;
  uid?: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  userRole: string;
  members: Array<{
    id: number;
    name: string;
    email: string;
    initials: string;
    avatar: string;
    role?: string;
  }>;
  selectedMembers: number[];
  keywords: string[];
  analysisTypes: string[];
  files?: Array<{
    id: number;
    name: string;
    type: string;
    fileSize: number;
    mimeType: string;
    lastModified: string;
  }>;
  fileCount?: number;
}

interface ProjectsResponse {
  success: boolean;
  projects: Project[];
}

interface ProjectResponse {
  success: boolean;
  project: Project;
  csrfToken?: string;
}

interface DeleteResponse {
  success: boolean;
  message: string;
  csrfToken?: string;
}

interface StatsResponse {
  success: boolean;
  stats: ProjectStats;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export const projectService = {
  async getAllProjects(): Promise<Project[]> {
    try {
      const response = await axios.get<ProjectsResponse>(
        `${API_BASE_URL}/project1/list.php`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return response.data.projects.map(project => ({
          ...project,
          startDate: project.startDate,
          endDate: project.endDate,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  async getProjectById(id: number): Promise<Project | null> {
    try {
      const response = await axios.get<ProjectResponse>(
        `${API_BASE_URL}/project1/get.php?id=${id}`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return response.data.project;
      }
      return null;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  async createProject(projectData: {
    title: string;
    description?: string;
    status?: 'active' | 'completed' | 'paused';
    startDate: string;
    endDate?: string;
    selectedMembers?: number[];
    keywords?: string[];
    analysisTypes?: string[];
  }): Promise<Project | null> {
    try {
      const csrfToken = sessionStorage.getItem('csrfToken') || '';
    
      const response = await axios.post<ProjectResponse>(
        `${API_BASE_URL}/project1/create.php`,
        projectData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
        }
      );
      
      if (response.data.success && response.data.csrfToken) {
        sessionStorage.setItem('csrfToken', response.data.csrfToken);
      }

      if (response.data.success) {
        return response.data.project;
      }
      return null;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  async updateProject(projectData: {
    id: number;
    title?: string;
    description?: string;
    status?: 'active' | 'completed' | 'paused';
    startDate?: string;
    endDate?: string;
    selectedMembers?: number[];
    keywords?: string[];
    analysisTypes?: string[];
  }): Promise<boolean> {
    try {
      const csrfToken = sessionStorage.getItem('csrfToken') || '';

      const response = await axios.put<{ success: boolean; message: string; csrfToken?: string }>(
        `${API_BASE_URL}/project1/update.php`,
        projectData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
        }
      );

      if (response.data.success && response.data.csrfToken) {
        sessionStorage.setItem('csrfToken', response.data.csrfToken);
      }

      return response.data.success;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  async deleteProject(id: number): Promise<boolean> {
    try {
      const csrfToken = sessionStorage.getItem('csrfToken') || '';

      const response = await axios.delete<DeleteResponse>(
        `${API_BASE_URL}/project1/delete.php`,
        {
          data: { id },
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
        }
      );

      if (response.data.success && response.data.csrfToken) {
        sessionStorage.setItem('csrfToken', response.data.csrfToken);
      }

      return response.data.success;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  async getMostRecentProject(): Promise<Project | null> {
    try {
      const projects = await this.getAllProjects();

      if (projects.length === 0) {
        return null;
      }

      const sortedProjects = projects.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      });

      return sortedProjects[0];
    } catch (error) {
      console.error('Error fetching most recent project:', error);
      throw error;
    }
  },

  async getProjectStats(): Promise<ProjectStats | null> {
    try {
      const response = await axios.get<StatsResponse>(
        `${API_BASE_URL}/project1/stats.php`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
if (response.data.success) {
        return response.data.stats;
      }
      return null;
    } catch (error) {
      console.warn('Error fetching project stats (backend may be unreachable, using mock data):', error);
      return null;
    }
  }
};

export type { Project, ProjectsResponse, ProjectResponse, DeleteResponse };
