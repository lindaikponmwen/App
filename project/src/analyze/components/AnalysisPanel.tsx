import React from 'react';
import { FileNode } from '../../contexts/FileContext';
import ModelRunPanel from './ModelRunPanel';
import ScriptRunPanel from './ScriptRunPanel';
import ResultsViewerPanel from './ResultsViewerPanel';

interface AnalysisPanelProps {
  onClose: () => void;
  activeFile: FileNode | null;
  activeFileFolder: string | null;
  onFileNameChange?: (newName: string) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ onClose, activeFile, activeFileFolder, onFileNameChange }) => {
  const folder = activeFileFolder?.toLowerCase();
  switch (folder) {
    case 'models':
      return <ModelRunPanel onClose={onClose} activeFile={activeFile} onFileNameChange={onFileNameChange} />;
    case 'scripts':
      return <ScriptRunPanel onClose={onClose} activeFile={activeFile} />;
    case 'results':
      return <ResultsViewerPanel onClose={onClose} activeFile={activeFile} />;
    default:
      // This case should ideally not be hit if the button is disabled correctly
      return (
          <div className="flex items-center justify-center h-full text-center text-gray-500">
              <p>No analysis available for this file type.</p>
          </div>
      );
  }
};

export default AnalysisPanel;
