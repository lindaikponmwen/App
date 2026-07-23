
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { mockFileStructure as dashboardFiles, fileContents as dashboardFileContents } from '../data/dashboardData';
import { dapFileStructure, dapFileContents } from '../data/dapData';
import { reportsFileStructure, reportsFileContents } from '../data/reportsData';
import { presentationsFileStructure, presentationsFileContents } from '../data/presentationsData';
import { currentUser, currentProject } from '../data/appConfig';
import { StoredFileNode, getAllNodes, getNode, putNode, putNodes, deleteNodes, findChildNode, clearStore } from '../../lib/db';
import { getProjectSyncState, getProjectFiles, fetchFileContentFromS3 } from '../services/s3Service';
import { useSettings } from './SettingsContext';

export interface Version {
  id: string;
  content: string;
  timestamp: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  extension?: string;
  children?: FileNode[];
  content?: string;
  size?: number;
  lastModified?: string;
  history?: Version[];
  is_synced?: boolean; // New field for sync status
  last_synced_at?: string | null; // New field for sync timestamp
  db_id?: string; // Corresponds to file uid in database
}

export interface AIChange {
    file: string;
    content: string;
    description: string;
    delete?: boolean;
}

// Helper to generate a random alphanumeric string for db_id (8-12 chars)
const generateDbId = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const length = Math.floor(Math.random() * (12 - 8 + 1)) + 8; // Random length between 8 and 12
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
};

const findNodeInTree = (nodes: FileNode[], nodeId: string): FileNode | null => {
    for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
            const found = findNodeInTree(node.children, nodeId);
            if (found) return found;
        }
    }
    return null;
};

const addContentToFiles = (nodes: FileNode[], contents: Record<string, string>): FileNode[] => {
    return nodes.map(node => {
        if (node.type === 'file') {
            const content = contents[node.id] || '';
            const history = node.history && node.history.length > 0 ? node.history : [{
                id: crypto.randomUUID(),
                content: content,
                timestamp: node.lastModified || new Date().toISOString()
            }];
            return {
                ...node,
                content: content,
                history: history,
                is_synced: false, // Default to unsynced
                last_synced_at: null,
            };
        }
        if (node.children) {
            return {
                ...node,
                children: addContentToFiles(node.children, contents)
            };
        }
        return node;
    });
};

const initialProjectFolderName = `user-${currentUser.id}-pkpd-project-${currentProject.id}`;
const combinedFileContents = { 
    ...dashboardFileContents, 
    ...dapFileContents,
    ...reportsFileContents,
    ...presentationsFileContents
};

const defaultFileTree: FileNode = {
    id: 'root',
    name: initialProjectFolderName,
    type: 'folder',
    children: [
        { id: 'my-workflows-folder', name: 'My Workflows', type: 'folder', children: [] },
        ...addContentToFiles(dashboardFiles, combinedFileContents),
        ...addContentToFiles(dapFileStructure, combinedFileContents),
        ...addContentToFiles(reportsFileStructure, combinedFileContents),
        ...addContentToFiles(presentationsFileStructure, combinedFileContents)
    ]
};

interface FileContextType {
    fileTree: FileNode;
    activeFileId: string | null;
    activeFile: FileNode | null;
    activeFileContent: string;
    totalVersions: number;
    pendingDeletions: Set<string>;
    clearPendingDeletions: () => void;
    updateActiveFileContent: (content: string) => void;
    revertToVersion: (versionId: string) => Promise<void>;
    openFile: (fileId: string) => void;
    closeFile: () => void;
    addNode: (parentId: string, name: string, type: 'file' | 'folder') => Promise<FileNode>;
    deleteNode: (nodeId: string) => Promise<void>;
    renameNode: (nodeId: string, newName: string) => Promise<void>;
    duplicateNode: (nodeId: string, newName: string) => Promise<void>;
    moveNode: (nodeId: string, targetParentId: string) => Promise<void>;
    findNodePath: (nodeId: string) => string[] | null;
    refreshFileTree: () => Promise<void>;
    updateFileContentById: (fileId: string, content: string) => Promise<void>;
    applyAiChanges: (changes: AIChange[]) => Promise<void>;
    clearAllHistory: () => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
    const context = useContext(FileContext);
    if (!context) {
        throw new Error('useFiles must be used within a FileProvider');
    }
    return context;
};

