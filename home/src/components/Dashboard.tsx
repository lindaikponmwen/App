import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Plus, Filter, Calendar, Users, ChevronUp, Check, BarChart3, Tag, MoreHorizontal, FolderPlus, FileText, Shield, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getExperimentsForUser } from '../data/mockData';
import { getCurrentUser } from '../data/authData';
import { Filter as FilterType } from '../types';
import NewProjectModal from './NewProjectModal';
import { projectService, Project } from '../services/projectService';

interface DashboardProps {
  onProjectSelect: (projectId: string) => void;
}

export default function Dashboard({ onProjectSelect }: DashboardProps) {
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const currentUser = getCurrentUser();
  const experiments = getExperimentsForUser();

  // Listen for global project creation events to trigger a refresh
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('project-created', handleRefresh);
    return () => window.removeEventListener('project-created', handleRefresh);
  }, []);

  // Load projects on component mount or when refreshKey changes
  useEffect(() => {
    loadRecentProjects();
  }, [refreshKey]);

  const loadRecentProjects = async () => {
    try {
      setLoading(true);
      // Clear the current list immediately as requested
      setRecentProjects([]);
      
      // PHP Backend Integration (Commented out for development)
      try {
        const projects = await projectService.getAllProjects();
        // Sort by updatedAt/createdAt and get top 2
        const sorted = projects.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || a.startDate).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt || b.startDate).getTime();
          return dateB - dateA;
        });
        setRecentProjects(sorted.slice(0, 2));
        setLoading(false);
        return;
      } catch (err) {
        console.warn('Backend fetch failed, using mock data fallback', err);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setLoading(false);
    }
  };

  const getDisplayProjects = () => {
    if (recentProjects.length > 0) {
      return recentProjects.map(project => ({
        id: project.id.toString(),
        title: project.title,
        description: project.description || '',
        status: project.status,
        startDate: new Date(project.startDate),
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        memberCount: project.selectedMembers?.length || 0,
        fileCount: project.fileCount || 0
      }));
    }
    // Fallback to mock experiments if state was cleared and no backend data returned
    return experiments.slice(0, 2).map(exp => ({
      id: exp.id,
      title: exp.title,
      description: exp.description,
      status: exp.status,
      startDate: exp.startDate,
      endDate: exp.endDate,
      memberCount: exp.selectedMembers.length,
      fileCount: exp.fileCount ?? exp.files.length
    }));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = currentUser?.name || 'there';

  const removeFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const handleProjectClick = (projectId: string) => {
    navigate('/projects', { state: { selectedProjectId: projectId } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paused': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="flex-1">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-1 p-6 bg-white border-b">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getGreeting()} {firstName}! Let's work on some projects.
              </h1>
              <p className="text-gray-600">Your latest pharmacokinetic research projects</p>
            </div>
          </div>
          {loading && (
            <span className="text-sm text-gray-500 flex items-center">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Refreshing projects...
            </span>
          )}
        </div>

        <div className="p-6">

          {/* Member Tier Notification - Sharp Edges, No Animations */}
        {currentUser?.role === 'free' && (
          <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-none shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 rounded-none flex-shrink-0">
                <Lock className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-1">Standard Account Limits</h3>
                <p className="text-sm text-blue-800 leading-relaxed mb-4">
                  As a standard research member, you are currently limited to creating <span className="font-bold">one project</span> and have restricted access to multi-user collaboration tools. Upgrade to a premium plan to unlock unlimited project creation, advanced analytics, and the ability to collaborate with external research teams.
                </p>
                <button 
                  onClick={() => navigate('/pricing')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors rounded-none"
                >
                  Explore Premium Features
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Project Section Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-1 h-8 bg-blue-600"></div>
            <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
          </div>
          <p className="text-sm text-gray-600 ml-4">Your 2 most recently created research projects</p>
        </div>

        {/* Experiments List */}
        <div className="space-y-4">
          {getDisplayProjects().map((experiment, index) => (
            <div
              key={experiment.id}
              className="bg-white border border-gray-200 overflow-hidden shadow-md transition-all duration-300 group cursor-pointer"
              onClick={() => handleProjectClick(experiment.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {experiment.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(experiment.status)}`}>
                        {experiment.status}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">{experiment.description}</p>

                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{experiment.memberCount} Collaborators</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>{experiment.fileCount} Files</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{experiment.startDate.toLocaleDateString()}</span>
                        {experiment.endDate && (
                          <>
                            <span>-</span>
                            <span>{experiment.endDate.toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Projects Button */}
        <motion.button
          onClick={() => navigate('/projects')}
          className="mt-6 w-full py-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors group flex items-center justify-center space-x-2"
        >
          <MoreHorizontal className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">View all projects</span>
        </motion.button>


        {/* New Project Modal */}
        <NewProjectModal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
        />
      </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white py-4 px-6 mt-auto">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Secure Application</span>
          </div>
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Zero Trust Architecture</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          By using this application, you agree to our Terms of Service and Privacy Policy.
          We operate on a zero-trust security model and do not share any data added to this site with third parties.
        </p>
      </div>
    </div>
  );
}
