
import React from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Settings, LayoutGrid, FileArchive, Share2, ChevronDown } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';

interface HeaderProps {
  pathname: string;
  onNavigate: (path: string) => void;
  onDownloadProject: () => void;
  onShare: () => void;
}

const HeaderIcon: React.FC<{
  id: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}> = ({ id, label, icon: Icon, isActive, onClick }) => (
  <motion.button
    key={id}
    onClick={onClick}
    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${
      isActive
        ? 'bg-gray-800 text-white'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <div className="absolute top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
      {label}
    </div>
  </motion.button>
);


export default function Header({ pathname, onNavigate, onDownloadProject, onShare }: HeaderProps) {
  const { project } = useProject();

  const headerItems = [
    { id: 'file-search', path: '/file-search', icon: Search, label: 'Search Files' },
    { id: 'search', path: '/search', icon: BookOpen, label: 'Literature' },
    // Settings is rendered manually to allow insertion of Share button before it
  ];
  
  const handleAvatarClick = () => {
    window.location.href = '/';
  };

  return (
    <div className="h-[49px] bg-black flex items-center justify-between px-6 border-b border-gray-900">
      <div className="flex items-center space-x-4">
        <motion.div 
            className="cursor-pointer"
            onClick={() => onNavigate('/')}
        >
            <img src="https://drlevy.ai/logo2.png" alt="Dr Levy AI Logo" className="h-[24px] w-auto filter invert(1) opacity-90" />
        </motion.div>
        
        <div className="h-5 w-px bg-gray-800"></div>
        
        <div className="group relative flex items-center space-x-1 cursor-pointer py-1">
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate max-w-[200px] lg:max-w-[300px]">
                {project.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
            
            <div className="absolute top-full left-0 mt-2 w-max max-w-sm bg-gray-900 border border-gray-800 text-gray-300 text-xs px-3 py-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <span className="font-semibold text-gray-500 block mb-1">Active Project</span>
                {project.name}
            </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        
        <HeaderIcon
          id="download-project"
          label="Download Project"
          icon={FileArchive}
          isActive={false}
          onClick={onDownloadProject}
        />
        
        {headerItems.map((item) => (
          <HeaderIcon
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            isActive={pathname === item.path}
            onClick={() => onNavigate(item.path)}
          />
        ))}

        <HeaderIcon
          id="share-project"
          label="Share"
          icon={Share2}
          isActive={false}
          onClick={onShare}
        />

        <HeaderIcon
          id="settings"
          label="Settings"
          icon={Settings}
          isActive={pathname === '/settings'}
          onClick={() => onNavigate('/settings')}
        />

        <div className="w-px h-6 bg-gray-700 mx-2"></div>

        {/* User Avatar */}
        <motion.div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={handleAvatarClick}
        >
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium hover:bg-blue-500 transition-colors">
            <LayoutGrid className="w-5 h-5"/>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
