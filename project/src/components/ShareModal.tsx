import React, { useState, useMemo } from 'react';
import { X, Share2, User, CheckCircle2, Folder, CheckSquare, Square } from 'lucide-react';
import { useFiles, FileNode } from '../contexts/FileContext';
import { teamMembers, currentUser } from '../data/appConfig';
import StandardAccountLimits from './StandardAccountLimits';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { fileTree } = useFiles();
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [actionType, setActionType] = useState<'review' | 'approval' | 'share'>('share');
  const [isSharing, setIsSharing] = useState(false);
  const isFreeUser = currentUser.level === 'free';

  // Get all folders for selection
  const folders = useMemo(() => {
    const collectedFolders: { id: string; name: string; path: string }[] = [];
    const traverse = (node: FileNode, path: string) => {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      if (node.type === 'folder') {
        collectedFolders.push({ id: node.id, name: node.name, path: currentPath });
        if (node.children) {
          node.children.forEach(child => traverse(child, currentPath));
        }
      }
    };
    if (fileTree.children) {
      fileTree.children.forEach(child => traverse(child, ''));
    }
    return collectedFolders;
  }, [fileTree]);

  // Get files in selected folder
  const filesInFolder = useMemo(() => {
    if (!selectedFolderId) return [];
    
    let folderNode: FileNode | null = null;
    const findNode = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.id === selectedFolderId) {
          folderNode = node;
          return;
        }
        if (node.children) findNode(node.children);
      }
    }
    if (fileTree.children) findNode(fileTree.children);

    if (!folderNode || !folderNode.children) return [];
    return folderNode.children.filter(child => child.type === 'file');
  }, [selectedFolderId, fileTree]);

  const handleToggleUser = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  const handleToggleFile = (fileId: string) => {
    const newSet = new Set(selectedFileIds);
    if (newSet.has(fileId)) {
        newSet.delete(fileId);
    } else {
        newSet.add(fileId);
    }
    setSelectedFileIds(newSet);
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedFolderId(e.target.value);
      setSelectedFileIds(new Set()); // Reset files when folder changes
  }

  const handleShare = () => {
    // Validation check
    if (selectedFileIds.size === 0 || selectedUserIds.size === 0) return;
    
    setIsSharing(true);
    
    // Construct JSON payload
    const shareData = {
        folderId: selectedFolderId,
        files: Array.from(selectedFileIds),
        recipients: Array.from(selectedUserIds),
        action: actionType,
        timestamp: new Date().toISOString()
    };

    // Simulate API call and logging
    setTimeout(() => {
      console.log(JSON.stringify(shareData, null, 2));
      
      setIsSharing(false);
      onClose();
      // Reset state
      setSelectedFolderId('');
      setSelectedFileIds(new Set());
      setSelectedUserIds(new Set());
      setActionType('share');
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white shadow-2xl w-full max-w-lg overflow-hidden flex flex-col rounded-none">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-none">
              <Share2 className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Share Project Files</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isFreeUser ? (
            <StandardAccountLimits />
        ) : (
            <>
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                  
                  {/* Folder & File Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Folder className="w-4 h-4 mr-2" />
                      Select Folder
                    </label>
                    <select
                      value={selectedFolderId}
                      onChange={handleFolderChange}
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white rounded-none mb-4"
                    >
                      <option value="">-- Choose a folder --</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.path}</option>
                      ))}
                    </select>

                    {selectedFolderId && (
                        <div className="border border-gray-200 p-3 bg-gray-50 rounded-none max-h-40 overflow-y-auto">
                            {filesInFolder.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No files in this folder.</p>
                            ) : (
                                filesInFolder.map(file => (
                                    <div 
                                        key={file.id} 
                                        className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleToggleFile(file.id)}
                                    >
                                        {selectedFileIds.has(file.id) 
                                            ? <CheckSquare className="w-4 h-4 text-blue-600" />
                                            : <Square className="w-4 h-4 text-gray-400" />
                                        }
                                        <span className="text-sm text-gray-700">{file.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                  </div>

                  {/* Action Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Action</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'share', label: 'Share Code' },
                        { id: 'review', label: 'Request Review' },
                        { id: 'approval', label: 'Request Approval' }
                      ].map(action => (
                        <button
                          key={action.id}
                          onClick={() => setActionType(action.id as any)}
                          className={`px-3 py-2 text-sm font-medium border transition-all rounded-none ${
                            actionType === action.id
                              ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* User Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Select Recipients
                    </label>
                    <div className="border border-gray-200 divide-y divide-gray-100 max-h-48 overflow-y-auto rounded-none">
                      {teamMembers.map(user => (
                        <div
                          key={user.id}
                          onClick={() => handleToggleUser(user.id)}
                          className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUserIds.has(user.id) ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 overflow-hidden rounded-none">
                              {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.initials}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.level}</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 border flex items-center justify-center transition-colors rounded-none ${
                            selectedUserIds.has(user.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                          }`}>
                            {selectedUserIds.has(user.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={selectedFileIds.size === 0 || selectedUserIds.size === 0 || isSharing}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center rounded-none"
                  >
                    {isSharing ? 'Sharing...' : 'Share'}
                  </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
}
