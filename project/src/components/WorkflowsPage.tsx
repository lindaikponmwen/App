
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    Plus, Search, FileCode, UploadCloud, Trash2, Save, X, 
    Edit, FileText, Check, ArrowLeft, Copy, ExternalLink, Info, Folder,
    Share2, Download, CheckCircle2, User, Eye, EyeOff, Users, Square, CheckSquare,
    Sparkles, Loader2, ChevronDown, ChevronRight, Play
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { GoogleGenAI, Type } from '@google/genai';
import { AnalysisTemplate, CustomTemplateFile, analysisTemplates } from '../welcome/analysisTemplates';
import { useFiles, FileNode } from '../contexts/FileContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTasker } from '../Tasker/TaskContext';
import { teamMembers } from '../data/appConfig';
import JSZip from 'jszip';
import CsvEditor from '../plugin/csv/CsvEditor';
import { PDFViewer } from './PDFViewer';

const CUSTOM_TEMPLATES_KEY = 'drlevey-custom-templates';

const getLanguageForExtension = (extension?: string): string => {
  if (!extension) return 'plaintext';
  switch (extension.toLowerCase()) {
    case 'r': return 'r';
    case 'py': return 'python';
    case 'md': return 'markdown';
    case 'json': return 'json';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'ctl':
    case 'mod':
      return 'plaintext'; // Using plaintext as a fallback
    default:
      return 'plaintext';
  }
};

const getEditorTheme = (language: string, baseTheme: 'light' | 'dark'): string => {
  // A simplified version, assuming no custom themes are needed for this modal
  return baseTheme === 'dark' ? 'vs-dark' : 'vs';
};

const isPreviewable = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const previewableExts = ['mod', 'ctl', 'mlxtran', 'r', 'py', 'jl', 'm', 'js', 'ts', 'csv', 'pdf', 'txt', 'md'];
  return previewableExts.includes(ext);
};

const readFileAsContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const reader = new FileReader();
        
        reader.onload = () => {
            if (ext === 'pdf') {
                // Return just the base64 part
                const result = reader.result as string;
                resolve(result.split(',')[1] || result);
            } else {
                resolve(reader.result as string);
            }
        };
        reader.onerror = reject;

        if (ext === 'pdf') {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    });
};

interface EditFileModalProps {
    file: CustomTemplateFile;
    index: number;
    onSave: (index: number, content: string) => void;
    onClose: () => void;
}

const EditFileModal: React.FC<EditFileModalProps> = ({ file, index, onSave, onClose }) => {
  const [content, setContent] = useState(file.content);
  const { settings } = useSettings();

  const language = getLanguageForExtension(file.name.split('.').pop());
  const theme = getEditorTheme(language, settings.theme);

  const handleSave = () => {
    onSave(index, content);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-none shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit File</h3>
            <p className="text-xs text-gray-500 mt-1">{file.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={language}
            value={content}
            onChange={(value) => setContent(value || '')}
            theme={theme}
            options={{
              ...settings,
              wordWrap: settings.wordWrap ? 'on' : 'off',
              lineNumbers: settings.lineNumbers ? 'on' : 'off',
              minimap: { enabled: settings.showMinimap },
              bracketPairColorization: { enabled: settings.bracketPairColorization },
              automaticLayout: true,
            }}
          />
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-none hover:bg-blue-700 shadow-sm transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

interface FilePreviewModalProps {
    file: CustomTemplateFile;
    onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const { settings } = useSettings();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const language = getLanguageForExtension(ext);
  const theme = getEditorTheme(language, settings.theme);

  const renderContent = () => {
    if (ext === 'csv') {
      return (
        <CsvEditor
          content={file.content}
          onContentChange={() => {}}
          theme={settings.theme}
          readOnly={true}
        />
      );
    }

    if (ext === 'pdf') {
      return (
        <PDFViewer 
            file={{
                id: 'preview',
                name: file.name,
                type: 'file',
                content: file.content,
                extension: 'pdf'
            }} 
        />
      );
    }

    return (
      <Editor
        height="100%"
        language={language}
        value={file.content}
        theme={theme}
        options={{
          ...settings,
          readOnly: true,
          wordWrap: settings.wordWrap ? 'on' : 'off',
          lineNumbers: settings.lineNumbers ? 'on' : 'off',
          minimap: { enabled: settings.showMinimap },
          bracketPairColorization: { enabled: settings.bracketPairColorization },
          automaticLayout: true,
          domReadOnly: true,
        }}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[75] flex items-center justify-center p-4">
      <div className="bg-white rounded-none shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 p-1.5 text-blue-600 rounded-sm">
                <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">File Preview</h3>
              <p className="text-xs text-gray-500 mt-0.5">{file.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white text-sm font-bold rounded-none hover:bg-black transition-colors shadow-sm">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

interface ShareModalProps {
    workflow: AnalysisTemplate;
    onClose: () => void;
}

const ShareWorkflowModal: React.FC<ShareModalProps> = ({ workflow, onClose }) => {
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isSharing, setIsSharing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        return teamMembers.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const handleToggleUser = (userId: string) => {
        const newSet = new Set(selectedUserIds);
        if (newSet.has(userId)) newSet.delete(userId);
        else newSet.add(userId);
        setSelectedUserIds(newSet);
    };

    const handleSelectAll = () => {
        const newSet = new Set(selectedUserIds);
        filteredUsers.forEach(user => newSet.add(user.id));
        setSelectedUserIds(newSet);
    };

    const handleDeselectAll = () => {
        const newSet = new Set(selectedUserIds);
        filteredUsers.forEach(user => newSet.delete(user.id));
        setSelectedUserIds(newSet);
    };

    const handleShare = () => {
        if (selectedUserIds.size === 0) return;
        setIsSharing(true);
        setTimeout(() => {
            console.log("success the workflow has been shared");
            setIsSharing(false);
            onClose();
        }, 600);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-none shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Share Workflow</h3>
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[320px]">{workflow.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-4 space-y-4">
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-none text-sm outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                            <div className="flex items-center space-x-3">
                                <button onClick={handleSelectAll} className="text-blue-600">Select All Visible</button>
                                <span className="text-gray-300">|</span>
                                <button onClick={handleDeselectAll} className="text-blue-600">Deselect All Visible</button>
                            </div>
                            <span>{selectedUserIds.size} selected</span>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-none divide-y divide-gray-100 h-80 overflow-y-auto bg-white">
                        {filteredUsers.map(user => (
                            <div
                                key={user.id}
                                onClick={() => handleToggleUser(user.id)}
                                className={`flex items-center justify-between p-3 cursor-pointer ${selectedUserIds.has(user.id) ? 'bg-blue-50' : 'bg-white'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-none flex items-center justify-center text-xs font-bold text-gray-600">{user.initials}</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{user.email}</p>
                                    </div>
                                </div>
                                <div>
                                    {selectedUserIds.has(user.id) ? (<CheckSquare className="w-5 h-5 text-blue-600" />) : (<Square className="w-5 h-5 text-gray-300" />)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600">Cancel</button>
                    <button 
                        onClick={handleShare}
                        disabled={selectedUserIds.size === 0 || isSharing}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-none disabled:bg-gray-400"
                    >
                        {isSharing ? 'Sharing...' : 'Share Workflow'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ProjectFilePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (files: CustomTemplateFile[]) => void;
}

const ProjectFilePickerModal: React.FC<ProjectFilePickerModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const { fileTree } = useFiles();
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [filterTerm, setFilterTerm] = useState('');

    const filteredAndProcessedTree = useMemo(() => {
        const rootNodes = fileTree.children || [];
        if (!filterTerm) return rootNodes.filter(node => node.name !== 'My Workflows');
        
        const lowerFilter = filterTerm.toLowerCase();
        
        const filterNodes = (nodes: FileNode[]): FileNode[] => {
            const result: FileNode[] = [];
            for (const node of nodes) {
                if (node.name === 'My Workflows') continue;
                if (node.type === 'folder') {
                    const filteredChildren = filterNodes(node.children || []);
                    if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lowerFilter)) {
                        result.push({ ...node, children: filteredChildren });
                    }
                } else {
                    if (node.name.toLowerCase().includes(lowerFilter)) {
                        result.push(node);
                    }
                }
            }
            return result;
        };

        return filterNodes(rootNodes);
    }, [filterTerm, fileTree.children]);

    useEffect(() => {
        if (filterTerm) {
            const allFolderIds = new Set<string>();
            const collectFolderIds = (nodes: FileNode[]) => {
                nodes.forEach(node => {
                    if (node.type === 'folder') {
                        allFolderIds.add(node.id);
                        if (node.children) collectFolderIds(node.children);
                    }
                });
            };
            collectFolderIds(filteredAndProcessedTree);
            setExpandedFolders(allFolderIds);
        }
    }, [filterTerm, filteredAndProcessedTree]);


    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folderId)) newSet.delete(folderId);
            else newSet.add(folderId);
            return newSet;
        });
    };

    const toggleFileSelection = (fileId: string) => {
        setSelectedFileIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fileId)) newSet.delete(fileId);
            else newSet.add(fileId);
            return newSet;
        });
    };

    const handleConfirm = () => {
        const files: CustomTemplateFile[] = [];
        const findAndCollect = (nodes: FileNode[]) => {
            for (const node of nodes) {
                if (node.type === 'file' && selectedFileIds.has(node.id)) {
                    files.push({ name: node.name, content: node.content || '' });
                }
                if (node.children) findAndCollect(node.children);
            }
        };
        findAndCollect(fileTree.children || []);
        onConfirm(files);
        onClose();
    };

    const TreeItem: React.FC<{ node: FileNode, level: number }> = ({ node, level }) => {
        if (node.type === 'folder') {
            return (
                <div>
                    <div onClick={() => toggleFolder(node.id)} className="flex items-center space-x-2 py-1.5 px-2 hover:bg-gray-100 rounded cursor-pointer" style={{ paddingLeft: `${level * 16 + 8}px` }}>
                        {expandedFolders.has(node.id) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        <Folder className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">{node.name}</span>
                    </div>
                    {expandedFolders.has(node.id) && node.children && (
                        <div>
                            {node.children.map(child => <TreeItem key={child.id} node={child} level={level + 1} />)}
                        </div>
                    )}
                </div>
            );
        }
        
        return (
            <div className="flex items-center space-x-2 py-1.5 px-2 hover:bg-gray-100 rounded cursor-pointer" style={{ paddingLeft: `${level * 16 + 8}px` }} onClick={() => toggleFileSelection(node.id)}>
                <div className="w-4 h-4" /> {/* Spacer */}
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleFileSelection(node.id); }}>
                    {selectedFileIds.has(node.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                </button>
                <FileCode className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{node.name}</span>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-none shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Add Files from Project</h3>
                    <button onClick={onClose} className="p-2 text-gray-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter files and folders..."
                            value={filterTerm}
                            onChange={(e) => setFilterTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-none text-sm outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredAndProcessedTree.map(node => <TreeItem key={node.id} node={node} level={0} />)}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm text-gray-600">{selectedFileIds.size} file(s) selected</span>
                    <div className="flex space-x-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600">Cancel</button>
                        <button onClick={handleConfirm} disabled={selectedFileIds.size === 0} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-none disabled:bg-gray-400">
                            Add Selected Files
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function WorkflowsPage() {
    const { fileTree, addNode, updateFileContentById, deleteNode, renameNode, refreshFileTree } = useFiles();
    const { addTask, addToast } = useTasker();
    const [templates, setTemplates] = useState<AnalysisTemplate[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<AnalysisTemplate | null>(null);
    const [tempFiles, setTempFiles] = useState<CustomTemplateFile[]>([]);
    const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);
    const [previewFileIndex, setPreviewFileIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);

    const [modal, setModal] = useState<null | 'delete' | 'share' | 'importFiles' | 'generateAI'>(null);
    const [templateToDelete, setTemplateToDelete] = useState<AnalysisTemplate | null>(null);
    const [templateToShare, setTemplateToShare] = useState<AnalysisTemplate | null>(null);

    useEffect(() => {
        const customNodes = fileTree.children?.find(node => node.name === 'My Workflows')?.children || [];
        const customTemplates = customNodes
            .filter(node => node.name.endsWith('.workflow')) // Strictly allow only .workflow files
            .map((node): AnalysisTemplate | null => {
                let files: CustomTemplateFile[] = [];
                try {
                    if(node.content && node.content.trim().startsWith('[')) {
                         files = JSON.parse(node.content);
                    } else {
                        // Skip files that don't look like JSON arrays (e.g., error messages or empty files)
                        return null; 
                    }
                } catch(e) { 
                    console.error("Could not parse workflow file", node.name, e); 
                    return null;
                }

                return {
                    id: node.id,
                    title: node.name.replace('.workflow', ''),
                    description: `Custom workflow with ${files.length} file(s).`,
                    plots: [],
                    tables: [],
                    customFiles: files,
                    isCustom: true,
                };
            })
            .filter((t): t is AnalysisTemplate => t !== null); // Remove failed parses

        setTemplates([...customTemplates, ...analysisTemplates]);
    }, [fileTree]);

    const filteredTemplates = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return templates.filter(t => 
            t.title.toLowerCase().includes(lowerSearch) || 
            t.description.toLowerCase().includes(lowerSearch)
        );
    }, [templates, searchTerm]);

    const handleEdit = (template: AnalysisTemplate) => {
        setEditingTemplate({ ...template });
        setTempFiles(template.customFiles || template.files || []);
    };
    
    const getMyWorkflowsFolderId = async (): Promise<string> => {
        const found = fileTree.children?.find(n => n.name === 'My Workflows' && n.type === 'folder');
        if (found) return found.id;
        const newNode = await addNode(fileTree.id, 'My Workflows', 'folder');
        return newNode.id;
    }

    const handleSave = async () => {
        if (!editingTemplate) return;
        const updatedFiles = [...tempFiles];
        const myWorkflowsId = await getMyWorkflowsFolderId();

        if (editingTemplate.isCustom) {
            // Update title/filename if it changed
            const expectedName = `${editingTemplate.title}.workflow`;
            const currentNode = fileTree.children?.find(n => n.name === 'My Workflows')?.children?.find(c => c.id === editingTemplate.id);
            if (currentNode && currentNode.name !== expectedName) {
                await renameNode(editingTemplate.id, expectedName);
            }
            // Update existing custom workflow content
            await updateFileContentById(editingTemplate.id, JSON.stringify(updatedFiles));
        } else {
            // Create a new custom workflow file from a default template
            const newTitle = `${editingTemplate.title}.workflow`;
            const newNode = await addNode(myWorkflowsId, newTitle, 'file');
            await updateFileContentById(newNode.id, JSON.stringify(updatedFiles));
        }
        await refreshFileTree();
        setEditingTemplate(null);
    };

    const getFolderId = async (name: string): Promise<string> => {
        const found = fileTree.children?.find(n => n.name === name && n.type === 'folder');
        if (found) return found.id;
        const newNode = await addNode('root', name, 'folder');
        return newNode.id;
    }

    const determineTargetFolder = (filename: string): string => {
        const lowerName = filename.toLowerCase();
        const ext = lowerName.split('.').pop() || '';

        if (lowerName.includes('dap') && (ext === 'docx' || ext === 'md')) {
            return 'Initial Plan';
        }
        if (lowerName.includes('report') && (ext === 'docx' || ext === 'md')) {
            return 'Initial Reports';
        }

        switch (ext) {
            case 'r':
            case 'py':
            case 'jl':
            case 'm':
                return 'Scripts';
            case 'csv':
            case 'xls':
            case 'xlsx':
            case 'xpt':
            case 'txt':
                return 'Data';
            case 'mod':
            case 'ctl':
            case 'mlxtran':
                return 'Models';
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'svg':
                return 'Results';
            case 'pptx':
                return 'Talks';
            default:
                return 'Scripts';
        }
    };

    const handleExecuteWorkflow = async (template: AnalysisTemplate) => {
        if (isExecuting) return;
        setIsExecuting(true);
        const filesToProcess = template.customFiles || template.files || [];
        
        try {
            for (const file of filesToProcess) {
                const targetFolderName = determineTargetFolder(file.name);
                const targetFolderId = await getFolderId(targetFolderName);
                
                const newFile = await addNode(targetFolderId, file.name, 'file');
                await updateFileContentById(newFile.id, file.content);
            }
            
            await refreshFileTree();
            const summary = `Generated ${filesToProcess.length} files successfully.`;
            addTask(`Workflow Executed: ${template.title}. ${summary}`);
            addToast('Workflow Executed', summary);
        } catch (error) {
            console.error("Execution failed", error);
            addTask(`Failed to execute workflow: ${template.title}`);
            addToast('Execution Failed', 'An error occurred while generating analysis files.');
        } finally {
            setIsExecuting(false);
        }
    };

    const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        for (const file of files) {
            try {
                const content = await readFileAsContent(file);
                setTempFiles(prev => [...prev, { name: file.name, content }]);
            } catch (err) {
                console.error(`Failed to read dropped file: ${file.name}`, err);
            }
        }
    };

    const handleRemoveFile = (index: number) => {
        setTempFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveFileContent = (index: number, content: string) => {
        setTempFiles(prev => {
            const newFiles = [...prev];
            newFiles[index].content = content;
            return newFiles;
        });
    };
    
    const handleImportFromProject = (files: CustomTemplateFile[]) => {
        setTempFiles(prev => [...prev, ...files]);
    };
    
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // FIX: Explicitly cast e.target.files to File[] to avoid 'unknown' errors.
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;
    
        const workflowFiles = files.filter(f => f.name.toLowerCase().endsWith('.workflow'));
        const otherFiles = files.filter(f => !f.name.toLowerCase().endsWith('.workflow'));
        const myWorkflowsId = await getMyWorkflowsFolderId();

        // Process actual .workflow files (JSON bundles)
        for (const file of workflowFiles) {
            try {
                const text = await file.text();
                // Basic validation: ensure it is a JSON array of CustomTemplateFile objects
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) {
                    // Create directly in the My Workflows folder
                    const newNode = await addNode(myWorkflowsId, file.name, 'file');
                    await updateFileContentById(newNode.id, text);
                }
            } catch (err) {
                console.error(`Failed to import .workflow file: ${file.name}`, err);
            }
        }

        // Handle other raw files as a new grouped workflow
        if (otherFiles.length > 0) {
            const newTemplateTitle = `Imported Group - ${new Date().toLocaleDateString()}`;
            const groupContent: CustomTemplateFile[] = [];
            
            for (const file of otherFiles) {
                try {
                    const content = await readFileAsContent(file);
                    groupContent.push({ name: file.name, content });
                } catch (err) {
                    console.error(`Failed to read file for group: ${file.name}`, err);
                }
            }

            if (groupContent.length > 0) {
                const newNode = await addNode(myWorkflowsId, `${newTemplateTitle}.workflow`, 'file');
                await updateFileContentById(newNode.id, JSON.stringify(groupContent));
            }
        }
    };

    const handleExport = (template: AnalysisTemplate) => {
        const zip = new (JSZip as any)();
        (template.customFiles || template.files || []).forEach(file => {
            zip.file(file.name, file.content);
        });
        zip.generateAsync({ type: 'blob' }).then((content: any) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${template.title}_workflow.zip`;
            link.click();
        });
    };

    const handleShare = (template: AnalysisTemplate) => {
        setTemplateToShare(template);
        setModal('share');
    };

    const handleDelete = (template: AnalysisTemplate) => {
        setTemplateToDelete(template);
        setModal('delete');
    };
    
    const handleConfirmDelete = async () => {
        if (templateToDelete && templateToDelete.isCustom) {
            await deleteNode(templateToDelete.id);
        }
        setModal(null);
        setTemplateToDelete(null);
    };
    
    const handleDuplicate = async (template: AnalysisTemplate) => {
        let newTitle = `${template.title} (Copy).workflow`;
        
        const myWorkflowsId = await getMyWorkflowsFolderId();
        const myWorkflowFolder = fileTree.children?.find(f => f.id === myWorkflowsId);
        
        const existingNames = myWorkflowFolder?.children?.map(c => c.name) || [];
        let counter = 2;
        while (existingNames.includes(newTitle)) {
            newTitle = `${template.title} (Copy ${counter++}).workflow`;
        }

        const newTemplate = {
            ...template,
            customFiles: [...(template.customFiles || template.files || [])],
        };

        const newNode = await addNode(myWorkflowsId, newTitle, 'file');
        await updateFileContentById(newNode.id, JSON.stringify(newTemplate.customFiles));
    };

    if (editingTemplate) {
        return (
            <div className="flex-1 overflow-hidden p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setEditingTemplate(null)} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-800">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Workflows
                    </button>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => handleExecuteWorkflow(editingTemplate)} 
                            disabled={isExecuting}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-none flex items-center gap-2 disabled:bg-gray-400"
                        >
                            {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            Execute
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-none flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                </div>
                <div className="bg-white p-4 border border-gray-200">
                    <input 
                        type="text"
                        value={editingTemplate.title}
                        onChange={(e) => setEditingTemplate({...editingTemplate, title: e.target.value})}
                        className="text-lg font-bold w-full outline-none focus:ring-1 focus:ring-blue-400 p-1"
                    />
                    <textarea 
                        value={editingTemplate.description}
                        onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
                        className="text-sm text-gray-600 w-full mt-2 outline-none focus:ring-1 focus:ring-blue-400 p-1 resize-y"
                        rows={2}
                    />
                </div>
                <div className="flex-1 mt-4 border border-gray-200 bg-white p-4 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800">Files ({tempFiles.length})</h4>
                        <div className="flex space-x-2">
                            <button onClick={() => setModal('importFiles')} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-none flex items-center gap-1.5">
                                <Folder className="w-4 h-4" />
                                From Project
                            </button>
                            <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-none flex items-center gap-1.5" onClick={() => document.getElementById('file-upload-input')?.click()}>
                                <UploadCloud className="w-4 h-4" />
                                Upload
                            </button>
                            <input id="file-upload-input" type="file" multiple className="hidden" onChange={async (e) => {
                                // FIX: Explicitly cast e.target.files to File[] to avoid 'unknown' errors.
                                const files = Array.from(e.target.files || []) as File[];
                                for (const file of files) {
                                    try {
                                        const content = await readFileAsContent(file);
                                        setTempFiles(prev => [...prev, { name: file.name, content }]);
                                    } catch (err) {
                                        console.error(`Failed to read uploaded file: ${file.name}`, err);
                                    }
                                }
                            }} />
                        </div>
                    </div>
                    <div className="flex-1 border-2 border-dashed border-gray-200 p-2 overflow-y-auto" onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop}>
                        {tempFiles.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <p>Drag and drop files here, or use the buttons above.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tempFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-none group">
                                        <div className="flex items-center space-x-3">
                                            <FileCode className="w-5 h-5 text-gray-500" />
                                            <span className="text-sm font-medium">{file.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isPreviewable(file.name) && (
                                              <button onClick={() => setPreviewFileIndex(index)} className="p-1 text-gray-500 hover:text-blue-600" title="Preview"><Eye className="w-4 h-4" /></button>
                                            )}
                                            <button onClick={() => setEditingFileIndex(index)} className="p-1 text-gray-500 hover:text-blue-600" title="Edit"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleRemoveFile(index)} className="p-1 text-gray-500 hover:text-red-600" title="Remove"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {editingFileIndex !== null && (
                    <EditFileModal 
                        file={tempFiles[editingFileIndex]} 
                        index={editingFileIndex} 
                        onSave={handleSaveFileContent} 
                        onClose={() => setEditingFileIndex(null)}
                    />
                )}
                {previewFileIndex !== null && (
                    <FilePreviewModal 
                        file={tempFiles[previewFileIndex]} 
                        onClose={() => setPreviewFileIndex(null)}
                    />
                )}
                {modal === 'importFiles' && (
                    <ProjectFilePickerModal 
                        isOpen={true} 
                        onClose={() => setModal(null)}
                        onConfirm={handleImportFromProject}
                    />
                )}
            </div>
        );
    }
  
    return (
      <div className="flex-1 overflow-hidden p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workflow Management</h2>
            <p className="text-gray-600 mt-1">Manage, create, and share your analysis workflows.</p>
          </div>
          <div className="flex space-x-2">
            <label htmlFor="import-workflow" className="px-4 py-2 bg-white text-gray-600 border border-gray-300 text-sm font-medium rounded-none flex items-center gap-2 cursor-pointer shadow-sm hover:bg-gray-50">
              <UploadCloud className="w-4 h-4" /> Import
            </label>
            <input id="import-workflow" type="file" className="hidden" accept=".zip,.workflow" multiple onChange={handleImport} />
            <button 
                onClick={() => setEditingTemplate({ id: `new-${Date.now()}`, title: 'New Workflow', description: 'A brand new workflow.', plots: [], tables: [], customFiles: [], isCustom: false })}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-none flex items-center gap-2 shadow-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Workflow
            </button>
          </div>
        </div>

        <div className="mb-6 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search workflows by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-none shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
            {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                {filteredTemplates.map(template => (
                    <div key={template.id} className="bg-white p-4 border border-gray-200 rounded-none flex flex-col group hover:border-blue-400 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 mr-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{template.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{template.description}</p>
                        </div>
                        {template.isCustom ? 
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm font-medium">Custom</span> :
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm font-medium">Default</span>
                        }
                    </div>
                    <div className="flex-grow my-4">
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                        <FileCode className="w-4 h-4"/>
                        <span>{(template.customFiles || template.files)?.length || 0} Files</span>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                        <div className="flex items-center space-x-1">
                        <button onClick={() => handleEdit(template)} title="Edit" className="p-1 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDuplicate(template)} title="Duplicate" className="p-1 text-gray-400 hover:text-green-600"><Copy className="w-4 h-4" /></button>
                        {template.isCustom && <button onClick={() => handleDelete(template)} title="Delete" className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                        <div className="flex items-center space-x-1">
                        <button onClick={() => handleExecuteWorkflow(template)} title="Execute Workflow" className="p-1 text-emerald-600 hover:text-emerald-800"><Play className="w-4 h-4" /></button>
                        <button onClick={() => handleShare(template)} title="Share" className="p-1 text-gray-400 hover:text-gray-800"><Share2 className="w-4 h-4" /></button>
                        <button onClick={() => handleExport(template)} title="Export as .zip" className="p-1 text-gray-400 hover:text-gray-800"><Download className="w-4 h-4" /></button>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Search className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No workflows found matching "{searchTerm}"</p>
                    <button onClick={() => setSearchTerm('')} className="mt-2 text-blue-600 hover:underline">Clear search</button>
                </div>
            )}
        </div>

        {modal === 'delete' && templateToDelete && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-none p-6 max-w-sm w-full shadow-2xl border border-gray-200">
                    <h3 className="text-lg font-bold">Confirm Deletion</h3>
                    <p className="my-4 text-sm text-gray-600">Are you sure you want to delete the workflow "{templateToDelete.title}"? This cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                        <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-none hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </div>
        )}

        {modal === 'share' && templateToShare && (
            <ShareWorkflowModal workflow={templateToShare} onClose={() => setModal(null)} />
        )}

      </div>
    );
}
