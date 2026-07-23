
import React, { useState } from 'react';
import { 
  LayoutDashboard,
  Library,
  NotepadText,
  FileCode,
  FileText,
  Presentation,
  HelpCircle,
  Rocket,
  CheckSquare,
  Workflow
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTasker } from '../Tasker/TaskContext';
import AiAssistantMenu from './AiAssistantMenu';

interface SidebarProps {
  pathname: string;
  onNavigate: (path: string) => void;
  onHelpClick: () => void;
  onStartupModalClick: () => void;
  onTaskClick: () => void;
}

export default function Sidebar({ pathname, onNavigate, onHelpClick, onStartupModalClick, onTaskClick }: SidebarProps) {
  // Use the Task Context to check for notifications
  // Using a safe access pattern in case Sidebar is rendered outside Provider (though it shouldn't be in this structure)
  let hasUnreadNotifications = false;
  try {
    const taskContext = useTasker();
    hasUnreadNotifications = taskContext.hasUnreadNotifications;
  } catch (e) {
    // Context might not be available during initial render/tests
  }

  const navItems = [
    { id: 'experiments', path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'data-analysis-plan', path: '/dap', icon: NotepadText, label: 'Data Analysis Plan' },
    { id: 'analysis-scripts-data', path: '/analysis', icon: FileCode, label: 'Analysis Scripts & Data' },
    { id: 'reports', path: '/reports', icon: FileText, label: 'Reports' },
    { id: 'presentations', path: '/presentations', icon: Presentation, label: 'Presentations' },
  ];

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-10">
      <div className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
              {...{ whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } as any}
            >
              <item.icon className="w-5 h-5" />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex-grow" />

      <div className="space-y-2">
        <motion.button
            onClick={() => onNavigate('/workflows')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${
              pathname === '/workflows' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
            title="Workflows"
            {...{ whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } as any}
        >
            <Workflow className="w-5 h-5" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Workflows
            </div>
        </motion.button>

        <motion.button
            onClick={() => onNavigate('/library')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${
              pathname === '/library' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
            title="Library"
            {...{ whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } as any}
        >
            <Library className="w-5 h-5" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Library
            </div>
        </motion.button>

        <motion.button
          onClick={onTaskClick}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          title="Tasks"
          {...{ whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } as any}
        >
          <div className="relative">
            <CheckSquare className="w-5 h-5" />
            {hasUnreadNotifications && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </div>
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            Tasks & Time
          </div>
        </motion.button>
        <motion.button
          onClick={onStartupModalClick}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          title="Project Builder"
          {...{ whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } as any}
        >
          <Rocket className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            Project Builder
          </div>
        </motion.button>
        <motion.button
          onClick={onHelpClick}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          title="Help"
          {...{ whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } as any}
        >
          <HelpCircle className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            Help
          </div>
        </motion.button>

        <AiAssistantMenu onStartupModalClick={onStartupModalClick} />
      </div>
    </div>
  );
}
