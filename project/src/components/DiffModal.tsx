import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiffEditor } from '@monaco-editor/react';
import { X, CheckCircle, GitCompareArrows, ChevronsUpDown } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useFiles, FileNode, Version } from '../contexts/FileContext';
import { getLanguageForExtension } from '../editor/utils';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalFile: FileNode | null;
  comparisonVersion?: Version | null;
}

const findFileById = (nodes: FileNode[], fileId: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === fileId) {
        return node;
      }
      if (node.children) {
        const found = findFileById(node.children, fileId);
        if (found) return found;
      }
    }
    return null;
  };

const DiffModal: React.FC<DiffModalProps> = ({ isOpen, onClose, originalFile, comparisonVersion }) => {
  const { settings } = useSettings();
  const { fileTree } = useFiles();
  const [modifiedFileId, setModifiedFileId] = useState<string>('');

  const modifiedFile = useMemo(() => {
    if (!modifiedFileId) return null;
    return findFileById(fileTree.children || [], modifiedFileId);
  }, [modifiedFileId, fileTree]);

  const flattenedFiles = useMemo(() => {
    const allFiles: (FileNode & { path: string })[] = [];
    const relevantFolders = ['Data', 'Models', 'Scripts', 'Results', 'Initial Plan', 'Final Plan', 'Initial Reports', 'Final Reports', 'Abstracts', 'Posters', 'Talks'];

    const traverseWithPaths = (nodes: FileNode[], path: string) => {
        for (const node of nodes) {
            const newPath = path ? `${path} / ${node.name}` : node.name;
            if (node.type === 'file') {
                allFiles.push({ ...node, path: newPath });
            }
            if (node.children) {
                traverseWithPaths(node.children, newPath);
            }
        }
    };
    
    const foldersToScan = fileTree.children?.filter(node => 
        node.type === 'folder' && relevantFolders.includes(node.name)
    ) || [];

    for (const folder of foldersToScan) {
        if(folder.children) {
            traverseWithPaths(folder.children, folder.name);
        }
    }

    return allFiles.filter(file => file.id !== originalFile?.id);
  }, [fileTree, originalFile]);
  
  useEffect(() => {
    if (isOpen) {
      setModifiedFileId('');
    }
  }, [isOpen, comparisonVersion]);

  const originalContent = comparisonVersion ? comparisonVersion.content : originalFile?.content || '';
  const modifiedContent = comparisonVersion ? originalFile?.content || '' : modifiedFile?.content || '';
  
  const areFilesIdentical = originalContent === modifiedContent && (!!comparisonVersion || !!modifiedFile);

  const theme = settings.theme === 'dark' ? 'vs-dark' : 'vs';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex flex-col"
          {...{
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 }
          } as any}
        >
          <div className="bg-white dark:bg-gray-800 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{comparisonVersion ? 'Compare Version' : 'Compare Files'}</h2>
            <div className="flex items-center space-x-4">
                {(modifiedFile || comparisonVersion) && (
                     <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                        areFilesIdentical 
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                     }`}>
                        {areFilesIdentical ? <CheckCircle className="w-5 h-5" /> : <GitCompareArrows className="w-5 h-5" />}
                        <span>{areFilesIdentical ? 'Identical' : 'Differences Found'}</span>
                    </div>
                )}
              <motion.button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                {...{ whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 } } as any}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
          
          {comparisonVersion ? (
             <div className="bg-gray-50 dark:bg-gray-900 p-4 flex items-center space-x-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comparing Version from</label>
                    <div className="mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 font-mono text-sm truncate">
                        {new Date(comparisonVersion.timestamp).toLocaleString()}
                    </div>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">With Current Version</label>
                    <div className="mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 font-mono text-sm truncate">
                        {originalFile?.name || 'No file selected'}
                    </div>
                </div>
             </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 flex items-center space-x-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Original File (Current)</label>
                    <div className="mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 font-mono text-sm truncate">{originalFile?.name || 'No file selected'}</div>
                </div>
                <div className="flex-1">
                    <label htmlFor="compare-file-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Compare With</label>
                    <div className="relative mt-1">
                        <select
                            id="compare-file-select"
                            value={modifiedFileId}
                            onChange={(e) => setModifiedFileId(e.target.value)}
                            className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a file to compare...</option>
                            {flattenedFiles.map(file => (
                                <option key={file.id} value={file.id}>{file.path}</option>
                            ))}
                        </select>
                        <ChevronsUpDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>
          )}
          
          <div className="flex-1 overflow-hidden">
            <DiffEditor
              height="100%"
              original={originalContent}
              modified={modifiedContent}
              language={getLanguageForExtension(originalFile?.extension)}
              theme={theme}
              options={{
                ...settings,
                readOnly: true,
                renderSideBySide: true,
                // FIX: Monaco editor expects 'on' or 'off' for wordWrap, not a boolean.
                wordWrap: settings.wordWrap ? 'on' : 'off',
                // FIX: Monaco editor expects 'on' or 'off' for lineNumbers, not a boolean.
                lineNumbers: settings.lineNumbers ? 'on' : 'off',
                // FIX: Monaco editor expects bracketPairColorization and minimap options as objects.
                bracketPairColorization: { enabled: settings.bracketPairColorization },
                minimap: { enabled: settings.showMinimap },
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiffModal;