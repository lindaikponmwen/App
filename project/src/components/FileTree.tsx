
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  File, 
  FileText, 
  Code, 
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Presentation,
  FileCode,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { useFiles, FileNode } from '../contexts/FileContext';

const PROTECTED_FOLDERS = [
    'Data', 
    'Models', 
    'Scripts', 
    'Results', 
    'Initial Plan', 
    'Final Plan', 
    'Initial Reports', 
    'Final Reports', 
    'Abstracts', 
    'Posters', 
    'Talks', 
    'My Workflows'
];

const getFileIcon = (extension?: string) => {
    switch (extension?.toLowerCase()) {
      case 'csv': 
      case 'xlsx':
      case 'xls':
      case 'xpt':
        return FileSpreadsheet;
      case 'mod': 
      case 'ctl':
        return Code;
      case 'py':
        return FileCode;
      case 'r': return Code;
      case 'md': return FileText;
      case 'txt': return FileText;
      case 'pdf': return File;
      case 'docx': return File;
      case 'pptx': return Presentation;
      default: return File;
    }
  };

const getFileColor = (extension?: string) => {
    switch (extension?.toLowerCase()) {
      case 'csv':
      case 'xlsx':
      case 'xls':
      case 'xpt':
        return 'text-green-600';
      case 'mod':
      case 'ctl':
        return 'text-blue-600';
      case 'py':
        return 'text-yellow-600';
      case 'r': return 'text-purple-600';
      case 'md': return 'text-indigo-600';
      case 'docx': return 'text-blue-600';
      case 'pdf': return 'text-red-600';
      case 'pptx': return 'text-orange-600';
      case 'txt': return 'text-gray-600';
      default: return 'text-gray-600';
    }
};