// Helper functions for state manipulation
const recursiveDelete = (nodes: FileNode[], nodeId: string): FileNode[] => {
    return nodes.filter(node => node.id !== nodeId).map(node => {
        if (node.children) {
            return { ...node, children: recursiveDelete(node.children, nodeId) };
        }
        return node;
    });
};

const recursiveUpdate = (nodes: FileNode[], nodeId: string, updateFn: (node: FileNode) => FileNode): FileNode[] => {
    return nodes.map(node => {
        if (node.id === nodeId) {
            return updateFn(node);
        }
        if (node.children) {
            return { ...node, children: recursiveUpdate(node.children, nodeId, updateFn) };
        }
        return node;
    });
};

const recursiveAdd = (nodes: FileNode[], parentId: string, newNode: FileNode): FileNode[] => {
    return nodes.map(node => {
        if (node.id === parentId) {
            return { ...node, children: [...(node.children || []), newNode].sort((a,b) => a.name.localeCompare(b.name)) };
        }
        if (node.children) {
            return { ...node, children: recursiveAdd(node.children, parentId, newNode) };
        }
        return node;
    });
};

const getAllChildIds = (node: FileNode | null): string[] => {
    if (!node) return [];
    let ids = [node.id];
    if (node.children) {
        node.children.forEach(child => {
            ids = [...ids, ...getAllChildIds(child)];
        });
    }
    return ids;
};

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isInitializing, setIsInitializing] = useState(true);
    const [statusMessage, setStatusMessage] = useState('Initializing file system...');
    const [fileTree, setFileTree] = useState<FileNode>({id: 'root', name: 'root', type: 'folder', children: []});
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [activeFileContent, setActiveFileContent] = useState('');
    const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(new Set());
    const debounceTimer = useRef<number | null>(null);
    const { settings } = useSettings(); // Use this if we need prefix settings for S3

    // Load pending deletions from storage on mount
    useEffect(() => {
        const stored = localStorage.getItem('drlevey-pending-deletions');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setPendingDeletions(new Set(parsed));
                }
            } catch (e) {
                console.error("Failed to load pending deletions", e);
            }
        }
    }, []);

    // Persist pending deletions
    useEffect(() => {
        localStorage.setItem('drlevey-pending-deletions', JSON.stringify(Array.from(pendingDeletions)));
    }, [pendingDeletions]);

    const buildTreeFromFlatData = (nodes: StoredFileNode[]): FileNode => {
      const map = new Map<string, FileNode>(nodes.map(node => {
        const { parentId, ...rest } = node;
        return [node.id, { ...rest, children: [] }];
      }));
      let root: FileNode | null = null;
      
      for (const node of nodes) {
        if (node.parentId) {
          const parent = map.get(node.parentId);
          if (parent) {
            const childNode = map.get(node.id)!;
            if (!parent.children) parent.children = [];
            parent.children.push(childNode);
          }
        } else if (node.id === 'root') {
          root = map.get(node.id)!;
        }
      }
      map.forEach(node => {
        if (node.children) {
          node.children.sort((a, b) => a.name.localeCompare(b.name));
        }
      });
      return root || { id: 'root', name: initialProjectFolderName, type: 'folder', children: [] };
    };
    
    // Function to flatten default structure for IndexedDB population
    const flattenDefaultTree = (node: FileNode, parentId: string | null): StoredFileNode[] => {
        const { children, ...rest } = node;
        const flatNode: StoredFileNode = { 
            ...rest, 
            parentId, 
            is_synced: false, 
            last_synced_at: null,
            db_id: rest.db_id || generateDbId() // Ensure db_id exists
        };
        let nodes: StoredFileNode[] = [flatNode];
        if (children) {
            for (const child of children) {
                nodes.push(...flattenDefaultTree(child, node.id));
            }
        }
        return nodes;
    };

    // Helper to create directory structure from S3 paths
    const reconstructTreeFromS3Files = async (files: any[]): Promise<StoredFileNode[]> => {
        const nodes: StoredFileNode[] = [];
        
        // 1. Create Root
        nodes.push({
            id: 'root',
            name: initialProjectFolderName,
            parentId: null,
            type: 'folder',
            is_synced: true,
            last_synced_at: new Date().toISOString(),
            db_id: generateDbId()
        });

        // 2. Map for folders to prevent duplicates
        // Key: Folder Path (e.g., "Data"), Value: UUID
        const folderMap = new Map<string, string>();

        const getOrCreateFolder = (pathParts: string[]): string => {
             let parentId = 'root';
             let currentPath = '';

             for (const part of pathParts) {
                 currentPath = currentPath ? `${currentPath}/${part}` : part;
                 
                 if (folderMap.has(currentPath)) {
                     parentId = folderMap.get(currentPath)!;
                 } else {
                     const newId = crypto.randomUUID();
                     nodes.push({
                         id: newId,
                         name: part,
                         parentId: parentId,
                         type: 'folder',
                         is_synced: true,
                         last_synced_at: new Date().toISOString(),
                         db_id: generateDbId()
                     });
                     folderMap.set(currentPath, newId);
                     parentId = newId;
                 }
             }
             return parentId;
        };

        // 3. Process Files
        for (const file of files) {
            const parts = file.file_path.split('/'); // "prj-id/Data/dataset.csv"
            const fileName = parts.pop();
            
            // Removing the first part (container folder) to flatten structure under root
            if (parts.length > 0) {
                parts.shift(); 
            }

            const folderPath = parts; // ["Data"]
            
            const parentId = getOrCreateFolder(folderPath);
            
            // Derive extension from filename if possible, fall back to DB type
            const derivedExtension = fileName?.includes('.') ? fileName.split('.').pop()?.toLowerCase() : undefined;
            const finalExtension = derivedExtension || file.file_type || '';

            // Fetch content
            let content = '';
            try {
                // We use empty prefix here because file.file_path is already the full key including prefix
                content = await fetchFileContentFromS3(file.file_path, '');
            } catch (e) {
                console.error(`Failed to download ${file.file_path}`, e);
                content = 'Failed to load content.';
            }

            nodes.push({
                id: crypto.randomUUID(),
                name: fileName,
                parentId: parentId,
                type: 'file',
                extension: finalExtension,
                size: file.file_size,
                content: content,
                is_synced: true,
                last_synced_at: file.updated_at,
                db_id: file.uid || generateDbId(), // Use remote uid or generate
                history: [{ id: crypto.randomUUID(), content: content, timestamp: file.updated_at }]
            });
        }
        
        return nodes;
    };


    useEffect(() => {
        const init = async () => {
            const projectId = currentProject.id;
            const localHashKey = `drlevey_sync_hash_${projectId}`;
            const localHash = localStorage.getItem(localHashKey);
            
            // 1. Check for remote hash
            setStatusMessage('Checking project synchronization...');
            const remoteSyncState = await getProjectSyncState(projectId);
            
            let shouldLoadFromS3 = false;
            let shouldLoadDefaults = false;
            
            if (remoteSyncState) {
                // Remote exists. Check if local is outdated or missing.
                // NOTE: If we want to FORCE download when local is missing, we check !localHash.
                // If we want to update only when hashes differ, we check localHash !== remoteSyncState.sync_hash.
                if (!localHash || localHash !== remoteSyncState.sync_hash) {
                    // Logic: Mismatch found. 
                    // Production Logic: Download files from S3 to ensure local is up to date.
                    shouldLoadFromS3 = true;
                } else {
                    // Hashes Match -> Local IndexedDB is up to date.
                    // Do nothing, proceed to load from DB.
                }
            } else {
                // No remote record. 
                // Check if we have local data in IndexedDB
                const rootNode = await getNode('root');
                if (!rootNode) {
                    // No local data AND no remote data -> New Project -> Load Defaults
                    shouldLoadDefaults = true;
                }
                // Else: We have local data but no remote. This is a local-only project so far.
            }

            if (shouldLoadFromS3) {
                 setStatusMessage('Downloading project files from cloud...');
                 try {
                     const remoteFiles = await getProjectFiles(projectId);
                     if (remoteFiles.length > 0) {
                         const nodes = await reconstructTreeFromS3Files(remoteFiles);
                         
                         // Clear existing local DB to avoid conflicts/orphans during full sync restoration
                         await clearStore();
                         await putNodes(nodes);
                         
                         // Update local hash to match remote
                         if (remoteSyncState) {
                             localStorage.setItem(localHashKey, remoteSyncState.sync_hash);
                         }
                         
                         setFileTree(buildTreeFromFlatData(nodes));
                     } else {
                         // Remote hash exists but no files returned? Edge case. Fallback to defaults.
                         shouldLoadDefaults = true; 
                     }
                 } catch (e) {
                     console.error("Error restoring from S3", e);
                     // Fallback to local DB if S3 fetch fails, or defaults if empty
                     const root = await getNode('root');
                     if (!root) shouldLoadDefaults = true;
                 }
            } 
            
            if (shouldLoadDefaults) {
                setStatusMessage('Initializing default project structure...');
                // Initialize IndexedDB with default structure
                await clearStore(); // Ensure clean slate
                const nodes = flattenDefaultTree(defaultFileTree, null);
                await putNodes(nodes);
                setFileTree(defaultFileTree);
            } 
            
            if (!shouldLoadDefaults && !shouldLoadFromS3) {
                 // Load from IndexedDB
                 const allNodes = await getAllNodes();
                 if (allNodes.length > 0) {
                     setFileTree(buildTreeFromFlatData(allNodes));
                 } else {
                     // Failsafe
                     const nodes = flattenDefaultTree(defaultFileTree, null);
                     await putNodes(nodes);
                     setFileTree(defaultFileTree);
                 }
            }

            setIsInitializing(false);
        };
        init();
    }, []); // Run once on mount

    const activeFile = activeFileId ? findNodeInTree([fileTree], activeFileId) : null;
    
    const totalVersions = useMemo(() => {
        let count = 0;
        const traverse = (nodes: FileNode[]) => {
            for (const node of nodes) {
                if (node.type === 'file') {
                    count += Math.max(0, (node.history?.length || 0) - 1);
                }
                if (node.children) traverse(node.children);
            }
        };
        if (fileTree.children) traverse(fileTree.children);
        return count;
    }, [fileTree]);

    // Helper to get full path string for a node
    const getNodePathString = useCallback((nodeId: string): string | null => {
        const findPath = (nodes: FileNode[], currentPath: string[]): string[] | null => {
            for (const node of nodes) {
                if (node.id === nodeId) return [...currentPath, node.name];
                if (node.children) {
                    const found = findPath(node.children, [...currentPath, node.name]);
                    if (found) return found;
                }
            }
            return null;
        };
        // Skip root name in path construction usually, but here we include it if needed.
        // Actually, usually we want paths relative to project root.
        // The root node has children like "Data", "Models".
        // findPath starts from root children.
        const pathParts = findPath(fileTree.children || [], []);
        return pathParts ? pathParts.join('/') : null;
    }, [fileTree]);

    // Helper to collect all file paths within a node (inclusive)
    const collectFilePaths = useCallback((node: FileNode, basePath: string): string[] => {
        let paths: string[] = [];
        const currentPath = basePath ? `${basePath}/${node.name}` : node.name;
        
        if (node.type === 'file') {
            paths.push(currentPath);
        } else if (node.children) {
            node.children.forEach(child => {
                paths = [...paths, ...collectFilePaths(child, currentPath)];
            });
        }
        return paths;
    }, []);

    const clearPendingDeletions = useCallback(() => {
        setPendingDeletions(new Set());
    }, []);

    const updateActiveFileContent = useCallback((content: string) => {
        if (!activeFileId) return;
        setActiveFileContent(content);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = window.setTimeout(async () => {
            const node = await getNode(activeFileId);
            if (!node) return;
            
            const newVersion: Version = { id: crypto.randomUUID(), content, timestamp: new Date().toISOString() };
            const updatedNode: StoredFileNode = {
                ...node,
                content,
                size: new Blob([content]).size,
                lastModified: newVersion.timestamp,
                history: [...(node.history || []), newVersion].slice(-50),
                is_synced: false, // Mark as unsynced on edit
            };
            await putNode(updatedNode);

            setFileTree(prevTree => ({
                ...prevTree,
                children: recursiveUpdate(prevTree.children!, activeFileId, n => ({
                    ...n,
                    content,
                    size: updatedNode.size,
                    lastModified: updatedNode.lastModified,
                    history: updatedNode.history,
                    is_synced: false, 
                }))
            }));
        }, 1000);
    }, [activeFileId]);
    
    const updateFileContentById = useCallback(async (fileId: string, content: string) => {
        const node = await getNode(fileId);
        if (!node || node.type !== 'file') return;

        const newTimestamp = new Date().toISOString();
        const newVersion: Version = { id: crypto.randomUUID(), content, timestamp: newTimestamp };
        
        const updatedNode: StoredFileNode = {
            ...node,
            content,
            size: new Blob([content]).size,
            lastModified: newTimestamp,
            history: [...(node.history || []), newVersion].slice(-50),
            is_synced: false, 
        };
        await putNode(updatedNode);
        
        setFileTree(prevTree => ({
            ...prevTree,
            children: recursiveUpdate(prevTree.children || [], fileId, n => ({
                ...n,
                content,
                size: updatedNode.size,
                lastModified: newTimestamp,
                history: updatedNode.history,
                is_synced: false,
            }))
        }));
    }, []);

    const revertToVersion = useCallback(async (versionId: string) => {
        if (!activeFileId) return;
        const node = await getNode(activeFileId);
        if (!node || !node.history) return;

        const versionToRevert = node.history.find(v => v.id === versionId);
        if (!versionToRevert) return;
        
        setActiveFileContent(versionToRevert.content);
        await updateFileContentById(activeFileId, versionToRevert.content);
    }, [activeFileId, updateFileContentById]);

    const openFile = useCallback((fileId: string) => {
        const node = findNodeInTree([fileTree], fileId);
        if (node && node.type === 'file') {
            setActiveFileId(fileId);
            setActiveFileContent(node.content || '');
        }
    }, [fileTree]);

    const closeFile = useCallback(() => {
        setActiveFileId(null);
        setActiveFileContent('');
    }, []);

    const addNode = useCallback(async (parentId: string, name: string, type: 'file' | 'folder'): Promise<FileNode> => {
        const newId = crypto.randomUUID();
        const db_id = generateDbId();
        const newNode: FileNode = { id: newId, name, type, lastModified: new Date().toISOString(), is_synced: false, db_id };
        
        const storedNode: StoredFileNode = { 
            id: newId, 
            name, 
            parentId, 
            type, 
            lastModified: newNode.lastModified,
            is_synced: false,
            last_synced_at: null,
            db_id
        };
        
        if (type === 'folder') {
            newNode.children = [];
        } else {
            const extension = name.split('.').pop() || '';
            newNode.extension = storedNode.extension = extension;
            newNode.size = storedNode.size = 0;
            newNode.content = storedNode.content = '';
            const initialVersion: Version = { id: crypto.randomUUID(), content: '', timestamp: newNode.lastModified! };
            newNode.history = storedNode.history = [initialVersion];
        }
        
        await putNode(storedNode);
        
        setFileTree(prev => {
            if (parentId === prev.id) {
                return { ...prev, children: [...(prev.children || []), newNode].sort((a,b) => a.name.localeCompare(b.name)) };
            }
            return { ...prev, children: recursiveAdd(prev.children!, parentId, newNode) };
        });
        return newNode;
    }, []);

    const deleteNode = useCallback(async (nodeId: string) => {
        // Track deletion for Sync
        const nodeToDelete = findNodeInTree([fileTree], nodeId);
        if (nodeToDelete) {
            // Need the parent path to construct full path
            // We use findNodePath, then pop the last element to get parent dir
            const fullPathParts = findNodePath(nodeId);
            if (fullPathParts) {
                // If it's a folder, we need all children paths. 
                // But `collectFilePaths` works relative to a base.
                // fullPathParts is like ['Data', 'file.csv'].
                // Base path for `collectFilePaths` should be parent path.
                const parentPath = fullPathParts.slice(0, -1).join('/');
                const filesToDelete = collectFilePaths(nodeToDelete, parentPath);
                
                setPendingDeletions(prev => {
                    const next = new Set(prev);
                    filesToDelete.forEach(p => next.add(p));
                    return next;
                });
            }
        }

        const idsToDelete = getAllChildIds(nodeToDelete);
        await deleteNodes(idsToDelete);
        
        setFileTree(prev => ({ ...prev, children: recursiveDelete(prev.children!, nodeId) }));
        if (idsToDelete.includes(activeFileId || '')) {
            setActiveFileId(null);
            setActiveFileContent('');
        }
    }, [activeFileId, fileTree, collectFilePaths]);

    const renameNode = useCallback(async (nodeId: string, newName: string) => {
        // Track deletion of OLD path
        const nodeToRename = findNodeInTree([fileTree], nodeId);
        if (nodeToRename) {
            const fullPathParts = findNodePath(nodeId);
            if (fullPathParts) {
                const parentPath = fullPathParts.slice(0, -1).join('/');
                const filesToDelete = collectFilePaths(nodeToRename, parentPath);
                setPendingDeletions(prev => {
                    const next = new Set(prev);
                    filesToDelete.forEach(p => next.add(p));
                    return next;
                });
            }
        }

        const node = await getNode(nodeId);
        if (!node) return;

        const newExtension = node.type === 'file' ? newName.split('.').pop() || '' : undefined;
        const updatedNode = { ...node, name: newName, extension: newExtension, is_synced: false };
        await putNode(updatedNode);
        
        setFileTree(prev => ({
            ...prev,
            children: recursiveUpdate(prev.children!, nodeId, n => ({ ...n, name: newName, extension: newExtension, is_synced: false }))
        }));
    }, [fileTree, collectFilePaths]);
    
    const refreshFileTree = useCallback(async () => {
        const allNodes = await getAllNodes();
        setFileTree(buildTreeFromFlatData(allNodes));
    }, []);

    const findNodePath = useCallback((nodeId: string): string[] | null => {
        const find = (nodes: FileNode[], currentPath: string[]): string[] | null => {
            for (const node of nodes) {
                if (node.id === nodeId) return [...currentPath, node.name];
                if (node.children) {
                    const foundPath = find(node.children, [...currentPath, node.name]);
                    if (foundPath) return foundPath;
                }
            }
            return null;
        }
        return find(fileTree.children || [], []);
    }, [fileTree]);

    const duplicateNode = useCallback(async (nodeId: string, newName: string) => {
        const duplicateRecursive = async (originalNode: FileNode, parentId: string | null): Promise<void> => {
            const newId = crypto.randomUUID();
            const { children, ...rest } = originalNode;
            const storedNode: StoredFileNode = {
                ...rest,
                id: newId,
                parentId,
                history: (originalNode.history || []).map(v => ({...v, id: crypto.randomUUID()})),
                is_synced: false, 
                last_synced_at: null,
                db_id: generateDbId() // New random db_id for the duplicate
            };
            await putNode(storedNode);

            if (originalNode.children) {
                for(const child of originalNode.children) {
                    await duplicateRecursive(child, newId);
                }
            }
        };

        const nodeToDuplicate = findNodeInTree([fileTree], nodeId);
        if (!nodeToDuplicate) return;

        const parentId = findNodePath(nodeId)?.slice(0, -1).pop() || 'root'; 
        // Note: Logic to find parentID from name path is weak if names are not unique.
        // Better to get node from DB to get parentId.
        const dbNode = await getNode(nodeId);
        const actualParentId = dbNode?.parentId || 'root';

        const newDuplicatedNode: FileNode = JSON.parse(JSON.stringify(nodeToDuplicate));
        newDuplicatedNode.name = newName;
        newDuplicatedNode.lastModified = new Date().toISOString();
        if (newDuplicatedNode.type === 'file') {
            newDuplicatedNode.extension = newName.split('.').pop() || '';
        }

        await duplicateRecursive(newDuplicatedNode, actualParentId);
        await refreshFileTree();
    }, [fileTree, refreshFileTree]);

    const moveNode = useCallback(async (nodeId: string, targetParentId: string) => {
        // Track deletion of OLD path structure
        const nodeToMove = findNodeInTree([fileTree], nodeId);
        if (nodeToMove) {
            const fullPathParts = findNodePath(nodeId);
            if (fullPathParts) {
                const parentPath = fullPathParts.slice(0, -1).join('/');
                const filesToDelete = collectFilePaths(nodeToMove, parentPath);
                setPendingDeletions(prev => {
                    const next = new Set(prev);
                    filesToDelete.forEach(p => next.add(p));
                    return next;
                });
            }
        }

        const node = await getNode(nodeId);
        if (!node) return;

        await putNode({ ...node, parentId: targetParentId, is_synced: false });
        await refreshFileTree(); 
    }, [fileTree, collectFilePaths, refreshFileTree]);

    const applyAiChanges = useCallback(async (changes: AIChange[]) => {
      for (const change of changes) {
        const path = change.file.replace(/^\//, ''); 
        const pathParts = path.split('/').filter(p => p.trim() !== '');
        
        if (pathParts.length === 0) continue;

        const isExplicitFolder = change.file.trim().endsWith('/');

        if (isExplicitFolder) {
             let currentParentId = 'root';
             for (const folderName of pathParts) {
                 let childNode = await findChildNode(currentParentId, folderName);
                 if (!childNode) {
                     const newFolder = await addNode(currentParentId, folderName, 'folder');
                     currentParentId = newFolder.id;
                 } else {
                     currentParentId = childNode.id;
                 }
             }
             continue;
        }

        const fileName = pathParts.pop()!;
        const folderPath = pathParts;
        
        let currentParentId = 'root'; 
        let pathExists = true;

        for (const folderName of folderPath) {
            let childNode = await findChildNode(currentParentId, folderName);
            if (!childNode) {
                if (change.delete) {
                    pathExists = false;
                    break;
                }
                const newFolder = await addNode(currentParentId, folderName, 'folder');
                currentParentId = newFolder.id;
            } else {
                currentParentId = childNode.id;
            }
        }

        if (!pathExists && change.delete) continue;

        const fileNode = await findChildNode(currentParentId, fileName);
        
        if (change.delete) {
            if (fileNode) {
                await deleteNode(fileNode.id);
            }
        } else {
            if (fileNode) {
                await updateFileContentById(fileNode.id, change.content);
            } else {
                const newFile = await addNode(currentParentId, fileName, 'file');
                await updateFileContentById(newFile.id, change.content);
            }
        }
      }
      await refreshFileTree();
    }, [addNode, deleteNode, updateFileContentById, refreshFileTree]);

    const clearAllHistory = useCallback(async () => {
      const allNodes = await getAllNodes();
      const updatedNodes: StoredFileNode[] = [];
      for(const node of allNodes) {
          if (node.type === 'file') {
              const currentVersion: Version = {
                  id: crypto.randomUUID(),
                  content: node.content || '',
                  timestamp: new Date().toISOString()
              };
              updatedNodes.push({ ...node, history: [currentVersion] });
          } else {
              updatedNodes.push(node);
          }
      }
      await putNodes(updatedNodes);
      await refreshFileTree();
    }, [refreshFileTree]);

    const value = {
        fileTree, activeFileId, activeFile, activeFileContent, totalVersions,
        updateActiveFileContent, revertToVersion, openFile, closeFile, addNode,
        deleteNode, renameNode, duplicateNode, moveNode, findNodePath,
        refreshFileTree, updateFileContentById, applyAiChanges, clearAllHistory,
        pendingDeletions, clearPendingDeletions
    };
    
    if (isInitializing) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <span className="text-gray-700 font-medium">{statusMessage}</span>
                <span className="text-gray-500 text-sm mt-2">Please wait...</span>
            </div>
        );
    }

    return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};
