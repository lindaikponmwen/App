
import React, { useState, useEffect } from 'react';
import { 
  X, Activity, Folder, FileText, User 
} from 'lucide-react';
import { 
  getExperimentsForUser, 
  getCurrentUserProfile 
} from '../data/mockData';
import { projectService, ProjectStats } from '../services/projectService';

interface ProjectStatsPanelProps {
  isExtended: boolean;
  onToggleExtend: () => void;
  onCloseDetails?: () => void;
}

export default function ProjectStatsPanel({ isExtended, onToggleExtend, onCloseDetails }: ProjectStatsPanelProps) {
  const [dashboardStats, setDashboardStats] = useState<ProjectStats | null>(null);
  const currentUser = getCurrentUserProfile();
  const experiments = getExperimentsForUser();

  useEffect(() => {
    loadDashboardStats();
  }, []);

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

          <div className="bg-white border border-gray-200 p-5 rounded-none">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Status Breakdown</h3>
            <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );
}
