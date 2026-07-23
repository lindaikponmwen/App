import React from 'react';
import { motion } from 'framer-motion';
import { X, History, GitCompareArrows, CornerUpLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FileNode, Version } from '../contexts/FileContext';

interface VersionHistoryPanelProps {
  activeFile: FileNode | null;
  onClose: () => void;
  onCompare: (version: Version) => void;
  onRevert: (versionId: string) => void;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ activeFile, onClose, onCompare, onRevert }) => {
  const sortedHistory = [...(activeFile?.history || [])].reverse();

  return (
    <motion.div
      className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col"
      {...{
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      } as any}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Version History</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      <div className="p-2 text-sm text-center border-b border-gray-200 dark:border-gray-700">
        <p className="font-medium text-gray-700 dark:text-gray-200 truncate">{activeFile?.name}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sortedHistory.length > 0 ? (
          <ul>
            {sortedHistory.map((version, index) => (
              <li key={version.id} className="border-b border-gray-200 dark:border-gray-700 p-3 group">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {formatDistanceToNow(new Date(version.timestamp), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(version.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {index > 0 && ( // Don't show actions for the current version
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button title="Compare with current" onClick={() => onCompare(version)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        <GitCompareArrows className="w-4 h-4 text-blue-500" />
                      </button>
                      <button title="Revert to this version" onClick={() => onRevert(version.id)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CornerUpLeft className="w-4 h-4 text-green-500" />
                      </button>
                    </div>
                  )}
                </div>
                 {index === 0 && <span className="text-xs font-semibold text-blue-500 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full mt-2 inline-block">Current</span>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            <p>No version history available for this file.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default VersionHistoryPanel;