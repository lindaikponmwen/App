import React, { useState } from 'react';
import { Search, FileText, Folder } from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { FileNode } from '../data/dashboardData';
import { motion, AnimatePresence } from 'framer-motion';

interface FileSearchPageProps {
  onFileSelect: (path: string) => void;
}

interface SearchResult extends FileNode {
  path: string;
  matchType: 'filename' | 'content';
  lineNumber?: number;
  lineContent?: string;
}

const FileSearchPage: React.FC<FileSearchPageProps> = ({ onFileSelect }) => {
  const { fileTree, openFile } = useFiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchFiles = (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];
    
    const searchRecursive = (items: FileNode[], path = '') => {
      items.forEach(item => {
        const currentPath = path ? `${path}/${item.name}` : item.name;
        
        if (item.type === 'file') {
          // Search in filename
          if (item.name.toLowerCase().includes(term.toLowerCase())) {
            results.push({
              ...item,
              path: currentPath,
              matchType: 'filename'
            });
          }
          
          // Search in content
          if (item.content && item.content.toLowerCase().includes(term.toLowerCase())) {
            const lines = item.content.split('\n');
            lines.forEach((line, index) => {
              if (line.toLowerCase().includes(term.toLowerCase())) {
                results.push({
                  ...item,
                  path: currentPath,
                  matchType: 'content',
                  lineNumber: index + 1,
                  lineContent: line.trim()
                });
              }
            });
          }
        }
        
        if (item.children) {
          searchRecursive(item.children, currentPath);
        }
      });
    };
    
    // Simulate a small delay for better UX
    setTimeout(() => {
        searchRecursive(fileTree.children || []);
        setSearchResults(results);
        setIsSearching(false);
    }, 300);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    searchFiles(term);
  };

  const handleResultClick = (result: SearchResult) => {
    openFile(result.id);
    
    const rootFolder = result.path.split('/')[0];
    let targetPath = '/analysis'; // Default fallback

    const dapFolders = ['Initial Plan', 'Final Plan'];
    const reportsFolders = ['Initial Reports', 'Final Reports'];
    const presentationsFolders = ['Abstracts', 'Posters', 'Talks'];
    // Analysis folders are Data, Models, Scripts, Results

    if (dapFolders.includes(rootFolder)) {
        targetPath = '/dap';
    } else if (reportsFolders.includes(rootFolder)) {
        targetPath = '/reports';
    } else if (presentationsFolders.includes(rootFolder)) {
        targetPath = '/presentations';
    } else {
        // Default to analysis for Data, Models, Scripts, Results and any others
        targetPath = '/analysis';
    }

    onFileSelect(targetPath);
  };
  
  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, index) => 
      regex.test(part) ? <mark key={index} className="bg-yellow-200 text-black px-1">{part}</mark> : part
    );
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0">
        <div className="p-6 bg-white border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Search Files</h2>
            <p className="text-gray-600 mt-1">Find content across all files in your project.</p>
        </div>
        <div className="p-6">
            <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search file names and content..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
            <AnimatePresence>
                {searchResults.length > 0 && (
                    <motion.div 
                        {...{
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            exit: { opacity: 0 }
                        } as any}
                    >
                        <h3 className="text-sm font-semibold text-gray-600 mb-4 px-1">
                            Found {searchResults.length} result{searchResults.length > 1 ? 's' : ''} for "{searchTerm}"
                        </h3>
                        <div className="space-y-2">
                            {searchResults.map((result, index) => (
                                <motion.div
                                    key={`${result.id}-${index}`}
                                    onClick={() => handleResultClick(result)}
                                    className="p-4 bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all"
                                    {...{
                                        initial: { opacity: 0, y: 10 },
                                        animate: { opacity: 1, y: 0 },
                                        transition: { delay: index * 0.05 }
                                    } as any}
                                >
                                    <div className="flex items-center space-x-3 mb-2">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        <span className="font-semibold text-gray-800">{highlightMatch(result.name, searchTerm)}</span>
                                        <span className="text-xs text-gray-400">{result.path}</span>
                                    </div>
                                    {result.matchType === 'content' && result.lineContent && (
                                        <div className="pl-7 text-sm text-gray-600 bg-gray-50 p-2">
                                            <span className="text-gray-400 mr-2">{result.lineNumber}:</span>
                                            <code className="whitespace-pre-wrap">{highlightMatch(result.lineContent, searchTerm)}</code>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {isSearching && (
                 <div className="text-center py-12 text-gray-500">
                    <p>Searching...</p>
                 </div>
            )}
            {!isSearching && searchTerm && searchResults.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>No results found for "{searchTerm}"</p>
                </div>
            )}
            {!searchTerm && (
                <div className="text-center py-12 text-gray-400">
                    <p>Start typing to search files.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default FileSearchPage;