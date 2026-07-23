import { APP_CONFIG } from '../data/config';

export interface S3FileRecord {
  id: number;
  uid: string;
  file_name: string;
  file_path: string;
  category: string;
  file_size: number;
  updated_at: string;
}

class S3Service {
  /**
   * Fetches list of files associated with a project ID from the PHP backend.
   */
  async getProjectFiles(projectId: string): Promise<S3FileRecord[]> {
    try {
      const response = await fetch(`${APP_CONFIG.apiEndpoints.getProjectFiles}?project_id=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project files from database');
      return await response.json();
    } catch (error) {
      console.error('S3Service.getProjectFiles Error:', error);
      throw error;
    }
  }

  /**
   * Requests a presigned GET URL for an S3 object path.
   */
  async getPresignedGetUrl(filePath: string): Promise<string> {
    try {
      // Note: We specify 'GET' as method to override the default 'PUT' in your existing script
      const url = `${APP_CONFIG.apiEndpoints.generateUrl}?filename=${encodeURIComponent(filePath)}&prefix=&method=GET`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to generate presigned URL');
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('S3Service.getPresignedGetUrl Error:', error);
      throw error;
    }
  }

  /**
   * Downloads CSV content from an S3 presigned URL.
   */
  async downloadCsvContent(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to download file from S3 bucket');
      return await response.text();
    } catch (error) {
      console.error('S3Service.downloadCsvContent Error:', error);
      throw error;
    }
  }
}

export const s3Service = new S3Service();