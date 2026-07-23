import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Archive, Folder, FileText, Loader2 } from 'lucide-react';

const formatFileSize = (bytes: number): string => {
  if (bytes === undefined || isNaN(bytes)) return '0 Bytes';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface ProjectStats {
  files: number;
  folders: number;
  totalSize: number;
}

interface ProjectDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  stats: ProjectStats;
}

const ProjectDownloadModal: React.FC<ProjectDownloadModalProps> = ({ isOpen, onClose, onConfirm, stats }) => {
  const [isZipping, setIsZipping] = useState(false);

  const handleConfirm = async () => {
    setIsZipping(true);
    await onConfirm();
    setIsZipping(false);
    onClose();
  };
  
  const handleClose = () => {
    if (isZipping) return;
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="download-modal-title">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-xl p-8 w-full max-w-lg shadow-2xl relative"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full"
              aria-label="Close dialog"
              disabled={isZipping}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Archive className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 id="download-modal-title" className="text-xl font-bold text-gray-900">Download Project Archive</h2>
                <p className="text-gray-500 mt-1">This will create a .zip file of the entire project.</p>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Archive will contain:</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <Folder className="w-6 h-6 mx-auto text-gray-500 mb-1" />
                        <p className="font-semibold text-lg text-gray-800">{stats.folders}</p>
                        <p className="text-xs text-gray-500">Folders</p>
                    </div>
                     <div>
                        <FileText className="w-6 h-6 mx-auto text-gray-500 mb-1" />
                        <p className="font-semibold text-lg text-gray-800">{stats.files}</p>
                        <p className="text-xs text-gray-500">Files</p>
                    </div>
                     <div>
                        <p className="font-semibold text-lg text-gray-800 mt-2">{formatFileSize(stats.totalSize)}</p>
                        <p className="text-xs text-gray-500">Total Size</p>
                    </div>
                </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-8">
              The project files will be compressed into a single .zip archive. This may take a moment depending on the project size.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                disabled={isZipping}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isZipping}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait flex items-center justify-center min-w-[120px]"
              >
                {isZipping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Zipping...</span>
                  </>
                ) : (
                  'Proceed'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProjectDownloadModal;