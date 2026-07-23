
import { FileNode } from '../contexts/FileContext';
import { putNode, getNode } from '../../lib/db';
import { currentUser, currentProject } from '../data/appConfig';

const API_BASE_URL = '/project-api';

interface PresignedUrlResponse {
  url: string;
  fields?: Record<string, string>;
  key: string;
}

export interface ProjectSyncState {
    project_id: string;
    sync_hash: string;
    last_synced_at: string;
}

export interface RemoteFileRecord {
    id: number;
    uid: string; // Add this
    file_name: string;
    file_path: string; // "Data/file.csv"
    category: string;
    file_size: number;
    updated_at: string;
}

export const getPresignedUrl = async (fileName: string, prefix: string, method: 'PUT' | 'DELETE' = 'PUT'): Promise<PresignedUrlResponse> => {
  const response = await fetch(`${API_BASE_URL}/generate-presigned-url.php?filename=${encodeURIComponent(fileName)}&prefix=${encodeURIComponent(prefix)}&c=${currentProject.id}&method=${method}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get presigned URL: ${response.status} ${errorText}`);
  }
  
  return response.json();
};

export const uploadFileToS3 = async (file: FileNode, path: string, prefix: string) => {
  if (file.type !== 'file' || file.content === undefined) return;

  const fullPath = path ? `${path}/${file.name}` : file.name;
  
  // 1. Get Pre-signed URL (PUT)
  const { url } = await getPresignedUrl(fullPath, prefix, 'PUT');

  // 2. Upload File
  const blob = new Blob([file.content], { type: 'application/octet-stream' }); 
  
  const uploadResponse = await fetch(url, {
    method: 'PUT',
    body: blob,
    headers: {
        'Content-Type': 'application/octet-stream'
    }
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload file to S3: ${uploadResponse.statusText}`);
  }

  // 3. Confirm / Log Upload (Active = 1)
  const logResponse = await logFileStatus(file.name, fullPath, prefix, blob.size, true);

  // 4. Update Local DB
  const storedNode = await getNode(file.id);
  if (storedNode) {
    await putNode({
      ...storedNode,
      is_synced: true,
      last_synced_at: new Date().toISOString(),
      db_id: logResponse?.uid || storedNode.db_id // Update db_id from backend response if available
    });
  }
};

export const deleteFileFromS3 = async (relativePath: string, prefix: string) => {
    // 1. Get Pre-signed URL (DELETE)
    // relativePath is like "Data/dataset.csv"
    const { url } = await getPresignedUrl(relativePath, prefix, 'DELETE');

    // 2. Execute Delete
    const deleteResponse = await fetch(url, { method: 'DELETE' });

    if (!deleteResponse.ok) {
        throw new Error(`Failed to delete file from S3: ${deleteResponse.statusText}`);
    }

    // 3. Log Deletion (Active = 0)
    // We assume the filename is the last part of path
    const parts = relativePath.split('/');
    const fileName = parts.pop() || relativePath;
    await logFileStatus(fileName, relativePath, prefix, 0, false);
};

const logFileStatus = async (fileName: string, relativePath: string, prefix: string, size: number, isActive: boolean): Promise<{message: string, uid: string} | null> => {
    const pathParts = relativePath.split('/');
    // If path is "Data/file.csv", category is "Data". If "file.csv", category is "Uncategorized"
    const category = pathParts.length > 1 ? pathParts[0] : 'Uncategorized';
    const extension = fileName.split('.').pop() || '';
    const fullKey = `${relativePath}`; // don't include prefix

    try {
        const response = await fetch(`${API_BASE_URL}/log_file.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.id,
            project_id: currentProject.id,
            file_name: fileName,
            file_type: extension,
            file_size: size,
            file_path: fullKey,
            category: category,
            active: isActive ? 1 : 0
          })
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Failed to update file status in database:', error);
        return null;
    }
};

export const updateProjectSyncHash = async (projectId: string, hash: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/update_sync_hash.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: projectId,
                sync_hash: hash
            })
        });
        
        if (!response.ok) {
             const errorText = await response.text();
             console.error(`Failed to update sync hash: ${response.status}`, errorText);
        }
    } catch (error) {
        console.error('Error updating project sync hash:', error);
    }
};

export const syncProject = async (
  uploads: (FileNode & { path: string })[],
  deletions: string[],
  prefix: string,
  onProgress: (current: number, total: number, message: string) => void
) => {
  const totalOps = uploads.length + deletions.length;
  let completed = 0;

  // Process Deletions First
  for (const delPath of deletions) {
      try {
          onProgress(completed, totalOps, `Deleting ${delPath}...`);
          await deleteFileFromS3(delPath, prefix);
          completed++;
      } catch (error) {
          console.error(`Error deleting ${delPath}:`, error);
      }
  }

  // Process Uploads
  for (const file of uploads) {
    try {
        onProgress(completed, totalOps, `Uploading ${file.name}...`);
        await uploadFileToS3(file, file.path, prefix);
        completed++;
    } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
    }
  }
  
  onProgress(totalOps, totalOps, 'Sync Complete');
};


// --- New Functions for Initialization / Restore ---

export const getProjectSyncState = async (projectId: string): Promise<ProjectSyncState | null> => {
    // --- PHP INTEGRATION (COMMENTED OUT) ---
   
    try {
        const response = await fetch(`${API_BASE_URL}/get_sync_state.php?project_id=${projectId}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.error("Failed to get sync state", e);
        return null;
    }
   
    // --- MOCK RETURN ---
    // Simulate finding a hash in DB for this project
    // Return null to simulate "no remote project found"
    // Return object to simulate "remote project exists"
    return null; 
    // return { project_id: projectId, sync_hash: 'mock-hash-123', last_synced_at: new Date().toISOString() };
};

export const getProjectFiles = async (projectId: string): Promise<RemoteFileRecord[]> => {
    // --- PHP INTEGRATION (COMMENTED OUT) ---
    
    try {
        const response = await fetch(`${API_BASE_URL}/get_project_files.php?project_id=${projectId}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (e) {
        console.error("Failed to get project files", e);
        return [];
    }
    
    // --- MOCK RETURN ---
    return [
        { id: 1, uid: 'mockuid12345', file_name: 'dataset.csv', file_path: 'Data/dataset.csv', category: 'Data', file_size: 1024, updated_at: new Date().toISOString() },
        { id: 2, uid: 'mockuid67890', file_name: 'run1.mod', file_path: 'Models/run1.mod', category: 'Models', file_size: 2048, updated_at: new Date().toISOString() }
    ];
};

export const fetchFileContentFromS3 = async (remotePath: string, prefix: string): Promise<string> => {
    // 1. Get Presigned GET URL
    // --- PHP INTEGRATION (COMMENTED OUT) ---
    
    const response = await fetch(`${API_BASE_URL}/generate-presigned-url.php?filename=${encodeURIComponent(remotePath)}&prefix=${encodeURIComponent(prefix)}&method=GET`);
    const { url } = await response.json();

    const fileReq = await fetch(url);
    return await fileReq.text();
    

    // --- MOCK RETURN ---
    return `Content retrieved from S3 for ${remotePath}`;
};
