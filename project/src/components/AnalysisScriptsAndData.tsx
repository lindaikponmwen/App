
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { 
  Save,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  GitCompareArrows,
  History,
  Info,
  Cpu,
  BarChart
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getEditorTheme, getLanguageForExtension } from '../editor/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useFiles, Version, FileNode } from '../contexts/FileContext';
import FileTree from './FileTree';
import CsvEditor from '../plugin/csv/CsvEditor';
import DiffModal from './DiffModal';
import VersionHistoryPanel from './VersionHistoryPanel';
import HelpPanel from '../analyze/components/HelpPanel';
import AnalysisPanel from '../analyze/components/AnalysisPanel';
import { PDFViewer } from './PDFViewer';
import { pageShortTitles } from '../data/pageTitles';
import ViewModeToggle from './ui/ViewModeToggle';
import MarkdownViewer from '../plugin/markdown/MarkdownViewer';
import AIPanel from './AIPanel';

const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileTypeDescription = (extension?: string): string => {
    if (!extension) return 'File';
    switch (extension.toLowerCase()) {
        case 'mod': return 'NONMEM Model File';
        case 'ctl': return 'NONMEM Control File';
        case 'r': return 'R Script';
        case 'md': return 'Markdown Document';
        case 'csv': return 'CSV Data File';
        case 'pdf': return 'PDF Document';
        case 'txt': return 'Text File';
        default: return `${extension.toUpperCase()} File`;
    }
};

