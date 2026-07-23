import React, { useState, useEffect, DragEvent, useMemo } from 'react';
import { Archive, FileUp, BookOpen, X, ChevronDown, Quote, ExternalLink, File as FileIcon, FileText, FileArchive, Presentation, FileSpreadsheet, Code, UploadCloud, Trash2, Loader2, Folder, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFiles, FileNode } from '../contexts/FileContext';
import { format } from 'date-fns';
import { currentUser } from '../data/appConfig';
import CsvEditor from '../plugin/csv/CsvEditor';
import { useSettings } from '../contexts/SettingsContext';

// This interface should ideally be in a shared types file
interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  publishDate: string;
  abstract?: string;
  doi?: string;
  pmcid?: string;
  keywords?: string[];
  url: string;
  pdfAvailable?: boolean;
  pmcUrl?: string;
  citationCount?: number;
}

interface StoredLibraryFile {
  name: string;
  type: string; // MIME type
  size: number; // in bytes
  content: string; // content as data URL
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(bytes)) return 'N/A';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv': case 'xlsx': case 'xls': return FileSpreadsheet;
      case 'zip': case 'gz': case 'rar': return FileArchive;
      case 'ppt': case 'pptx': return Presentation;
      case 'doc': case 'docx': return FileText;
      case 'pdf': return FileText;
      case 'txt': case 'md': return FileText;
      case 'r': case 'py': case 'js': return Code;
      default: return FileIcon;
    }
};

const getFileColor = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv': case 'xlsx': case 'xls': return 'text-green-500';
      case 'zip': case 'gz': case 'rar': return 'text-yellow-500';
      case 'ppt': case 'pptx': return 'text-orange-500';
      case 'doc': case 'docx': return 'text-blue-500';
      case 'pdf': return 'text-red-500';
      default: return 'text-gray-500';
    }
};

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
  });
};


