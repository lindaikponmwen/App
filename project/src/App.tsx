
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from './hooks/useIsMobile';
import MobileWarning from './components/MobileWarning';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LibraryPage from './components/LibraryPage';
import SearchPage from './components/SearchPage';
import FileSearchPage from './components/FileSearchPage';
import AnalysisScriptsAndData from './components/AnalysisScriptsAndData';
import DataAnalysisPlanPage from './components/DataAnalysisPlanPage';
import ReportsPage from './components/ReportsPage';
import PresentationsPage from './components/PresentationsPage';
import WorkflowsPage from './components/WorkflowsPage';
import { loader } from '@monaco-editor/react';
import { setupMonaco } from './editor/setup';
import { useSettings } from './contexts/SettingsContext';
import SettingsPage from './components/SettingsPage';
import { useFiles, FileNode } from './contexts/FileContext';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import ProjectDownloadModal from './components/ProjectDownloadModal';
import ShareModal from './components/ShareModal';
import JSZip from 'jszip';
import StartupModal from './welcome/StartupModal';
import HelpModal from './components/HelpModal';
// Tasker Imports
import { TaskProvider } from './Tasker/TaskContext';
import TaskModal from './Tasker/TaskModal';
import Toast from './Tasker/Toast';
import { Loader2 } from 'lucide-react';
import ProjectNotFoundModal from './components/ProjectNotFoundModal';
import { getProjectIdFromUrl } from './data/appConfig';

loader.init().then(monaco => {
  setupMonaco(monaco);
});
const ProjectStatusHandler: React.FC = () => {
    const { loading: projectLoading, projectFound } = useProject();
    const [isProjectNotFoundModalOpen, setIsProjectNotFoundModalOpen] = useState(false);

    useEffect(() => {
        if (!projectLoading && !projectFound) {
            setIsProjectNotFoundModalOpen(true);
        }
    }, [projectLoading, projectFound]);

    return (
        <ProjectNotFoundModal 
            isOpen={isProjectNotFoundModalOpen}
            onConfirm={() => setIsProjectNotFoundModalOpen(false)}
            projectId={getProjectIdFromUrl()}
        />
    );
};