export default function AnalysisScriptsAndData() {
  const { settings } = useSettings();
  const { 
    fileTree,
    activeFile, 
    activeFileContent, 
    updateActiveFileContent,
    revertToVersion,
    findNodePath,
  } = useFiles();
  
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);
  const [comparisonVersion, setComparisonVersion] = useState<Version | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  useEffect(() => {
    setViewMode('code');
  }, [activeFile?.id]);

  const rootFolders = useMemo(() => ['Data', 'Models', 'Scripts', 'Results'], []);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadActiveFile = () => {
    if (activeFile && activeFileContent !== null) {
      downloadFile(activeFileContent, activeFile.name, 'text/plain;charset=utf-8;');
    }
  };

  const handleInsertSnippet = (code: string) => {
    updateActiveFileContent(activeFileContent + '\n' + code);
    setIsHelpPanelOpen(false);
  };

  const activeFileFolder = useMemo(() => {
    if (!activeFile) return null;
    const path = findNodePath(activeFile.id);
    return path && path.length > 1 ? path[0] : null;
  }, [activeFile, findNodePath]);

  const isDatasetFile = useMemo(() => activeFile && activeFileFolder === 'Data', [activeFile, activeFileFolder]);

  const handleVisualize = () => {
    if (activeFile) {
      window.open(`/dataexplore/?d=${activeFile.db_id}`, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    // When a file from the data or results folder is opened,
    // automatically close the analysis panel. This provides a cleaner view
    // for non-executable file types, while still allowing the user to
    // explicitly open the panel for 'results' files if they wish to.
    if (activeFileFolder && ['Data', 'Results'].includes(activeFileFolder)) {
      setIsAnalysisPanelOpen(false);
    }
  }, [activeFileFolder]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setSidebarWidth(Math.max(240, Math.min(800, startWidth + delta)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const language = getLanguageForExtension(activeFile?.extension);
  const theme = getEditorTheme(language, settings.theme);

  const isAnalyzable = activeFile && activeFile.extension !== 'md' && activeFileFolder && ['Models', 'Scripts', 'Results'].includes(activeFileFolder);

  return (
        <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 flex overflow-hidden">
            <AnimatePresence initial={false}>
            {isSidebarVisible && (
                <motion.div
                className="bg-white border-r border-gray-200 flex flex-col overflow-hidden relative"
                {...{
                    initial: { width: 0, opacity: 0 },
                    animate: { width: sidebarWidth, opacity: 1 },
                    exit: { width: 0, opacity: 0, borderRightWidth: 0 },
                    transition: isResizing ? { duration: 0, ease: 'linear' } : { duration: 0.3, ease: 'easeInOut' }
                } as any}
                >
                    <FileTree
                        rootNode={fileTree}
                        filterRootFolders={rootFolders}
                        defaultAddParentId="models"
                        title={`${pageShortTitles['/analysis']} files`}
                    />
                    <div
                      className="absolute top-0 -right-1 w-2 h-full cursor-col-resize z-10 group"
                      onMouseDown={handleMouseDown}
                    >
                      <div className="w-0.5 h-full bg-transparent group-hover:bg-blue-400 transition-colors duration-200 mx-auto"></div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
            <div className="flex-1 flex flex-col">
            <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-4">
                <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 truncate">{activeFile?.name}</span>
                {activeFile && activeFile.type === 'file' && activeFile.size !== undefined && activeFile.lastModified && (
                    <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-500 ml-4">
                    <span>{getFileTypeDescription(activeFile.extension)}</span>
                    <span className="text-gray-300">·</span>
                    <span>{formatFileSize(activeFile.size)}</span>
                    <span className="text-gray-300">·</span>
                    <span>
                        Updated {formatDistanceToNow(new Date(activeFile.lastModified), { addSuffix: true })}
                    </span>
                    </div>
                )}
                </div>

                <div className="flex items-center space-x-2">
                    <motion.button
                        onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title={isSidebarVisible ? 'Hide Files Panel' : 'Show Files Panel'}
                    >
                        {isSidebarVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </motion.button>
                    <motion.button onClick={handleDownloadActiveFile} title="Download File" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" disabled={!activeFile}>
                        <Download className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        onClick={() => setIsDiffModalOpen(true)}
                        disabled={!activeFile}
                        title="Compare File"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GitCompareArrows className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        onClick={() => setIsHistoryPanelOpen(true)}
                        disabled={!activeFile}
                        title="Version History"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <History className="w-4 h-4" />
                    </motion.button>
                     {activeFile?.extension === 'md' && (
                        <ViewModeToggle viewMode={viewMode} onToggle={setViewMode} />
                     )}
                     <motion.button
                        onClick={() => setIsHelpPanelOpen(true)}
                        title="Help Center"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Info className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        title={settings.autoSave ? 'Auto-save is enabled' : 'Save File'}
                        disabled={settings.autoSave || !activeFile}
                        className="p-2 rounded-lg transition-colors text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                    </motion.button>
                    {isDatasetFile ? (
                        <motion.button
                            onClick={handleVisualize}
                            disabled={!activeFile}
                            className="flex items-center space-x-2 px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            title="Visualize dataset"
                        >
                            <BarChart className="w-4 h-4" />
                            <span className="text-sm font-medium">Visualize</span>
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={() => setIsAnalysisPanelOpen(prev => !prev)}
                            disabled={!isAnalyzable}
                            className="flex items-center space-x-2 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Cpu className="w-4 h-4" />
                            <span className="text-sm font-medium">Analyze</span>
                        </motion.button>
                    )}
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-hidden relative">
                        <div className="absolute inset-0">
                        {activeFile ? (
                            <>
                              {activeFile.extension === 'md' && viewMode === 'preview' ? (
                                <MarkdownViewer content={activeFileContent} />
                              ) : activeFile.extension === 'pdf' ? (
                                <PDFViewer file={activeFile} />
                              ) : ['csv', 'xls', 'xpt'].includes(activeFile.extension || '') ? (
                                <CsvEditor 
                                  content={activeFileContent} 
                                  onContentChange={updateActiveFileContent}
                                  theme={settings.theme}
                                />
                              ) : (
                                <Editor
                                  height="100%"
                                  language={language}
                                  value={activeFileContent}
                                  onChange={(value) => updateActiveFileContent(value || '')}
                                  theme={theme}
                                  options={{
                                      ...settings,
                                      wordWrap: settings.wordWrap ? 'on' : 'off',
                                      lineNumbers: settings.lineNumbers ? 'on' : 'off',
                                      minimap: { enabled: settings.showMinimap },
                                      bracketPairColorization: { enabled: settings.bracketPairColorization },
                                      scrollBeyondLastLine: settings.scrollBeyondLastLine,
                                      automaticLayout: true,
                                      padding: { top: 16, bottom: 16 },
                                  }}
                                  key={activeFile.id}
                                />
                              )}
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white text-gray-500 select-none">
                                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium">No file selected</h3>
                                <p className="text-sm">Select a file from the explorer to view or edit its content.</p>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
                <motion.div
                    className="bg-gray-50 z-10 shadow-lg border-l border-gray-200 flex flex-col"
                    style={{ overflow: 'hidden' }}
                    {...{
                        initial: false,
                        animate: { width: isAnalysisPanelOpen ? '50%' : '0%' },
                        transition: { type: 'spring', stiffness: 300, damping: 30 }
                    } as any}
                >
                    <AnalysisPanel
                        onClose={() => setIsAnalysisPanelOpen(false)}
                        activeFile={activeFile}
                        activeFileFolder={activeFileFolder}
                    />
                </motion.div>
                <AnimatePresence>
                {isHistoryPanelOpen && activeFile && (
                    <VersionHistoryPanel
                    activeFile={activeFile}
                    onClose={() => setIsHistoryPanelOpen(false)}
                    onCompare={(version) => {
                        setComparisonVersion(version);
                        setIsDiffModalOpen(true);
                    }}
                    onRevert={(versionId) => revertToVersion(versionId)}
                    />
                )}
                </AnimatePresence>
            </div>
            </div>
        </div>
        <AIPanel defaultAgentName="Coding Co-pilot" />
        <DiffModal
            isOpen={isDiffModalOpen}
            onClose={() => {
            setIsDiffModalOpen(false);
            setComparisonVersion(null);
            }}
            originalFile={activeFile}
            comparisonVersion={comparisonVersion}
        />
        <HelpPanel
            isOpen={isHelpPanelOpen}
            onClose={() => setIsHelpPanelOpen(false)}
            onInsertSnippet={handleInsertSnippet}
        />
    </div>
  );
}