export default function LibraryPage() {
  const { fileTree } = useFiles();
  const { settings } = useSettings();
  const [savedArticles, setSavedArticles] = useState<PubMedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [myFiles, setMyFiles] = useState<StoredLibraryFile[]>([]);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [selectedArticle, setSelectedArticle] = useState<PubMedArticle | null>(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<StoredLibraryFile | null>(null);
  const [isArticleInfoCollapsed, setIsArticleInfoCollapsed] = useState(true);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const TOTAL_STORAGE_GB = 1;
  const TOTAL_STORAGE_BYTES = TOTAL_STORAGE_GB * 1024 * 1024 * 1024;

  const projectStorage = useMemo(() => {
    const calculateNodeSize = (node: FileNode): number => {
      if (node.type === 'file') {
        return node.size || 0;
      }
      if (node.children) {
        return node.children.reduce((acc, child) => acc + calculateNodeSize(child), 0);
      }
      return 0;
    };

    const projectRegex = /^user-.*-pkpd-project-.*$/;
    if (!fileTree || !projectRegex.test(fileTree.name)) {
      return { totalUsedBytes: 0, breakdown: [] };
    }
    
    const totalUsedBytes = calculateNodeSize(fileTree);

    const breakdown = (fileTree.children || []).map(folder => ({
      name: folder.name,
      size: calculateNodeSize(folder),
    })).sort((a,b) => b.size - a.size);

    return { totalUsedBytes, breakdown };

  }, [fileTree]);

  const usedStorageGB = projectStorage.totalUsedBytes / (1024 * 1024 * 1024);
  const storagePercentage = (projectStorage.totalUsedBytes / TOTAL_STORAGE_BYTES) * 100;

  const userFirstName = currentUser.name.split(' ')[0];

  // Load saved publications
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    try {
      const referencesFile = fileTree.children?.find(node => node.name === '.references' && node.type === 'file');
      if (referencesFile && referencesFile.content) {
        const parsedArticles: PubMedArticle[] = JSON.parse(referencesFile.content);
        setSavedArticles(parsedArticles.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()));
      } else {
        setSavedArticles([]);
      }
    } catch (e) {
      console.error("Failed to parse .references file:", e);
      setError("Could not load saved articles. The .references file might be corrupted.");
      setSavedArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [fileTree]);

  // Load My Files from localStorage
  useEffect(() => {
    try {
      const storedFiles = localStorage.getItem('drleveyai-my-files');
      if (storedFiles) {
        const parsedFiles: StoredLibraryFile[] = JSON.parse(storedFiles);
        setMyFiles(parsedFiles);
      }
    } catch (e) {
      console.error("Failed to load 'My Files' from localStorage:", e);
    }
  }, []);

  const handleArticleSelect = (article: PubMedArticle) => {
    setSelectedArticle(article);
    setIsArticleInfoCollapsed(true);
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
  };

  // Upload Modal Handlers
  const handleOpenUploadModal = () => {
    setFilesToUpload([]);
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    if (isUploading) return;
    setIsUploadModalOpen(false);
  };

  const handleFileSelect = (newFiles: FileList | null) => {
    if (newFiles) {
      setFilesToUpload(prev => [...prev, ...Array.from(newFiles)]);
    }
  };

  const handleRemoveFileToUpload = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleUploadFiles = async () => {
    if (filesToUpload.length === 0) return;
    setIsUploading(true);
    try {
        const fileMap = new Map<string, StoredLibraryFile>();
        
        myFiles.forEach(file => {
            fileMap.set(file.name, file);
        });
        
        for (const file of filesToUpload) {
            const content = await readFileAsDataURL(file);
            fileMap.set(file.name, {
                name: file.name,
                type: file.type,
                size: file.size,
                content: content,
            });
        }
        
        const finalFiles = Array.from(fileMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        setMyFiles(finalFiles);
        localStorage.setItem('drleveyai-my-files', JSON.stringify(finalFiles));
    } catch (error) {
        console.error("File upload failed:", error);
    } finally {
        setIsUploading(false);
        handleCloseUploadModal();
    }
  };

  const handleDeleteFile = (fileName: string) => {
    const updatedFiles = myFiles.filter(f => f.name !== fileName);
    setMyFiles(updatedFiles);
    localStorage.setItem('drleveyai-my-files', JSON.stringify(updatedFiles));
    setSelectedFileForPreview(null); // Close modal
  };

  const renderPreview = (file: StoredLibraryFile) => {
    const { type, content, name, size } = file;
    const fileExtension = name.split('.').pop()?.toLowerCase() || '';
  
    if (type.startsWith('image/')) {
      return <img src={content} alt={`Preview of ${name}`} className="max-w-full max-h-full mx-auto object-contain" />;
    }
  
    if (type === 'application/pdf') {
      return <iframe src={content} className="w-full h-full border-0" title={`Preview of ${name}`} />;
    }

    if (type === 'text/csv' || fileExtension === 'csv') {
      try {
        const base64Data = content.split(',')[1];
        if (!base64Data) throw new Error("CSV content is not in base64 format.");
        const decodedContent = atob(base64Data);
        return (
          <CsvEditor
            content={decodedContent}
            onContentChange={() => {}} // Read-only
            theme={settings.theme}
            readOnly={true}
          />
        );
      } catch (e) {
        console.error("Failed to decode or render CSV content:", e);
        // Fallback to unsupported view below
      }
    }
  
    const textExtensions = ['txt', 'md', 'py', 'r', 'js', 'html', 'css', 'json', 'xml'];
    if (type.startsWith('text/') || textExtensions.includes(fileExtension)) {
      try {
        // Data URL format: data:[<mediatype>][;base64],<data>
        const base64Data = content.split(',')[1];
        if (!base64Data) throw new Error("Content is not in base64 format.");
        const decodedContent = atob(base64Data);
        return <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 p-4">{decodedContent}</pre>;
      } catch (e) {
        console.error("Failed to decode text file content:", e);
        // Fallback to unsupported view
      }
    }
  
    // Unsupported file view
    const Icon = getFileIcon(name);
    const color = getFileColor(name);
    return (
      <div className="text-center flex flex-col items-center justify-center h-full">
        <div className={`p-4 bg-gray-100 mb-4`}>
          <Icon className={`w-16 h-16 ${color}`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Preview not available</h3>
        <p className="text-gray-500 mt-1">Cannot display a preview for this file type.</p>
        <div className="mt-4 text-sm text-gray-600 bg-gray-100 p-3 inline-block">
          {name} &middot; {formatFileSize(size)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-1 p-6 bg-white border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to your Library, {userFirstName}</h1>
          <p className="text-gray-600">Manage your personal files, saved publications, and research materials.</p>
        </div>
      </div>

      <div className="p-6">
        {/* Storage Indicator */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Project Storage</h2>
          <div className="bg-white p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <Archive className="w-4 h-4 mr-2 text-gray-500" />
                Total Storage
              </span>
              <span className="text-sm font-semibold text-gray-900">{usedStorageGB.toFixed(2)} GB of {TOTAL_STORAGE_GB} GB used</span>
            </div>
            <div className="w-full bg-gray-200 h-2.5">
              <div
                className="bg-blue-600 h-2.5"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <div className="mt-3 text-right">
              <button onClick={() => setIsBreakdownOpen(!isBreakdownOpen)} className="text-sm text-blue-600 hover:underline font-medium flex items-center justify-end w-full">
                  <span>{isBreakdownOpen ? 'Hide' : 'Show'} breakdown</span>
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isBreakdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <AnimatePresence>
              {isBreakdownOpen && (
                <motion.div
                  className="overflow-hidden"
                  {...{
                    initial: { height: 0, opacity: 0 },
                    animate: { height: 'auto', opacity: 1 },
                    exit: { height: 0, opacity: 0 }
                  } as any}
                >
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    {projectStorage.breakdown.map((folder, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Folder className="w-4 h-4 text-blue-500" />
                          <span>{folder.name}</span>
                        </div>
                        <span className="font-medium text-gray-800">{formatFileSize(folder.size)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* My Files Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">My Files</h2>
             <button 
                onClick={handleOpenUploadModal}
                className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
             >
                <FileUp className="w-4 h-4" />
                <span>Upload File</span>
             </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {myFiles.map((file, index) => {
              const Icon = getFileIcon(file.name);
              const color = getFileColor(file.name);
              return (
                <div
                  key={index}
                  className="p-4 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer bg-white"
                  onClick={() => setSelectedFileForPreview(file)}
                >
                  <div className="flex items-center">
                    <div className={`mr-4 p-2 bg-gray-100`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 truncate text-sm" title={file.name}>{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {myFiles.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200">
                <p className="text-gray-500">No personal files yet. Click "Upload File" to add some.</p>
            </div>
          )}
        </section>

        {/* Saved Publications Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Saved Publications</h2>
            <a href="#/search" className="text-sm font-medium text-blue-600 hover:underline">Find Articles</a>
          </div>
          <div className="bg-white border border-gray-200">
            <ul className="divide-y divide-gray-200">
              {isLoading ? (
                  <li className="p-4 text-center text-gray-500">Loading saved articles...</li>
              ) : error ? (
                  <li className="p-4 text-center text-red-500">{error}</li>
              ) : savedArticles.length === 0 ? (
                <li className="p-6 text-center text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-medium mb-1">No saved articles yet</p>
                    <p className="text-sm">
                        Go to the <a href="#/search" className="text-blue-600 hover:underline font-medium">Literature Search</a> page to find and save publications.
                    </p>
                </li>
              ) : (
                savedArticles.map((pub) => (
                  <li
                    key={pub.pmid}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleArticleSelect(pub)}
                  >
                    <div className="flex items-start">
                       <BookOpen className="w-5 h-5 text-gray-400 mr-4 mt-1 flex-shrink-0" />
                       <div className="flex-1">
                         <p className="font-semibold text-gray-800 leading-snug">{pub.title}</p>
                         <p className="text-xs text-gray-500 mt-1">{pub.authors.slice(0, 3).join(', ')}{pub.authors.length > 3 ? ' et al.' : ''}</p>
                         <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                           <span className="italic truncate pr-4">{pub.journal}</span>
                           <span>{format(new Date(pub.publishDate), 'MMM yyyy')}</span>
                         </div>
                       </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={handleCloseUploadModal}>
             <motion.div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-2xl flex flex-col shadow-xl"
                role="dialog" aria-modal="true" aria-labelledby="upload-modal-title"
                {...{
                    initial: { opacity: 0, scale: 0.9 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.9 }
                } as any}
             >
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 id="upload-modal-title" className="text-lg font-semibold text-gray-900">Upload Files</h3>
                    <button onClick={handleCloseUploadModal} disabled={isUploading} className="p-1 hover:bg-gray-100" aria-label="Close modal">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`p-8 border-2 border-dashed text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}
                    >
                        <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="font-semibold text-gray-700">Drag & drop files here</p>
                        <p className="text-sm text-gray-500 mt-1">or</p>
                        <label htmlFor="file-upload" className="mt-2 inline-block px-4 py-2 bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
                            Browse files
                        </label>
                        <input id="file-upload" type="file" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                    </div>
                    {filesToUpload.length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-semibold text-sm text-gray-800 mb-3">Files to upload ({filesToUpload.length})</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {filesToUpload.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-100">
                                        <div className="flex items-center space-x-3 truncate">
                                            <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                            <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xs text-gray-500 flex-shrink-0">{formatFileSize(file.size)}</span>
                                            <button onClick={() => handleRemoveFileToUpload(index)} className="p-1 text-gray-400 hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button onClick={handleCloseUploadModal} disabled={isUploading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleUploadFiles} disabled={filesToUpload.length === 0 || isUploading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center min-w-[100px] justify-center">
                       {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload'}
                    </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-3xl h-[90vh] flex flex-col shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="publication-modal-title"
              {...{
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.9 }
              } as any}
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-start">
                <h3 id="publication-modal-title" className="text-base font-semibold text-gray-900 pr-4 leading-tight">{selectedArticle.title}</h3>
                <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100" aria-label="Close modal">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <div className="border-b border-gray-200">
                  <button 
                      onClick={() => setIsArticleInfoCollapsed(!isArticleInfoCollapsed)}
                      className="w-full flex justify-between items-center text-left p-4 bg-gray-50 hover:bg-gray-100"
                      aria-expanded={!isArticleInfoCollapsed}
                  >
                      <h4 className="font-semibold text-gray-800 text-sm">Article Information</h4>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isArticleInfoCollapsed ? '' : 'rotate-180'}`} />
                  </button>
                  <AnimatePresence>
                      {!isArticleInfoCollapsed && (
                          <motion.div
                              className="overflow-hidden"
                              {...{
                                initial: { height: 0, opacity: 0 },
                                animate: { height: 'auto', opacity: 1 },
                                exit: { height: 0, opacity: 0 },
                                transition: { duration: 0.2 }
                              } as any}
                          >
                              <div className="p-4 space-y-3 text-sm bg-gray-50">
                                  <div>
                                      <strong className="text-gray-600 block mb-1">Authors:</strong>
                                      <p className="text-gray-500 leading-relaxed">{selectedArticle.authors.slice(0, 20).join(', ')}{selectedArticle.authors.length > 20 && ' et al.'}</p>
                                  </div>
                                  <div>
                                      <strong className="text-gray-600">Journal:</strong>
                                      <p className="text-gray-500 italic">{selectedArticle.journal}</p>
                                  </div>
                                  <div>
                                      <strong className="text-gray-600">Published:</strong>
                                      <p className="text-gray-500">{format(new Date(selectedArticle.publishDate), 'MMMM d, yyyy')}</p>
                                  </div>
                                  {selectedArticle.doi && (
                                      <div>
                                          <strong className="text-gray-600">DOI:</strong>
                                          <a href={`https://doi.org/${selectedArticle.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center space-x-1 break-all">
                                              <span>{selectedArticle.doi}</span>
                                              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                          </a>
                                      </div>
                                  )}
                                  {selectedArticle.citationCount !== undefined && (
                                      <div className="flex items-center space-x-2 pt-2">
                                          <Quote className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                          <span className="text-gray-600">Cited by <strong className="text-gray-800">{selectedArticle.citationCount}</strong> publications</span>
                                      </div>
                                  )}
                              </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Abstract</h4>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedArticle.abstract || 'No abstract available.'}</p>
                  
                  {selectedArticle.keywords && selectedArticle.keywords.length > 0 && (
                      <div className="mt-6">
                          <h4 className="font-semibold text-gray-800 mb-3 text-sm">Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                              {selectedArticle.keywords.map((kw, i) => <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium">{kw}</span>)}
                          </div>
                      </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedFileForPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedFileForPreview(null)}>
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-4xl h-[90vh] flex flex-col shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="preview-modal-title"
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                <h3 id="preview-modal-title" className="text-lg font-semibold text-gray-900 truncate pr-4">{selectedFileForPreview.name}</h3>
                <button onClick={() => setSelectedFileForPreview(null)} className="p-1 hover:bg-gray-100" aria-label="Close modal">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                {renderPreview(selectedFileForPreview)}
              </div>
               <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                  <button 
                    onClick={() => handleDeleteFile(selectedFileForPreview.name)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete File</span>
                  </button>
                  <a
                    href={selectedFileForPreview.content}
                    download={selectedFileForPreview.name}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}