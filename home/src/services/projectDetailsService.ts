import { ExperimentItem } from '../types';
import { getExperimentsForUser } from '../data/mockData';
import axios from 'axios';
const API_BASE_URL = '';
const PROJECTS_STORAGE_KEY = 'projects_data';

interface StoredProject {
  id: string;
  uid?: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  keywords: string[];
  analysisTypes: string[];
  selectedMembers: string[];
  updatedAt: string;
}



// PHP Backend Integration (commented out)
 

 export const projectDetailsService = {
   async getProjectById(projectId: string): Promise<ExperimentItem | null> {
     try {
       const response = await axios.get(
         `${API_BASE_URL}/project1/get.php?id=${projectId}`,
         {
           withCredentials: true,
           headers: {
             'Content-Type': 'application/json',
           },
         }
       );

       if (response.data.success) {
         const project = response.data.project;
         return {
           id: project.id.toString(),
           uid: project.uid,
           title: project.title,
           description: project.description || '',
           status: project.status,
           startDate: new Date(project.startDate),
           endDate: project.endDate ? new Date(project.endDate) : undefined,
           keywords: project.keywords || [],
           analysisTypes: project.analysisTypes || [],
           selectedMembers: project.selectedMembers || [],
           members: project.members?.map(m => ({
             id: m.id.toString(),
             name: m.name,
             email: m.email,
             initials: m.initials,
             avatar: m.avatar
           })) || [],
           files: project.files?.map(f => ({
             id: f.id.toString(),
             name: f.name,
             type: f.type as 'model' | 'data' | 'script',
             size: f.fileSize.toString(),
             lastModified: new Date(f.lastModified)
           })) || [],
           progress: 0,
         };
       }
       return null;
     } catch (error) {
       console.error('Error fetching project from PHP backend:', error);
       throw error;
     }
   },

   async updateProject(projectId: string, updates: Partial<any>): Promise<boolean> {
     try {
       const csrfToken = sessionStorage.getItem('csrfToken') || '';

       const response = await axios.put(
         `${API_BASE_URL}/project1/update.php`,
         {
           id: parseInt(projectId),
           ...updates,
         },
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
       console.error('Error updating project in PHP backend:', error);
       throw error;
     }
   },
   async deleteProject(projectId: string): Promise<boolean> {
     try {
       const csrfToken = sessionStorage.getItem('csrfToken') || '';
       const response = await axios.delete(
         `${API_BASE_URL}/project1/delete.php`,
         {
           data: { id: parseInt(projectId) },
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
       console.error('Error deleting project in PHP backend:', error);
       throw error;
     }
   },
   async updateProjectMembers(projectId: string, memberIds: string[]): Promise<boolean> {
     return this.updateProject(projectId, { selectedMembers: memberIds });
   },
 };