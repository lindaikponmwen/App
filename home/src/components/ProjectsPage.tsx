import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Users, ArrowLeft, Folder, FileText, ExternalLink, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { getExperimentsForUser } from '../data/mockData';
import { ExperimentItem } from '../types';
import ProjectDetails from './ProjectDetails';
import { projectService, Project } from '../services/projectService';

interface ProjectsPageProps {
  onBack: () => void;
  onProjectSelect: (projectId: string) => void;
}

export default function ProjectsPage({ onBack, onProjectSelect }: ProjectsPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useBackendData, setUseBackendData] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const projectRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [filteredProjects, setFilteredProjects] = useState<ExperimentItem[]>([]);

  // Listen for global project creation events
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('project-created', handleRefresh);
    return () => window.removeEventListener('project-created', handleRefresh);
  }, []);

  useEffect(() => {
    loadAllProjects();
  }, [refreshKey]);

  useEffect(() => {
    const state = location.state as { selectedProjectId?: string };
    if (state?.selectedProjectId) {
      setSelectedProjectId(state.selectedProjectId);
      setShowProjectDetails(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Scroll to selected project when it changes
  useEffect(() => {
    if (selectedProjectId && projectRefs.current[selectedProjectId]) {
      setTimeout(() => {
        projectRefs.current[selectedProjectId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [selectedProjectId]);

  const loadAllProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear the project lists immediately as requested
      setProjects([]);
      setFilteredProjects([]);

      // PHP Backend Integration (Commented out for development)
      
      try {
        const backendProjects = await projectService.getAllProjects();
        if (backendProjects && backendProjects.length > 0) {
          setProjects(backendProjects);
          setUseBackendData(true);
          setLoading(false);
          return;
        }
      } catch (phpError) {
        console.warn('Failed to load projects from PHP backend, using mock data fallback', phpError);
      }
      

      
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects from database');
      setProjects([]);
      setUseBackendData(false);
      setLoading(false);
    }
  };

  const convertBackendProjectToExperiment = (project: Project): ExperimentItem => {
    return {
      id: project.id.toString(),
      uid: project.uid,
      title: project.title,
      description: project.description || '',
      status: project.status,
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : undefined,
      keywords: project.keywords || [],
      analysisTypes: project.analysisTypes || [],
      selectedMembers: project.selectedMembers ? project.selectedMembers.map(String) : [],
      files: project.files?.map(f => ({
        id: f.id.toString(),
        name: f.name,
        type: f.type as 'model' | 'data' | 'script',
        content: '',
        lastModified: new Date(f.lastModified)
      })) || [],
      fileCount: project.fileCount || 0
    };
  };

  const getSourceProjects = () => {
    if (useBackendData && projects.length > 0) {
      return projects.map(convertBackendProjectToExperiment);
    }
    return getExperimentsForUser();
  };

  // Data synchronization after load
  useEffect(() => {
    if (!loading) {
      const currentProjects = getSourceProjects();
      const sortedProjects = currentProjects.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
      setFilteredProjects(sortedProjects);
    }
  }, [loading, projects, useBackendData]);

  const handleBackClick = () => {
    navigate('/');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterProjects(query);
  };

  const filterProjects = (query: string) => {
    let filtered = getSourceProjects();
    if (query.trim()) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        project.description.toLowerCase().includes(query.toLowerCase()) ||
        project.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
      );
    }

    filtered = filtered.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    setFilteredProjects(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
    const all = getSourceProjects().sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    setFilteredProjects(all);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paused': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleOpenFiles = (projectUid: string | undefined, projectId: string) => {
    const identifier = projectUid || projectId;
    const url = `/project/?project=${identifier}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleProjectDetails = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleCloseProjectDetailsPanel = () => {
    setShowProjectDetails(false);
    setSelectedProjectId(null);
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex">
      <div className={`${showProjectDetails ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={handleBackClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </button>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                  <p className="text-gray-600">Search and manage all your research projects</p>
                </div>
                {loading && (
                  <span className="text-sm text-gray-500 flex items-center">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating project lists...
                  </span>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Search Bar */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search projects by title, description, keywords..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
              </div>

              {/* Results Summary */}
              <div className="mb-6">
                <p className="text-gray-600">
                  {searchQuery ? (
                    <>
                      Found <span className="font-semibold text-gray-900">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''} 
                      {searchQuery && <span> for "<span className="font-medium">{searchQuery}</span>"</span>}
                    </>
                  ) : (
                    <>
                      Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1">
              <AnimatePresence>
                {filteredProjects.map((project) => {
                  const isSelected = selectedProjectId === project.id;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={project.id}
                      ref={el => { projectRefs.current[project.id] = el; }}
                      onClick={() => {
                        handleProjectDetails(project.id);
                        setShowProjectDetails(true);
                      }}
                      className={`p-6 mb-4 group transition-all duration-300 cursor-pointer rounded-lg ${
                        isSelected
                          ? 'bg-blue-50 border-2 border-blue-600 shadow-lg scale-[1.01]'
                          : 'bg-white border border-gray-200 shadow-md hover:border-blue-400 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {project.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{project.selectedMembers.length} collaborators</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{project.startDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{project.fileCount !== undefined ? project.fileCount : project.files.length} files</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {project.keywords.slice(0, 3).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {keyword}
                          </span>
                        ))}
                        {project.keywords.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            +{project.keywords.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFiles(project.uid, project.id);
                          }}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open Files</span>
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProjectDetails(project.id);
                            setShowProjectDetails(true);
                          }}
                          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                            isSelected 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <Info className="w-4 h-4" />
                          <span>Project Details</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 && !loading && (
              <div className="text-center py-12">
                <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'No projects available'}
                </p>
                {searchQuery && (
                  <motion.button
                    onClick={clearSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear search
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Project Details Panel */}
      {showProjectDetails && (
        <div className="w-1/2 border-l border-gray-200">
          <div className="h-full bg-white">
            <div className="h-full overflow-hidden">
              <ProjectDetails 
                selectedProjectId={selectedProjectId}
                isExtended={true}
                onToggleExtend={() => {}}
                onCloseDetails={handleCloseProjectDetailsPanel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
