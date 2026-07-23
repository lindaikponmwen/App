import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Code } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'code' | 'preview';
  onToggle: (mode: 'code' | 'preview') => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onToggle }) => {
  return (
    <div className="flex items-center p-0.5 bg-gray-200 rounded-lg">
      <motion.button
        onClick={() => onToggle('preview')}
        className={`w-10 h-8 rounded-md flex items-center justify-center transition-colors duration-200 group relative text-sm font-medium ${
          viewMode === 'preview' ? 'bg-white shadow-sm' : 'bg-transparent'
        }`}
        title="Preview"
        aria-pressed={viewMode === 'preview'}
      >
        <Eye className={`w-5 h-5 ${viewMode === 'preview' ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
      </motion.button>
      <motion.button
        onClick={() => onToggle('code')}
        className={`w-10 h-8 rounded-md flex items-center justify-center transition-colors duration-200 group relative text-sm font-medium ${
          viewMode === 'code' ? 'bg-white shadow-sm' : 'bg-transparent'
        }`}
        title="Code"
        aria-pressed={viewMode === 'code'}
      >
        <Code className={`w-5 h-5 ${viewMode === 'code' ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
      </motion.button>
    </div>
  );
};

export default ViewModeToggle;
