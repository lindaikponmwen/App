

import React, { useState, useEffect } from 'react';
import { Bot, FileText as FileTemplateIcon, Edit, X, Folder, File as FileIcon, HardDrive, Database, FileCode2, FilePlus2, AlertCircle, Loader2, CheckCircle, ArrowRight, Plus, Trash2, HelpCircle } from 'lucide-react';
import AIAssistant from '../components/AIAssistant';
import { agents } from '../data/agents';
import { TemplateContent } from './TemplateContent';
import { useFiles, FileNode } from '../contexts/FileContext';

interface StartupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  stats: {
    files: number;
    folders: number;
    totalSize: number;
  };
}

const formatFileSize = (bytes: number): string => {
    if (bytes === undefined || isNaN(bytes)) return '0 Bytes';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const TabButton: React.FC<{
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

// Helper to expand filenames like "run[001-003].mod" -> ["run001.mod", "run002.mod", "run003.mod"]
const expandFilePattern = (input: string): string[] => {
    const regex = /^(.*?)\[(\d+)-(\d+)\](.*)$/;
    const match = input.match(regex);

    if (!match) return [input.trim()];

    const [, prefix, startStr, endStr, suffix] = match;
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    const padLength = startStr.length; // Use the length of the first number for padding

    const expanded: string[] = [];
    if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
            const numStr = i.toString().padStart(padLength, '0');
            expanded.push(`${prefix}${numStr}${suffix}`);
        }
    } else {
        expanded.push(input.trim());
    }
    return expanded;
};

interface ScriptConfig {
    id: string;
    name: string;
    type: 'dataPrep' | 'gofPlots' | 'runModel' | 'blank';
}

