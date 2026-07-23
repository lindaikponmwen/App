import { ExperimentItem } from '../types';

const STORAGE_KEY = 'user_projects';

export const projectStorage = {
  getProjects: (): ExperimentItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const projects = JSON.parse(stored);
      return projects.map((project: any) => ({
        ...project,
        startDate: new Date(project.startDate),
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        files: project.files || []
      }));
    } catch (error) {
      console.error('Error reading projects from localStorage:', error);
      return [];
    }
  },

  saveProject: (project: ExperimentItem): void => {
    try {
      const existingProjects = projectStorage.getProjects();
      const updatedProjects = [project, ...existingProjects];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Error saving project to localStorage:', error);
    }
  },

  updateProject: (projectId: string, updates: Partial<ExperimentItem>): void => {
    try {
      const projects = projectStorage.getProjects();
      const updatedProjects = projects.map(project =>
        project.id === projectId ? { ...project, ...updates } : project
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Error updating project in localStorage:', error);
    }
  },

  deleteProject: (projectId: string): void => {
    try {
      const projects = projectStorage.getProjects();
      const updatedProjects = projects.filter(project => project.id !== projectId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Error deleting project from localStorage:', error);
    }
  },

  getProjectById: (projectId: string): ExperimentItem | undefined => {
    const projects = projectStorage.getProjects();
    return projects.find(project => project.id === projectId);
  },

  initializeSampleProjects: (sampleProjects: ExperimentItem[]): void => {
    try {
      const existingProjects = projectStorage.getProjects();
      if (existingProjects.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleProjects));
      }
    } catch (error) {
      console.error('Error initializing sample projects:', error);
    }
  }
};