const ActionModal = ({ modalState, onClose, onConfirm, inputValue, setInputValue, availableFolders, newFileParentId, setNewFileParentId }: any) => {
    if (!modalState) return null;

    const { type, node } = modalState;

    const titles = {
        rename: 'Rename Item',
        duplicate: 'Duplicate Item',
        delete: 'Confirm Deletion',
        addFile: 'Add New File',
        addFolder: 'Add New Folder'
    };

    const confirmButtonText = {
        rename: 'Rename',
        duplicate: 'Duplicate',
        delete: 'Delete',
        addFile: 'Create File',
        addFolder: 'Create Folder'
    };
    
    const confirmButtonClass = type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
                className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
                {...{
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.95 }
                } as any}
            >
                <h3 className="text-lg font-semibold">{titles[type]}</h3>
                <div className="mt-4">
                    {type === 'delete' ? (
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete "{node.name}"?
                            {node.type === 'folder' && ' All its contents will also be deleted.'} This action cannot be undone.
                        </p>
                    ) : type === 'addFile' || type === 'addFolder' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{type === 'addFile' ? 'File Name' : 'Folder Name'}</label>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
                                    autoFocus
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={type === 'addFile' ? "example.txt" : "New Folder"}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                <select
                                    value={newFileParentId}
                                    onChange={(e) => setNewFileParentId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {availableFolders.map((folder: FileNode) => (
                                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">{type === 'rename' ? 'New Name' : 'Duplicate Name'}</label>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
                                autoFocus
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${confirmButtonClass}`}>
                        {confirmButtonText[type]}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Helper functions for drag & drop
const findNode = (nodes: FileNode[], nodeId: string): FileNode | null => {
    for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
            const found = findNode(node.children, nodeId);
            if (found) return found;
        }
    }
    return null;
};

const isDescendant = (parent: FileNode, childId: string): boolean => {
    if (parent.id === childId) return true;
    if (!parent.children) return false;
    return parent.children.some(child => isDescendant(child, childId));
};

// Flatten folders to a list for the dropdown
const flattenFolders = (nodes: FileNode[], filterRootFolders?: string[]): FileNode[] => {
    let folders: FileNode[] = [];
    nodes.forEach(node => {
        if (node.type === 'folder') {
            // Apply root filter if provided, otherwise include all folders
            if (!filterRootFolders || filterRootFolders.includes(node.name) || !nodes.find(n => n.name === node.name && filterRootFolders.includes(n.name))) {
                 // For root level, check filter. For deeper levels (implicitly included), always include.
                 // Actually simpler: if it's a folder, we add it, but we need to respect the initial root filter.
                 // This helper is used for the dropdown, so we traverse everything visible.
                 folders.push(node);
                 if (node.children) {
                     folders = folders.concat(flattenFolders(node.children));
                 }
            }
        }
    });
    return folders;
};


interface FileTreeProps {
    rootNode: FileNode;
    filterRootFolders?: string[];
    defaultAddParentId?: string;
    title?: string;
}

const FileTree = ({ rootNode, filterRootFolders, defaultAddParentId, title = 'Files' }: FileTreeProps) => {
    const { activeFileId, openFile, addNode, deleteNode, renameNode, duplicateNode, moveNode, refreshFileTree } = useFiles();
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([rootNode.id]));
    const [modalState, setModalState] = useState<{ type: 'rename' | 'duplicate' | 'delete' | 'addFile' | 'addFolder', node: FileNode | null } | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [newFileParentId, setNewFileParentId] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Drag & Drop state
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

    const draggedNode = useMemo(() => draggedNodeId ? findNode([rootNode], draggedNodeId) : null, [draggedNodeId, rootNode]);

    // Calculate available folders for the "Add New" dropdowns
    const availableFolders = useMemo(() => {
        // Filter roots first
        const roots = rootNode.children?.filter(node => 
            node.type === 'folder' && 
            (!filterRootFolders || filterRootFolders.includes(node.name))
        ) || [];
        
        // Then flatten to get all subfolders
        let allFolders: FileNode[] = [];
        roots.forEach(root => {
            allFolders.push(root);
            if (root.children) {
                const getSubs = (nodes: FileNode[]) => {
                    nodes.forEach(n => {
                        if (n.type === 'folder') {
                            allFolders.push(n);
                            if (n.children) getSubs(n.children);
                        }
                    });
                };
                getSubs(root.children);
            }
        });
        return allFolders;
    }, [rootNode.children, filterRootFolders]);

    useEffect(() => {
      if (modalState?.type === 'rename' || modalState?.type === 'duplicate' || modalState?.type === 'addFile' || modalState?.type === 'addFolder') {
        setTimeout(() => inputRef.current?.select(), 0);
      }
    }, [modalState]);
    
    const handleOpenModal = (type: 'rename' | 'duplicate' | 'delete', node: FileNode) => {
        setModalState({ type, node });
        if (type === 'rename') {
            setInputValue(node.name);
        } else if (type === 'duplicate') {
            const extIndex = node.name.lastIndexOf('.');
            if (node.type === 'file' && extIndex !== -1) {
                setInputValue(`${node.name.substring(0, extIndex)} (copy)${node.name.substring(extIndex)}`);
            } else {
                setInputValue(`${node.name} (copy)`);
            }
        }
    };
    
    const handleCloseModal = () => {
        setModalState(null);
        setInputValue('');
    };

    const handleConfirmModal = () => {
        if (!modalState || (modalState.type !== 'delete' && !inputValue.trim())) return;
        
        const { type, node } = modalState;

        if (type === 'rename' && node) {
            renameNode(node.id, inputValue);
        } else if (type === 'duplicate' && node) {
            duplicateNode(node.id, inputValue);
        } else if (type === 'delete' && node) {
            deleteNode(node.id);
        } else if (type === 'addFile') {
            addNode(newFileParentId, inputValue, 'file');
        } else if (type === 'addFolder') {
            addNode(newFileParentId, inputValue, 'folder');
        }
        handleCloseModal();
    };

    const getNextFilename = () => {
        if (filterRootFolders?.includes('Models')) { // Dashboard context
            let maxRunNumber = 0;
            const runFileRegex = /^run(\d{3,})\.(mod|ctl)$/i;
        
            const findMaxRunNumber = (nodes: FileNode[]) => {
                nodes.forEach(node => {
                    if (node.type === 'file') {
                        const match = node.name.match(runFileRegex);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > maxRunNumber) {
                                maxRunNumber = num;
                            }
                        }
                    }
                    if (node.children) {
                        findMaxRunNumber(node.children);
                    }
                });
            };
        
            if (rootNode.children) {
                findMaxRunNumber(rootNode.children);
            }
        
            const nextRunNumber = maxRunNumber + 1;
            return `run${String(nextRunNumber).padStart(3, '0')}.ctl`;
        } else if (filterRootFolders?.includes('Initial Plan')) { // DAP context
            return 'new-analysis-plan.md';
        }
        return 'new-file.txt'; // Generic fallback
    };

    const handleShowAddFileModal = () => {
        const newFileName = getNextFilename();
        setInputValue(newFileName);
        const defaultParent = availableFolders.find(f => f.id === defaultAddParentId);
        setNewFileParentId(defaultParent ? defaultParent.id : (availableFolders.length > 0 ? availableFolders[0].id : rootNode.id));
        setModalState({ type: 'addFile', node: null });
    };

    const handleShowAddFolderModal = () => {
        setInputValue("New Folder");
        const defaultParent = availableFolders.find(f => f.id === defaultAddParentId);
        setNewFileParentId(defaultParent ? defaultParent.id : (availableFolders.length > 0 ? availableFolders[0].id : rootNode.id));
        setModalState({ type: 'addFolder', node: null });
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            refreshFileTree();
            setIsRefreshing(false);
        }, 300);
    };

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folderId)) newSet.delete(folderId);
            else newSet.add(folderId);
            return newSet;
        });
    };

    const handleNodeClick = (node: FileNode) => {
        if (node.type === 'folder') {
            toggleFolder(node.id);
        } else {
            openFile(node.id);
        }
    };

    const handleDragStart = (e: React.DragEvent, node: FileNode) => {
        // Prevent dragging root level folders
        if (filterRootFolders && filterRootFolders.includes(node.name)) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('application/node-id', node.id);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedNodeId(node.id);
    };

    const handleDragEnd = () => {
        setDraggedNodeId(null);
        setDragOverTargetId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    
    const handleDragEnter = (e: React.DragEvent, targetNode: FileNode) => {
        e.preventDefault();
        if (draggedNode && targetNode.id !== draggedNode.id && targetNode.type === 'folder') {
             setDragOverTargetId(targetNode.id);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverTargetId(null);
    };

    const handleDrop = (e: React.DragEvent, targetNode: FileNode) => {
        e.preventDefault();
        setDragOverTargetId(null);
        
        const droppedNodeId = e.dataTransfer.getData('application/node-id');
        
        if (!droppedNodeId || !draggedNode) return;
        if (droppedNodeId === targetNode.id) return;
        if (targetNode.type !== 'folder') return;
        if (targetNode.id === rootNode.id) return;

        if (draggedNode.type === 'folder' && isDescendant(draggedNode, targetNode.id)) {
            console.error("Cannot move a folder into its own child.");
            return;
        }
        
        moveNode(droppedNodeId, targetNode.id);
    };

    const renderNode = (node: FileNode, level = 0): React.ReactElement | null => {
      if (level === 1 && filterRootFolders && !filterRootFolders.includes(node.name)) {
        return null;
      }

      const isFolder = node.type === 'folder';
      // Only nodes inside the main categories are draggable. Roots are level 1.
      const isDraggable = level > 1; 
      // Protect root folders from rename/delete
      const isProtected = PROTECTED_FOLDERS.includes(node.name) && level === 1;
      
      const isPotentiallyADropTarget = isFolder && node.id !== rootNode.id;
      const isSelf = draggedNodeId === node.id;
      const isDescendantOfDragged = draggedNode && draggedNode.type === 'folder' ? isDescendant(draggedNode, node.id) : false;
      const isDropTarget = isPotentiallyADropTarget && draggedNodeId && !isSelf && !isDescendantOfDragged;

      const isOpen = expandedFolders.has(node.id);

      return (
        <div key={node.id}>
            <div
                className={`flex items-center space-x-2 py-1.5 px-2 group hover:bg-gray-100 rounded relative cursor-pointer ${
                    activeFileId === node.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                } ${isDropTarget && dragOverTargetId === node.id ? 'bg-blue-100' : ''}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => handleNodeClick(node)}
                draggable={isDraggable}
                onDragStart={isDraggable ? (e) => handleDragStart(e, node) : undefined}
                onDragEnd={isDraggable ? handleDragEnd : undefined}
                onDragOver={isDropTarget ? handleDragOver : undefined}
                onDragEnter={isDropTarget ? (e) => handleDragEnter(e, node) : undefined}
                onDragLeave={isDropTarget ? handleDragLeave : undefined}
                onDrop={isDropTarget ? (e) => handleDrop(e, node) : undefined}
            >
                {node.type === 'folder' ? (
                    <>
                        {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        {isOpen ? (
                            <FolderOpen className={`w-4 h-4 ${level === 1 ? 'text-blue-600' : 'text-blue-500'} flex-shrink-0`} />
                        ) : (
                            <Folder className={`w-4 h-4 ${level === 1 ? 'text-blue-600' : 'text-blue-500'} flex-shrink-0`} />
                        )}
                    </>
                ) : (
                    <>
                        <div className="w-4 flex-shrink-0" />
                        {React.createElement(getFileIcon(node.extension), {
                            className: `w-4 h-4 ${getFileColor(node.extension)} flex-shrink-0`
                        })}
                    </>
                )}
                <span className="text-sm font-medium flex-1 truncate">{node.name}</span>
                
                {/* Action Buttons */}
                {level > 0 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 p-0.5 rounded shadow-sm border border-gray-200">
                      {/* Only show Duplicate/Rename/Delete if allowed */}
                      {/* For files: allow all. For folders: allow Rename/Delete only if NOT protected */}
                      <button title="Duplicate" onClick={(e) => { e.stopPropagation(); handleOpenModal('duplicate', node); }} className="p-1 hover:bg-gray-200 rounded"><Copy className="w-3 h-3" /></button>
                      
                      {!isProtected && (
                          <>
                            <button title="Rename" onClick={(e) => { e.stopPropagation(); handleOpenModal('rename', node); }} className="p-1 hover:bg-gray-200 rounded"><Edit2 className="w-3 h-3" /></button>
                            <button title="Delete" onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', node); }} className="p-1 hover:bg-gray-200 rounded"><Trash2 className="w-3 h-3 text-red-500 hover:text-red-600" /></button>
                          </>
                      )}
                  </div>
                )}
            </div>
            {node.type === 'folder' && isOpen && node.children && (
                <div>
                    {node.children.map(child => renderNode(child, level + 1))}
                </div>
            )}
        </div>
    )};
    
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                    <div className="flex items-center space-x-1">
                        <motion.button
                            title="Refresh Files"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </motion.button>
                        <motion.button title="New Folder" onClick={handleShowAddFolderModal} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                            <Folder className="w-4 h-4" />
                        </motion.button>
                        <motion.button title="New File" onClick={handleShowAddFileModal} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                            <Plus className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {renderNode(rootNode)}
            </div>
            <AnimatePresence>
                <ActionModal 
                    modalState={modalState}
                    onClose={handleCloseModal}
                    onConfirm={handleConfirmModal}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    availableFolders={availableFolders}
                    newFileParentId={newFileParentId}
                    setNewFileParentId={setNewFileParentId}
                />
            </AnimatePresence>
        </div>
    );
};

export default FileTree;
