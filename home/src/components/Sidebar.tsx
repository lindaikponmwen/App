import React, { useState } from 'react';
import {
  TrendingUp,
  Users as TeamIcon,
  Folder,
  BarChart3,
  User,
  Shield,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, hasPageAccess } from '../data/authData';
import NewProjectModal from './NewProjectModal';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
    { id: 'projects', icon: Folder, label: 'Projects' },
    { id: 'team-members', icon: TeamIcon, label: 'Team Members' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'administrative', icon: Shield, label: 'Administrative' }
  ];

  // Filter nav items based on user permissions
  const filteredNavItems = navItems.filter(item => {
    if (!currentUser) return false;
    return hasPageAccess(item.id, currentUser.role);
  });
  const handleNavClick = (itemId: string) => {
    // Double-check permissions before navigation
    if (!currentUser || !hasPageAccess(itemId, currentUser.role)) {
      return;
    }

    const routes: Record<string, string> = {
      'dashboard': '/',
      'projects': '/projects',
      'team-members': '/team-members',
      'profile': '/profile',
      'analytics': '/analytics',
      'administrative': '/administrative'
    };
    
    if (routes[itemId]) {
      navigate(routes[itemId]);
    }
    onViewChange(itemId);
  };

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-2">
      {/* New Project Button */}
      <motion.button
        onClick={() => setShowNewProjectModal(true)}
        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors mb-2"
        title="New Project"
      >
        <Plus className="w-5 h-5" />
      </motion.button>

      {filteredNavItems.map((item) => {
        const isActive = activeView === item.id;
        return (
          <motion.button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${
              isActive 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <item.icon className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          </motion.button>
        );
      })}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </div>
  );
}