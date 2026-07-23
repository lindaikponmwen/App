
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, Tag, BarChart3, FileText, Clock, CheckCircle, 
  AlertTriangle, PauseCircle, PlayCircle, User, Maximize2, Minimize2, 
  Activity, Folder, ExternalLink, Pencil, Save, X, Mail, Search, 
  Check, Briefcase, Trash2, Lock 
} from 'lucide-react';
import { 
  getExperimentsForUser, 
  getTeamMembersForUser, 
  getCurrentUserProfile, 
  availableAnalysisTypes, 
  allAvailableTeamMembers 
} from '../data/mockData';
import { getCurrentUser } from '../data/authData';
import ProfileModal from './ProfileModal';
import { useNavigate } from 'react-router-dom';
import { projectDetailsService } from '../services/projectDetailsService';
import { teamMembersService } from '../services/teamMembersService';
import { projectService, ProjectStats } from '../services/projectService';
import { dataService } from '../services/dataService';

interface ProjectDetailsProps {
  selectedProjectId: string | null;
  isExtended: boolean;
  onToggleExtend: () => void;
  onCloseDetails?: () => void;
}

// --- Reusable MultiSelect Component ---
interface MultiSelectOption {
  id: string;
  label: string;
  subLabel?: string;
  avatar?: string;
  initials?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (newIds: string[]) => void;
  placeholder?: string;
  renderOption?: (option: MultiSelectOption) => React.ReactNode;
  disabled?: boolean;
}

