
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Cloud, UploadCloud, Check, Loader2, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { useFiles, FileNode } from '../contexts/FileContext';
import { useSettings } from '../contexts/SettingsContext';
import { syncProject, updateProjectSyncHash } from '../services/s3Service';
import { motion, AnimatePresence } from 'framer-motion';
import { currentProject } from '../data/appConfig';

const SYNC_FOLDERS = [
  'Posters', 'Talks', 'Abstracts', 'Results', 'Final Reports', 
  'Final Plan', 'Initial Reports', 'Initial Plan', 'Scripts',
  'Data','Models','My Workflows'
];

export default function S3SyncPanel() {
  const { fileTree, refreshFileTree, pendingDeletions, clearPendingDeletions } = useFiles();
  const { settings } = useSettings();
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentMessage: '' });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Flatten the file tree to find eligible unsynced files
  const unsyncedFiles = useMemo(() => {
    const collectedFiles: (FileNode & { path: string })[] = [];
    
    // Helper to determine if we are inside a target root folder
    const traverse = (node: FileNode, parentPath: string, insideTargetFolder: boolean) => {
      let isTarget = insideTargetFolder;
      if (!isTarget && SYNC_FOLDERS.includes(node.name)) {
        isTarget = true;
      }

      if (node.type === 'file') {
        // We only sync files in specific folders that are marked as NOT synced
        if (isTarget && !node.is_synced) {
          collectedFiles.push({ ...node, path: parentPath }); // path without filename
        }
      } else if (node.type === 'folder' && node.children) {
        // Accumulate path for children
        const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
        node.children.forEach(child => traverse(child, currentPath, isTarget));
      }
    };

    if (fileTree.children) {
        fileTree.children.forEach(child => traverse(child, '', false));
    }
    
    return collectedFiles;
  }, [fileTree]);

  // Filter deletions to only include those that were likely synced (in SYNC_FOLDERS)
  const syncableDeletions = useMemo(() => {
      return Array.from(pendingDeletions).filter(path => {
          const rootFolder = path.split('/')[0];
          return SYNC_FOLDERS.includes(rootFolder);
      });
  }, [pendingDeletions]);

  const hasChanges = unsyncedFiles.length > 0 || syncableDeletions.length > 0;

  const handleSync = async (silent = false) => {
    if (!hasChanges) return;
    
    setIsSyncing(true);
    
    try {
      await syncProject(
          unsyncedFiles, 
          syncableDeletions, 
          settings.s3FolderPrefix, 
          (current, total, message) => {
            setProgress({ current, total, currentMessage: message });
          }
      );

      // Generate a new random hash for this sync event
      const newSyncHash = crypto.randomUUID();
      
      // Update Database via API
      await updateProjectSyncHash(currentProject.id, newSyncHash);
      
      // Update LocalStorage
      const storageKey = `drlevey_sync_hash_${currentProject.id}`;
      localStorage.setItem(storageKey, newSyncHash);
      
      setLastSyncTime(new Date());
      
      // Cleanup
      clearPendingDeletions();
      await refreshFileTree();
      
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Refs for auto-sync logic to avoid dependency loops in useEffect
  const hasChangesRef = useRef(hasChanges);
  const isSyncingRef = useRef(isSyncing);
  const handleSyncRef = useRef(handleSync);

  useEffect(() => {
    hasChangesRef.current = hasChanges;
    isSyncingRef.current = isSyncing;
  }, [hasChanges, isSyncing]);

  useEffect(() => {
    handleSyncRef.current = handleSync;
  }, [handleSync]);

  useEffect(() => {
    if (!settings.autoSync) return;

    // Auto-sync checks periodically
    const intervalMs = settings.autoSyncInterval * 60 * 1000;
    const intervalId = setInterval(() => {
      // Only trigger if there are actual changes (new/modified/deleted) and not currently syncing
      if (hasChangesRef.current && !isSyncingRef.current) {
        console.log('Triggering auto-sync for changed files...');
        handleSyncRef.current(true); // Silent sync
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [settings.autoSync, settings.autoSyncInterval]);

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 text-sm flex items-center">
          <Cloud className="w-4 h-4 mr-2 text-blue-600" />
          Sync Status
        </h3>
        <div className="text-xs text-gray-500">
            {lastSyncTime ? `Last synced: ${lastSyncTime.toLocaleTimeString()}` : 'Not synced recently'}
        </div>
      </div>

      <div className="p-4">
        {isSyncing ? (
            <div className="space-y-4">
                <div className="flex items-center justify-center text-blue-600 py-2">
                    <Loader2 className="w-6 h-6 animate-spin mr-3" />
                    <span className="font-medium text-sm">Syncing to S3...</span>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Progress</span>
                        <span>{progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                        />
                    </div>
                    <div className="text-xs text-gray-500 truncate pt-1 font-mono">
                        {progress.currentMessage || 'Preparing...'}
                    </div>
                </div>
            </div>
        ) : hasChanges ? (
            <div className="space-y-4">
                <div className="flex items-start p-3 bg-amber-50 border border-amber-100 rounded-md">
                    <AlertCircle className="w-5 h-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">Changes detected</p>
                        <p className="text-xs text-amber-600 mt-1">
                            {unsyncedFiles.length + syncableDeletions.length} item(s) need to be synced.
                        </p>
                    </div>
                </div>

                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-md bg-gray-50 p-2 text-xs space-y-1">
                    {unsyncedFiles.map((f, i) => (
                        <div key={`up-${i}`} className="flex items-center text-gray-600">
                            <UploadCloud className="w-3 h-3 mr-2 text-blue-500" />
                            <span className="truncate">{f.path}/{f.name}</span>
                        </div>
                    ))}
                    {syncableDeletions.map((path, i) => (
                        <div key={`del-${i}`} className="flex items-center text-gray-600">
                            <Trash2 className="w-3 h-3 mr-2 text-red-500" />
                            <span className="truncate line-through">{path}</span>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => handleSync(false)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                </button>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-4 text-gray-500">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                    <Check className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-800">All files are up to date</p>
                <p className="text-xs text-gray-400 mt-1">
                    {settings.autoSync 
                        ? `Auto-sync enabled (${settings.autoSyncInterval} min)` 
                        : "Auto-sync is disabled"}
                </p>
            </div>
        )}
      </div>
    </div>
  );
}
