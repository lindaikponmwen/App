
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ProjectNotFoundModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  projectId: string | null;
}

const ProjectNotFoundModal: React.FC<ProjectNotFoundModalProps> = ({ isOpen, onConfirm, projectId }) => {
  if (!isOpen) return null;

  const title = "Project Not Loaded";
  const message = projectId
    ? `The project with ID "${projectId}" could not be found, or you may not have access.`
    : "No project ID was provided in the URL.";
  const fallbackMessage = "You can proceed with a sample mock project to explore the application's features. Please note that any changes made to the mock project will not be saved to the cloud.";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600 mt-1">{message}</p>
            </div>
          </div>
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">{fallbackMessage}</p>
          </div>
        </div>
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end">
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm transition-colors"
          >
            Proceed with Mock Project
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectNotFoundModal;