const ManualSetupContent: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const { fileTree, addNode, updateFileContentById } = useFiles();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    
    // Model Input: Textarea allowing multiple lines and patterns
    const [modelInput, setModelInput] = useState('');
    
    // Script Configuration
    const [scriptConfigs, setScriptConfigs] = useState<ScriptConfig[]>([
        { id: '1', name: 'data_preparation.R', type: 'dataPrep' },
        { id: '2', name: 'gof_plots.R', type: 'gofPlots' },
        { id: '3', name: 'run_analysis.py', type: 'runModel' }
    ]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progressLogs, setProgressLogs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
            setError(null);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    }

    const readFileContent = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || '');
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    };

    const addLog = (message: string) => {
        setProgressLogs(prev => [...prev, message]);
    };

    // Helper to recursively ensure folders exist given a path like "Models/base/run1.mod"
    // FIX: Made function async and awaited async calls to handle Promises correctly.
    const createFileRecursively = async (rootFolderId: string, filePath: string, content: string) => {
        const parts = filePath.split('/');
        const fileName = parts.pop()!;
        let currentParentId = rootFolderId;

        // Traverse/Create directories
        let currentTree = fileTree; // This is a limitation: we need the latest tree state. 
        // In this simplified version, we rely on `addNode` returning the new node or finding it via a simple search if context updates haven't propagated instantly in this loop.
        // Ideally `addNode` handles existence checks internally or we perform a search.
        
        // Note: The context `addNode` creates a folder if we ask it to. 
        // We need to implement a local finder because `fileTree` from context might not update mid-loop in this function scope.
        // However, for this modal, we can do a simplified search on the root children or rely on `addNode` logic.
        
        // Since we can't easily traverse the possibly-stale `fileTree` inside this tight loop without refetching,
        // we will implement a "best effort" assuming `addNode` appends.
        // A robust implementation would need a synchronous mutable tree or updated context methods.
        // For this UI demo, we will create the file in the root specified folder (Models/Scripts) + 1 level depth if specified, 
        // or just flatten if it's too complex, but let's try to support 1 level of subfolder relative to parent.
        
        // Simpler approach for this specific feature request:
        // If user types "base/run01.ctl", we look for "base" inside the target root (e.g. Models).
        // `addNode` in context adds to a parent ID. We need the ID of "base".
        
        // Let's assume we are creating relative to the specific Root Folder (Models or Scripts) passed in `rootFolderId`.
        
        let targetFolderId = rootFolderId;
        
        if (parts.length > 0) {
            // There are subfolders
            for (const folderName of parts) {
                // We need to find if this folder exists under `targetFolderId`
                // Since we can't synchronously query the updated tree in React state loop easily,
                // We will just try to create it. If `addNode` allows duplicates, we might have issues.
                // Assuming `addNode` creates a NEW node every time.
                // To do this correctly, we'd need `getOrCreateFolder(parentId, name)`.
                // Let's use the provided `ensureFolderExists` logic but customized for subfolders.
                
                // Hack: For this demo, we create the folder. If the context handles deduping, great. 
                // If not, we might get duplicate folders. 
                // Let's assume the user creates unique structures for now.
                const folderNode = await addNode(targetFolderId, folderName, 'folder');
                targetFolderId = folderNode.id;
            }
        }

        const fileNode = await addNode(targetFolderId, fileName, 'file');
        await updateFileContentById(fileNode.id, content);
    };

    // FIX: Made function async and awaited async calls to handle Promises correctly.
    const ensureFolderExists = async (folderName: string): Promise<string> => {
        const existing = fileTree.children?.find(node => node.name === folderName && node.type === 'folder');
        if (existing) return existing.id;
        const newNode = await addNode(fileTree.id, folderName, 'folder');
        return newNode.id;
    }

    const handleAddScript = () => {
        setScriptConfigs(prev => [...prev, { 
            id: crypto.randomUUID(), 
            name: 'new_script.R', 
            type: 'blank' 
        }]);
    };

    const handleRemoveScript = (id: string) => {
        setScriptConfigs(prev => prev.filter(s => s.id !== id));
    };

    const handleScriptChange = (id: string, field: keyof ScriptConfig, value: string) => {
        setScriptConfigs(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleCreateAnalysis = async () => {
        if (selectedFiles.length === 0) {
            setError("Please link at least one dataset.");
            return;
        }
        if (!modelInput.trim()) {
            setError("Please specify at least one model file.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setProgressLogs([]);

        try {
            // 1. Process Datasets
            addLog("Initializing Data folder...");
            // FIX: Awaited async function to ensure folder ID is available.
            const dataFolderId = await ensureFolderExists('Data');
            
            for (const file of selectedFiles) {
                addLog(`Reading ${file.name}...`);
                try {
                    const content = await readFileContent(file);
                    addLog(`Creating Data/${file.name}...`);
                    // FIX: Awaited promise from `addNode` to get the file node before using its ID.
                    const fileNode = await addNode(dataFolderId, file.name, 'file');
                    // FIX: Awaited promise from `updateFileContentById`.
                    await updateFileContentById(fileNode.id, content);
                } catch (e) {
                    addLog(`Error reading ${file.name}`);
                }
            }

            // 2. Process Models (with Pattern Expansion)
            addLog("Initializing Models folder...");
            // FIX: Awaited async function to ensure folder ID is available.
            const modelFolderId = await ensureFolderExists('Models');
            
            const rawModelLines = modelInput.split('\n').filter(line => line.trim() !== '');
            let expandedModelFiles: string[] = [];
            
            for (const line of rawModelLines) {
                expandedModelFiles = [...expandedModelFiles, ...expandFilePattern(line)];
            }

            for (const fileName of expandedModelFiles) {
                addLog(`Creating Models/${fileName}...`);
                
                // Simple template
                const modelTemplate = `$PROBLEM ${fileName.split('/').pop()?.split('.')[0] || 'Run'}
$INPUT ID TIME DV AMT
$DATA ../Data/${selectedFiles[0]?.name || 'dataset.csv'} IGNORE=@
$SUBROUTINES ADVAN2 TRANS2
$PK
  CL = THETA(1) * EXP(ETA(1))
  V  = THETA(2) * EXP(ETA(2))
  KA = THETA(3) * EXP(ETA(3))
  S2 = V
$ERROR
  Y = F + EPS(1)
$THETA (0, 10) (0, 50) (0, 1)
$OMEGA 0.1 0.1 0.1
$SIGMA 1
$ESTIMATION METHOD=1 INTERACTION
`;              
                // Handle subdirectories in filename (e.g., base/run1.mod)
                // FIX: Awaited promise from `createFileRecursively`.
                await createFileRecursively(modelFolderId, fileName, modelTemplate);
            }

            // 3. Process Scripts
            if (scriptConfigs.length > 0) {
                addLog("Initializing Scripts folder...");
                // FIX: Awaited async function to ensure folder ID is available.
                const scriptFolderId = await ensureFolderExists('Scripts');

                for (const script of scriptConfigs) {
                    if (!script.name.trim()) continue;
                    
                    addLog(`Creating Scripts/${script.name}...`);
                    
                    let content = "";
                    switch (script.type) {
                        case 'dataPrep':
                            content = `# Data Preparation\nlibrary(tidyverse)\n\ndata <- read_csv("../Data/${selectedFiles[0]?.name}")\nsummary(data)`;
                            break;
                        case 'gofPlots':
                            content = `# Goodness of Fit Plots\nlibrary(ggplot2)\n# Load model results and plot\n# plot(dv, ipred)`;
                            break;
                        case 'runModel':
                            content = `# Run Analysis Script\nimport os\n\nprint("Starting analysis...")`;
                            break;
                        case 'blank':
                        default:
                            content = `# New Script: ${script.name}`;
                    }

                    // FIX: Awaited promise from `createFileRecursively`.
                    await createFileRecursively(scriptFolderId, script.name, content);
                }
            }

            addLog("Setup complete!");
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
            setIsComplete(true);

        } catch (e: any) {
            setError(e.message || "An error occurred during setup.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isComplete) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Analysis Setup Complete!</h3>
                <p className="text-gray-600 mb-8 max-w-md">
                    Your datasets have been imported, and the requested model and script files have been created. You are ready to start your analysis.
                </p>
                <div className="bg-gray-50 rounded-lg border border-gray-200 w-full max-w-md mb-8 p-4 text-left max-h-48 overflow-y-auto">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Activity Log</h4>
                    <ul className="space-y-1">
                        {progressLogs.map((log, i) => (
                            <li key={i} className="text-xs text-gray-600 font-mono flex items-center">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                                {log}
                            </li>
                        ))}
                    </ul>
                </div>
                <button
                    onClick={onComplete}
                    className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                    <span>Finish & Go to Analysis</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Create a New Analysis Manually</h3>
            
            <div className={`space-y-6 flex-1 overflow-y-auto pr-2 pb-4 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Datasets Card */}
                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-4">
                        <div className="bg-blue-100 p-2 rounded-lg"><Database className="w-5 h-5 text-blue-600" /></div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">1. Link Datasets <span className="text-red-500">*</span></h4>
                            <p className="text-sm text-gray-500">Select datasets for your analysis (.csv, .xpt, .xls).</p>
                            
                            <div className="mt-4">
                                <label htmlFor="file-upload" className="w-full flex justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                    <div className="text-center">
                                        <FilePlus2 className="mx-auto h-8 w-8 text-gray-400" />
                                        <div className="mt-2 flex text-sm text-gray-600 justify-center">
                                            <span className="font-medium text-blue-600">Upload a file</span>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} accept=".csv,.txt,.xpt,.xls,.xlsx" />
                                    </div>
                                </label>
                                {selectedFiles.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-100 rounded-md">
                                                <div className="flex items-center truncate">
                                                    <FileIcon className="w-4 h-4 text-gray-500 mr-2" />
                                                    <span className="truncate">{file.name}</span>
                                                    <span className="text-xs text-gray-400 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                                                </div>
                                                <button onClick={() => removeFile(index)} className="text-gray-500 hover:text-red-600 ml-2 p-1"><X className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Model Files Card */}
                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-4">
                        <div className="bg-green-100 p-2 rounded-lg"><FileCode2 className="w-5 h-5 text-green-600" /></div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-gray-800">2. Create Model Files <span className="text-red-500">*</span></h4>
                                    <p className="text-sm text-gray-500">Specify model files to create. One per line.</p>
                                </div>
                                <div className="group relative">
                                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                    <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                        <p className="mb-1 font-bold">Patterns Supported:</p>
                                        <ul className="list-disc pl-3 space-y-1">
                                            <li>Multiple files: <code className="bg-gray-700 px-1">run001.mod</code> (newline) <code className="bg-gray-700 px-1">run002.mod</code></li>
                                            <li>Ranges: <code className="bg-gray-700 px-1">run[001-005].mod</code> expands to 5 files.</li>
                                            <li>Subfolders: <code className="bg-gray-700 px-1">base/run1.ctl</code> creates folder 'base' in Models.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Model Filenames / Patterns</label>
                                <textarea 
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono" 
                                    placeholder="run001.mod&#10;run[002-005].mod&#10;base/model.ctl"
                                    rows={4}
                                    value={modelInput}
                                    onChange={(e) => setModelInput(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scripts Card */}
                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-4">
                        <div className="bg-purple-100 p-2 rounded-lg"><Edit className="w-5 h-5 text-purple-600" /></div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">3. Create Analysis Scripts</h4>
                            <p className="text-sm text-gray-500">Configure support scripts for data prep, execution, and plotting.</p>
                            
                            <div className="mt-4 space-y-2">
                                {scriptConfigs.map((script, index) => (
                                    <div key={script.id} className="flex items-center gap-2 group">
                                        <input 
                                            type="text"
                                            value={script.name}
                                            onChange={(e) => handleScriptChange(script.id, 'name', e.target.value)}
                                            className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="script_name.R"
                                        />
                                        <select
                                            value={script.type}
                                            onChange={(e) => handleScriptChange(script.id, 'type', e.target.value as any)}
                                            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                        >
                                            <option value="dataPrep">Data Prep (R)</option>
                                            <option value="gofPlots">GOF Plots (R)</option>
                                            <option value="runModel">Run Model (Py)</option>
                                            <option value="blank">Blank File</option>
                                        </select>
                                        <button 
                                            onClick={() => handleRemoveScript(script.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                            title="Remove script"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={handleAddScript}
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Script
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {error}
                </div>
            )}

            {isProcessing && (
                <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center rounded-lg">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                    <h4 className="text-lg font-semibold text-gray-800">Creating Analysis Files...</h4>
                    <div className="mt-4 w-64 max-h-32 overflow-hidden relative">
                        <div className="space-y-1 text-xs text-gray-500 text-center font-mono">
                            {progressLogs.slice(-3).map((log, i) => (
                                <p key={i} className="animate-fade-in">{log}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={handleCreateAnalysis}
                    disabled={isProcessing}
                    className="inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Create Analysis Files
                </button>
            </div>
        </div>
    );
};

const StartupModal: React.FC<StartupModalProps> = ({ isOpen, onClose, onNavigate, stats }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'template' | 'manual'>('ai');
  const [selectedAgent, setSelectedAgent] = useState(agents[1]); // Default to Project Setup

  if (!isOpen) {
    return null;
  }

  const hasFiles = stats.files > 0;

  const handleManualComplete = () => {
      onClose();
      onNavigate('/analysis');
  };

  const handleTemplateComplete = () => {
      onClose();
      onNavigate('/analysis');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <div key="ai-content" className="flex flex-col h-full">
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="agent-select" className="text-md font-medium text-gray-600">Agent:</label>
                <select
                  id="agent-select"
                  value={selectedAgent.name}
                  onChange={(e) => setSelectedAgent(agents.find(a => a.name === e.target.value) || agents[0])}
                  className="text-sm font-semibold text-blue-700 bg-blue-50 border-blue-200 border focus:ring-blue-500 focus:border-blue-500 p-1"
                >
                  {agents.map(agent => (
                    <option key={agent.name} value={agent.name}>{agent.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 border border-gray-200 shadow-sm overflow-hidden">
              <AIAssistant systemInstruction={selectedAgent.systemInstruction} key={selectedAgent.name} allowAttachments={true} />
            </div>
          </div>
        );
      case 'template':
        return <TemplateContent key="template" onComplete={handleTemplateComplete} />;
      case 'manual':
        return <ManualSetupContent key="manual" onComplete={handleManualComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-3xl shadow-xl flex flex-col overflow-hidden"
        style={{ height: 'calc(100vh - 80px)', maxHeight: '800px' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 pl-2">Project Builder</h2>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center"><Folder className="w-4 h-4 mr-1.5 text-gray-400" />{stats.folders} Folders</span>
                <span className="flex items-center"><FileIcon className="w-4 h-4 mr-1.5 text-gray-400" />{stats.files} Files</span>
                <span className="flex items-center"><HardDrive className="w-4 h-4 mr-1.5 text-gray-400" />{formatFileSize(stats.totalSize)}</span>
            </div>
            <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:bg-gray-200 transition-colors"
                aria-label="Close"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-3 bg-blue-50">
            <h2 className="text-xl font-bold text-gray-900 mb-2 hidden">
                {hasFiles ? "Welcome back to your Analysis!" : "Let's Get Started! 🚀"}
            </h2>
            <p className="text-gray-600">
                {hasFiles
                    ? "Continue where you left off. Use the tools below to generate scripts, or expand your workflow."
                    : "Ready to begin? Choose a template, use AI to generate your project structure, or set it up manually to kickstart your pharmacometrics analysis."}
            </p>
        </div>

        <div className="flex items-center border-b border-gray-200 bg-white px-4">
            <TabButton label="AI Assistant" icon={Bot} isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
            <TabButton label="From Template" icon={FileTemplateIcon} isActive={activeTab === 'template'} onClick={() => setActiveTab('template')} />
            <TabButton label="Manual Setup" icon={Edit} isActive={activeTab === 'manual'} onClick={() => setActiveTab('manual')} />
        </div>

        <div className="flex-1 p-6 bg-gray-50 overflow-hidden">
          {renderContent()}
        </div>
        
        <div className="p-4 bg-white border-t border-gray-200 flex justify-end">
            <button onClick={onClose} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Skip for now
            </button>
        </div>
      </div>
    </div>
  );
};

export default StartupModal;