function App() {
  const isMobile = useIsMobile();
  const getPathFromHash = () => window.location.hash.slice(1) || '/';
  const [pathname, setPathname] = useState(getPathFromHash());
  const { fileTree, closeFile } = useFiles();
  const prevPathnameRef = useRef(pathname);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStartupModalOpen, setIsStartupModalOpen] = useState(true);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  
  
  // --- PHP BACKEND AUTHENTICATION CHECK ---
  // This effect checks if the user's PHP session is still active.
  // It runs on initial load and then periodically every 5 minutes.
  // If the session is found to be invalid, it redirects to the login page.
  useEffect(() => {
    const verifySession = async () => {
      try {
        // The 'cache: "no-store"' header is important to prevent the browser
        // from caching the response and giving a stale authentication status.
        const response = await fetch('/project-api/verify-session.php', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          cache: 'no-store' 
        });
        if (!response.ok) {
            // If the server returns an error (e.g., 500), assume session is invalid.
            console.error('Session verification failed with status:', response.status);
            window.location.href = 'https://app.drlevy.ai/#/login';
            return;
        }

        const data = await response.json();

        if (!data.authenticated) {
          console.log('User session expired or invalid. Redirecting to login.');
          window.location.href = 'https://app.drlevy.ai/#/login';
        } else {
          console.log('User session is active.');
        }
      } catch (error) {
        console.error('Error during session verification:', error);
        // In case of a network error, it might be safer to redirect to login
        // as we cannot confirm the authentication status.
        window.location.href = 'https://app.drlevy.ai/#/login';
      }
    };

    // 1. Verify session on initial application load.
    verifySession();

    // 2. Set up a periodic check every 4 minutes.
    const intervalId = setInterval(verifySession, 4 * 60 * 1000); // 4 minutes in milliseconds

    // 3. Cleanup the interval when the component unmounts.
    return () => clearInterval(intervalId);
  }, []);
  // --- END OF AUTHENTICATION CHECK ---
 


  // Function to navigate between pages using hash routing
  const navigate = (path: string) => {
    const currentPath = getPathFromHash();
    if (path === currentPath) return;
    window.location.hash = path;
  };

  // Listen for hash changes to update the page content
  useEffect(() => {
    const handleHashChange = () => {
      setPathname(getPathFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  // Close the active file whenever navigating away from an editor page.
  useEffect(() => {
    const pagesWithEditor = ['/analysis', '/dap', '/reports', '/presentations'];
    const previousPageHadEditor = pagesWithEditor.includes(prevPathnameRef.current);

    if (previousPageHadEditor) {
        closeFile();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, closeFile]);

  // Handle file selection from search
  const handleFileSelect = (path: string) => {
    navigate(path);
  };

  const projectStats = useMemo(() => {
    let files = 0;
    let folders = 0;
    let totalSize = 0;

    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'folder') {
          folders++;
          if (node.children) {
            traverse(node.children);
          }
        } else {
          files++;
          totalSize += node.size || 0;
        }
      }
    };

    if (fileTree.children) {
      traverse(fileTree.children);
    }
    
    return { files, folders, totalSize };
  }, [fileTree]);

  const handleConfirmDownload = async () => {
    const zip = new (JSZip as any)();
    const rootFolderName = fileTree.name || 'project';
    const projectFolder = zip.folder(rootFolderName);

    if (!projectFolder) {
      console.error("Failed to create root folder in zip.");
      return;
    }

    const addNodeToZip = (node: FileNode, currentFolder: any) => {
      if (node.type === 'folder') {
        const folder = currentFolder.folder(node.name);
        if (folder && node.children) {
          node.children.forEach((child: FileNode) => addNodeToZip(child, folder));
        }
      } else {
        currentFolder.file(node.name, node.content || '');
      }
    };
    
    fileTree.children?.forEach(node => addNodeToZip(node, projectFolder));

    const content = await zip.generateAsync({ type: 'blob' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${rootFolderName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // Show mobile warning on mobile devices
  if (isMobile) {
    return <MobileWarning />;
  }

  const renderContent = () => {
    switch (pathname) {
      case '/library':
        return <LibraryPage />;
      case '/search':
        return <SearchPage />;
      case '/file-search':
        return <FileSearchPage onFileSelect={handleFileSelect} />;
      case '/analysis':
        return (
          <div className="flex-1 flex overflow-hidden">
            <AnalysisScriptsAndData />
          </div>
        );
      case '/dap':
        return <DataAnalysisPlanPage onNavigate={navigate} />;
      case '/reports':
        return <ReportsPage onNavigate={navigate} />;
      case '/presentations':
        return <PresentationsPage onNavigate={navigate} />;
      case '/workflows':
        return <WorkflowsPage />;
      case '/settings':
        return <SettingsPage />;
      case '/':
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <ProjectProvider>
      <TaskProvider>
                <div className={`h-screen overflow-hidden bg-gray-50 flex flex-col font-sans transition-all duration-300 ${isStartupModalOpen || isHelpModalOpen || isTaskModalOpen || isShareModalOpen ? 'blur-sm' : ''}`}>
          <Header 
            pathname={pathname} 
            onNavigate={navigate} 
            onDownloadProject={() => setIsDownloadModalOpen(true)}
            onShare={() => setIsShareModalOpen(true)}
          />
          
          <div className="flex-1 flex relative overflow-hidden min-h-0">
            <Sidebar 
              pathname={pathname} 
              onNavigate={navigate} 
              onHelpClick={() => setIsHelpModalOpen(true)} 
              onStartupModalClick={() => setIsStartupModalOpen(true)}
              onTaskClick={() => setIsTaskModalOpen(true)}
            />
            
            <motion.div 
              className="flex-1 flex overflow-hidden"
              {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 0.3 }
              } as any}
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
        <ProjectDownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          onConfirm={handleConfirmDownload}
          stats={projectStats}
        />
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
        <StartupModal 
          isOpen={isStartupModalOpen}
          onClose={() => setIsStartupModalOpen(false)}
          onNavigate={navigate}
          stats={projectStats}
        />
        <HelpModal 
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
        />
        <TaskModal 
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
        />
        <ProjectStatusHandler />
        <Toast />
      </TaskProvider>
    </ProjectProvider>
  );
}

export default App;