function MultiSelect({ options, selectedIds, onChange, placeholder = "Search...", renderOption, disabled = false }: MultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggle = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(sid => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeSelected = (id: string) => {
    if (disabled) return;
    onChange(selectedIds.filter(sid => sid !== id));
  };

  return (
    <div className={`w-full space-y-3 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      {/* Selected Pills Area */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {selectedIds.length > 0 ? selectedIds.map(id => {
          const option = options.find(o => o.id === id);
          if (!option) return null;
          return (
            <span
              key={id}
              className={`inline-flex items-center px-3 py-1 text-sm font-medium border ${
                disabled ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-100 text-blue-800 border-blue-200'
              }`}
            >
              {option.label}
              {!disabled && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeSelected(id); }}
                  className="ml-2 p-0.5 hover:bg-blue-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          );
        }) : (
          <span className="text-sm text-gray-400 py-1">No items selected</span>
        )}
      </div>

      {/* Search & List Container */}
      {!disabled && (
        <div className="border border-gray-300 overflow-hidden bg-white shadow-sm">
          {/* Search Input */}
          <div className="relative border-b border-gray-200 bg-gray-50">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-3 bg-transparent text-sm outline-none focus:bg-white transition-colors"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              {filteredOptions.length} results
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => handleToggle(option.id)}
                    className={`flex items-center px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0 border-gray-50 ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 border mr-3 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    
                    <div className="flex-1">
                      {renderOption ? renderOption(option) : (
                        <span className={`text-sm ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                          {option.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetails({ selectedProjectId, isExtended, onToggleExtend, onCloseDetails }: ProjectDetailsProps) {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedCollaborator, setSelectedCollaborator] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [pendingSaveSection, setPendingSaveSection] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<ProjectStats | null>(null);
  
  // Delete project state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUser = getCurrentUserProfile();
  const authUser = getCurrentUser();
  const teamMembers = getTeamMembersForUser();
  const experiments = getExperimentsForUser();

  const canManageMembers = authUser?.role === 'owner' || authUser?.role === 'administrator';
  const isMemberRole = authUser?.role === 'free';

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    // PHP Backend Integration (Commented Out for Development)
  
    try {
      const response = await dataService.getAllAvailableTeamMembers();
      if (response && response.length > 0) {
        setAllMembers(response);
        return;
      }
    } catch (err) {
      console.error('Failed to fetch organizational members from PHP registry:', err);
    }
  };

  // Determine selected project (prefer loaded data, fallback to mock list)
  const selectedProject = selectedProjectId
    ? projectData || experiments.find(exp => exp.id === selectedProjectId)
    : null;

  // Determine if current user is the owner/creator
  const isOwner = selectedProject && String(selectedProject.createdBy || selectedProject.created_by || '1') === String(currentUser.id);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData();
    } else {
      setProjectData(null);
      loadDashboardStats();
    }
  }, [selectedProjectId]);

  const loadDashboardStats = async () => {
    try {
      const stats = await projectService.getProjectStats();
      if (stats) {
        setDashboardStats(stats);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats from backend', error);
    }
  };

  const loadProjectData = async () => {
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      
      // Attempt to load from service
      let data;
      try {
        const response = await projectService.getProjectById(parseInt(selectedProjectId));
       if (response) {
        data = response;
      }
      } catch (err) {
        console.error('Failed to load project from backend:', err);
      }
     

      if (data) {
        // Cast to any to handle potential backend properties (snake_case vs camelCase)
        const projectDataAny: any = data;

        // Normalize data to ensure correct types and field mapping
        const normalizedData = {
          ...projectDataAny,
          // Handle dates (could be strings from JSON or Date objects)
          startDate: new Date(projectDataAny.startDate || projectDataAny.start_date || Date.now()),
          endDate: (projectDataAny.endDate || projectDataAny.end_date) ? new Date(projectDataAny.endDate || projectDataAny.end_date) : undefined,
          // Handle selectedMembers: ensure it's an array of strings
          selectedMembers: (projectDataAny.selectedMembers || []).map((id: any) => String(id)),
          // Ensure keywords and analysisTypes are arrays
          keywords: Array.isArray(projectDataAny.keywords) ? projectDataAny.keywords : [],
          analysisTypes: Array.isArray(projectDataAny.analysisTypes) ? projectDataAny.analysisTypes : [],
          // If backend provides populated members array, preserve it
          members: Array.isArray(projectDataAny.members) ? projectDataAny.members : [],
          // Map backend file count if available
          fileCount: projectDataAny.fileCount !== undefined ? projectDataAny.fileCount : (projectDataAny.files?.length || 0),
          // Ensure createdBy is available
          createdBy: projectDataAny.createdBy || projectDataAny.created_by
        };
        setProjectData(normalizedData);
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
      setProjectData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (user: any) => {
    // Navigate to profile page with inbox tab and specific conversation
    navigate(`/profile?tab=inbox&conversation=${user.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-700 bg-emerald-100';
      case 'completed': return 'text-blue-700 bg-blue-100';
      case 'paused': return 'text-orange-700 bg-orange-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getAllMembersList = () => {
    // Merge all potential sources of members to ensure we have a complete list for searching
    const uniqueMembers = new Map();
    
    // Add current user
    uniqueMembers.set(String(currentUser.id), currentUser);
    
    // Add currently loaded members from service
    allMembers.forEach(m => uniqueMembers.set(String(m.id), m));
    
    // Add team members from direct get
    teamMembers.forEach(m => uniqueMembers.set(String(m.id), m));

    // Add comprehensive list from mock data to ensure full search capability
    allAvailableTeamMembers.forEach(m => uniqueMembers.set(String(m.id), m));
    
    return Array.from(uniqueMembers.values());
  };

  const getProjectMembers = (project: any) => {
    if (!project) return [];
    
    // If project already has populated members (e.g. from backend join), use them
    if (project.members && project.members.length > 0) {
        // Ensure they have necessary display fields
        return project.members.map((m: any) => ({
            ...m,
            initials: m.initials || m.name?.split(' ').map((n:string) => n[0]).join('').substring(0,2).toUpperCase() || '??'
        }));
    }

    // Otherwise map from selectedMembers IDs
    const memberIds = project.selectedMembers || [];
    const availableMembers = getAllMembersList();
    return memberIds.map((id: string) => 
      availableMembers.find(member => String(member.id) === String(id))
    ).filter(Boolean);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCollaboratorClick = (collaborator: any) => {
    setSelectedCollaborator(collaborator);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedCollaborator(null);
  };

  const handleEditStart = (section: string, currentData: any) => {
    if (!isOwner) return;
    if (section === 'team' && !canManageMembers) return;
    setEditingSection(section);
    setEditData(currentData);
  };

  const handleEditCancel = () => {
    setEditingSection(null);
    setEditData({});
  };

  const handleEditSave = (section: string) => {
    setPendingSaveSection(section);
    setShowSaveConfirmation(true);
  };

  const executeSave = async () => {
    if (!selectedProjectId || !isOwner || !pendingSaveSection) return;

    setShowSaveConfirmation(false);

    try {
      setSaving(true);
      const section = pendingSaveSection;
      let success = false;

      // Update Service Call
      switch (section) {
        case 'title':
           success = await Promise.resolve(projectDetailsService.updateProject(selectedProjectId, {
            title: editData.title,
          }));
          break;
        case 'description':
          success = await Promise.resolve(projectDetailsService.updateProject(selectedProjectId, {
            description: editData.description,
          }));
          break;

        case 'timeline':
          success = await Promise.resolve(projectDetailsService.updateProject(selectedProjectId, {
            startDate: editData.startDate,
            endDate: editData.endDate || undefined,
          }));
          break;

        case 'team':
          if (!canManageMembers) {
            success = false;
            break;
          }
          success = await Promise.resolve(projectDetailsService.updateProjectMembers(
            selectedProjectId,
            editData.selectedMembers || []
          ));
          break;

        case 'analysis':
          success = await Promise.resolve(projectDetailsService.updateProject(selectedProjectId, {
            analysisTypes: editData.analysisTypes || [],
          }));
          break;
      }

      if (success) {
        await loadProjectData();
      }

      setEditingSection(null);
      setEditData({});
      setPendingSaveSection(null);

    } catch (error) {
      console.error(`Error saving ${pendingSaveSection}:`, error);
      alert(`Failed to save changes. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!selectedProjectId) return;
    setIsDeleting(true);
    try {
      // Call service
      const success = await Promise.resolve(projectDetailsService.deleteProject(selectedProjectId));
      if (success) {
        setShowDeleteConfirmation(false);
        if (onCloseDetails) onCloseDetails();
        // Force refresh to update lists
        window.location.reload(); 
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={`${isExtended ? 'w-full' : 'w-2/5'} bg-white border-l border-gray-200 flex flex-col transition-all duration-300`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project details...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD STATISTICS VIEW (When no project is selected) ---
  if (!selectedProject) {
    let totalProjects, completedProjects, activeProjects, pausedProjects, createdByMe, memberOf, completionRate, totalFiles;

    if (dashboardStats) {
      totalProjects = dashboardStats.totalProjects;
      completedProjects = dashboardStats.completedProjects;
      activeProjects = dashboardStats.activeProjects;
      pausedProjects = dashboardStats.pausedProjects;
      createdByMe = dashboardStats.createdByMe;
      memberOf = dashboardStats.memberOf;
      completionRate = dashboardStats.completionRate;
      totalFiles = dashboardStats.totalFiles;
    } else {
      // Calculate aggregate statistics from mock data
      totalProjects = experiments.length;
      completedProjects = experiments.filter(e => e.status === 'completed').length;
      activeProjects = experiments.filter(e => e.status === 'active').length;
      pausedProjects = experiments.filter(e => e.status === 'paused').length;
      createdByMe = experiments.filter(e => String(e.createdBy || '1') === String(currentUser.id)).length;
      memberOf = experiments.filter(e => String(e.createdBy || '1') !== String(currentUser.id)).length;
      
      completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
      totalFiles = experiments.reduce((acc, curr) => acc + (curr.fileCount || curr.files.length || 0), 0);
    }

    return (
      <div className={`${isExtended ? 'w-full' : 'w-2/5'} bg-white border-l border-gray-200 flex flex-col transition-all duration-300 h-full`}>
        <div className="pl-6 pt-6 pb-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Project Statistics</h2>
              <p className="text-gray-600 text-sm">Overview of your research portfolio</p>
            </div>
            {onCloseDetails && (
              <button
                onClick={onCloseDetails}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-6">
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 border border-gray-200 rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Total Projects</span>
                  <Folder className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{totalProjects}</div>
              </div>
              
              <div className="bg-white p-4 border border-gray-200 rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Completion</span>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{completionRate}%</div>
              </div>

              <div className="bg-white p-4 border border-gray-200 rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Created by Me</span>
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{createdByMe}</div>
              </div>

              <div className="bg-white p-4 border border-gray-200 rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Total Files</span>
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{totalFiles}</div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white border border-gray-200 p-5 rounded-none">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Status Breakdown</h3>
              <div className="space-y-4">
                {/* Active */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 flex items-center font-bold">
                      <div className="w-2 h-2 bg-emerald-500 mr-2"></div>
                      Active
                    </span>
                    <span className="font-black text-slate-900">{activeProjects}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5">
                    <div className="bg-emerald-500 h-1.5" style={{ width: `${totalProjects ? (activeProjects / totalProjects) * 100 : 0}%` }}></div>
                  </div>
                </div>

                {/* Completed */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 flex items-center font-bold">
                      <div className="w-2 h-2 bg-blue-500 mr-2"></div>
                      Completed
                    </span>
                    <span className="font-black text-slate-900">{completedProjects}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5">
                    <div className="bg-blue-500 h-1.5" style={{ width: `${totalProjects ? (completedProjects / totalProjects) * 100 : 0}%` }}></div>
                  </div>
                </div>

                {/* Paused */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 flex items-center font-bold">
                      <div className="w-2 h-2 bg-orange-500 mr-2"></div>
                      Paused
                    </span>
                    <span className="font-black text-slate-900">{pausedProjects}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5">
                    <div className="bg-orange-500 h-1.5" style={{ width: `${totalProjects ? (pausedProjects / totalProjects) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Breakdown */}
            <div className="bg-white border border-gray-200 p-5 rounded-none">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Role Distribution</h3>
              <div className="flex items-center space-x-8">
                <div className="flex-1 text-center border-r border-gray-100">
                  <div className="text-3xl font-black text-slate-900">{createdByMe}</div>
                  <div className="text-[9px] text-slate-500 mt-1 uppercase font-black tracking-widest">Owner</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-black text-slate-900">{memberOf}</div>
                  <div className="text-[9px] text-slate-500 mt-1 uppercase font-black tracking-widest">Collaborator</div>
                </div>
              </div>
            </div>

            {/* Quick Actions Note */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-none">
              <div className="flex items-start">
                <Activity className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Project Management</h4>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Select a project from the dashboard or list to view specific details, edit metadata, or manage team members.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  const projectMembers = getProjectMembers(selectedProject);

  return (
    <div className={`${isExtended ? 'w-full' : 'w-2/5'} bg-white border-l border-gray-200 flex flex-col transition-all duration-300 h-full`}>
      {/* Top Bar - Lavender Background */}
      <div className="bg-indigo-50 px-6 py-4 flex justify-between items-center border-b border-indigo-100">
        <div className="flex items-center space-x-4">
          {onCloseDetails && (
            <button
              onClick={onCloseDetails}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {isOwner && (
            <button
              onClick={handleDeleteClick}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Project"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(selectedProject.status)}`}>
            {selectedProject.status === 'active' && <PlayCircle className="w-3 h-3" />}
            {selectedProject.status === 'completed' && <CheckCircle className="w-3 h-3" />}
            {selectedProject.status === 'paused' && <PauseCircle className="w-3 h-3" />}
            <span className="capitalize">{selectedProject.status}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`p-8 space-y-8 ${isExtended ? 'max-w-5xl mx-auto' : ''}`}>
          
          {/* Header Section with Icon and Title */}
          <div>

            <div className="flex items-start justify-between mb-4">
              {editingSection === 'title' ? (
                <div className="flex-1 mr-4">
                  <input
                    type="text"
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full text-3xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                    autoFocus
                  />
                  <div className="flex space-x-2 mt-2">
                    <button onClick={() => handleEditSave('title')} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Save</button>
                    <button onClick={handleEditCancel} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Cancel</button>
                  </div>
                </div>
              ) : (
                <h1 className="text-3xl font-bold text-gray-900 leading-tight flex-1 mr-4">
                  {selectedProject.title}
                </h1>
              )}
              
              {editingSection !== 'title' && isOwner && (
                <button 
                  onClick={() => handleEditStart('title', { title: selectedProject.title })}
                  className="mt-2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Description */}
            <div className="relative group">
              {editingSection === 'description' ? (
                <div className="space-y-4">
                  <textarea
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-600 leading-relaxed"
                    rows={4}
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditSave('description')}
                      disabled={saving}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleEditCancel}
                      disabled={saving}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {selectedProject.description}
                  </p>
                  {isOwner && (
                    <button 
                      onClick={() => handleEditStart('description', { description: selectedProject.description })}
                      className="absolute top-0 -right-8 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* Project Files */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Folder className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Project Files</h3>
              </div>
              <a
                href={`/project/?project=${selectedProject.uid || selectedProject.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open explorer</span>
              </a>
            </div>
          </div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
              </div>
              {editingSection !== 'timeline' && isOwner && (
                <button
                  onClick={() => handleEditStart('timeline', { 
                    startDate: selectedProject.startDate ? selectedProject.startDate.toISOString().split('T')[0] : '',
                    endDate: selectedProject.endDate ? selectedProject.endDate.toISOString().split('T')[0] : ''
                  })}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {editingSection === 'timeline' ? (
              <div className="pl-11 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={editData.startDate || ''}
                      onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                    <input
                      type="date"
                      value={editData.endDate || ''}
                      onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditSave('timeline')}
                    disabled={saving}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleEditCancel}
                    disabled={saving}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pl-11 space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium text-gray-900">
                    {selectedProject.startDate && !isNaN(selectedProject.startDate.getTime()) 
                      ? selectedProject.startDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Not set'}
                  </span>
                </div>
                {selectedProject.endDate && !isNaN(selectedProject.endDate.getTime()) && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium text-gray-900">
                      {selectedProject.endDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">
                    {selectedProject.endDate && !isNaN(selectedProject.endDate.getTime()) && selectedProject.startDate && !isNaN(selectedProject.startDate.getTime())
                      ? `${Math.ceil((selectedProject.endDate.getTime() - selectedProject.startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                      : 'Ongoing'
                    }
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Team Members */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                {isMemberRole && (
                  <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-none shadow-sm">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Premium Only</span>
                  </div>
                )}
              </div>
              {editingSection !== 'team' && isOwner && canManageMembers && (
                <button
                  onClick={() => handleEditStart('team', { selectedMembers: selectedProject.selectedMembers })}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {editingSection === 'team' ? (
              <div className="pl-11 space-y-4">
                <MultiSelect 
                  disabled={!canManageMembers}
                  options={getAllMembersList().map(m => ({ 
                    id: String(m.id), 
                    label: m.name, 
                    subLabel: m.title,
                    avatar: m.avatar,
                    initials: m.initials
                  }))}
                  selectedIds={editData.selectedMembers || []}
                  onChange={(newIds) => setEditData({ ...editData, selectedMembers: newIds })}
                  placeholder={canManageMembers ? "Search team members..." : "Upgrade to add collaborators"}
                  renderOption={(option) => (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {option.avatar ? (
                          <img src={option.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : option.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.subLabel}</div>
                      </div>
                    </div>
                  )}
                />
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditSave('team')}
                    disabled={saving}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleEditCancel}
                    disabled={saving}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pl-11 space-y-4">
                {isMemberRole && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-none mb-2">
                    <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                      As a standard member, you have restricted access to multi-user collaboration tools. Only Project Owners and Administrators can invite other research collaborators to join a specific project.
                    </p>
                  </div>
                )}
                <div className={`${isExtended ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
                  {projectMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {member.initials}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.title}</div>
                        {member.id !== currentUser.id && (
                          <div className="mt-2">
                            <button
                              className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendMessage(member);
                              }}
                            >
                              <Mail className="w-4 h-4" />
                              <span>Message</span>
                            </button>
                          </div>
                        )}
                      </div>
                      {String(member.id) === String(currentUser.id) && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          You
                        </span>
                      )}
                    </div>
                  ))}
                  {projectMembers.length === 0 && (
                    <div className="text-sm text-gray-500">No team members assigned.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Keywords & Topics */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Keywords & Topics</h3>
            </div>
            <div className="pl-11 flex flex-wrap gap-2">
              {selectedProject.keywords.length > 0 ? (
                selectedProject.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                  >
                    {keyword}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500 italic">No keywords added</span>
              )}
            </div>
          </div>

          {/* Analysis Types */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Analysis Types</h3>
              </div>
              {editingSection !== 'analysis' && isOwner && (
                <button
                  onClick={() => handleEditStart('analysis', { analysisTypes: selectedProject.analysisTypes })}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {editingSection === 'analysis' ? (
              <div className="pl-11 space-y-4">
                <MultiSelect 
                  options={availableAnalysisTypes.map(type => ({ 
                    id: type, 
                    label: type 
                  }))}
                  selectedIds={editData.analysisTypes || []}
                  onChange={(newIds) => setEditData({ ...editData, analysisTypes: newIds })}
                  placeholder="Search analysis types..."
                />

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditSave('analysis')}
                    disabled={saving}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleEditCancel}
                    disabled={saving}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`pl-11 ${isExtended ? 'grid grid-cols-2 gap-2' : 'space-y-2'}`}>
                {selectedProject.analysisTypes.length > 0 ? (
                  selectedProject.analysisTypes.map((analysis, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-gray-900 font-medium">{analysis}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">No analysis types selected</span>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          isOpen={showProfileModal} 
          onClose={closeProfileModal}
          user={selectedCollaborator}
        />
      )}

      {/* Save Confirmation Modal */}
      <AnimatePresence>
        {showSaveConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 text-amber-600 mb-4">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Confirm Changes</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to save these changes? This action cannot be reversed.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                        setShowSaveConfirmation(false);
                        setPendingSaveSection(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeSave}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Confirm Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 text-red-600 mb-4">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Delete Project?</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you absolutely sure you want to delete <span className="font-semibold text-gray-900">{selectedProject.title}</span>? This action cannot be undone and will permanently delete all associated files and data.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirmation(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <span>Confirm Delete</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
