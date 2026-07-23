
import React from 'react';
import { 
  Users, 
  ArrowRight, 
  NotepadText, 
  FileCode, 
  FileText, 
  Presentation, 
  Library, 
  Search, 
  BookOpen, 
  Settings, 
  LayoutGrid,
  Plus,
  ChevronDown,
  ArrowUp,
  Files,
  CalendarDays,
  Edit,
  BookText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FileNode } from '../data/dashboardData';
import { mockFileStructure as dashboardFiles } from '../data/dashboardData';
import { dapFileStructure } from '../data/dapData';
import { reportsFileStructure } from '../data/reportsData';
import { presentationsFileStructure } from '../data/presentationsData';
import { appConfig, currentUser } from '../data/appConfig';
import { useProject } from '../contexts/ProjectContext';
import Accordion from './ui/Accordion';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

const countFiles = (nodes: FileNode[]): number => {
  return nodes.reduce((acc, node) => {
    if (node.type === 'file') {
      return acc + 1 + (node.children ? countFiles(node.children) : 0);
    }
    return acc + (node.children ? countFiles(node.children) : 0);
  }, 0);
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { project, teamMembers } = useProject();
  const navigationItems = [
    {
      id: 'data-analysis-plan',
      path: '/dap',
      icon: NotepadText,
      title: 'Data Analysis Plan',
      description: 'Draft, review, and finalize statistical analysis plans and protocols.',
    },
    {
      id: 'analysis-scripts-data',
      path: '/analysis',
      icon: FileCode,
      title: 'Analysis Scripts & Data',
      description: 'Manage models, scripts, and datasets for your analysis projects.',
    },
    {
      id: 'reports',
      path: '/reports',
      icon: FileText,
      title: 'Reports',
      description: 'Generate, view, and manage interim and final study reports.',
    },
    {
      id: 'presentations',
      path: '/presentations',
      icon: Presentation,
      title: 'Presentations',
      description: 'Organize abstracts, posters, and talks for conferences and meetings.',
    },
    {
      id: 'library',
      path: '/library',
      icon: Library,
      title: 'Library',
      description: 'Access your personal files, saved publications, and research materials.',
    },
    {
      id: 'file-search',
      path: '/file-search',
      icon: Search,
      title: 'Search Files',
      description: 'Perform a deep search across all file contents in your project.',
    },
    {
      id: 'search',
      path: '/search',
      icon: BookOpen,
      title: 'Literature Search',
      description: 'Explore PubMed Central and other medical journals for relevant research.',
    },
    {
      id: 'settings',
      path: '/settings',
      icon: Settings,
      title: 'Settings',
      description: 'Customize your application and editor preferences for a tailored experience.',
    },
  ];

  const allProjectFiles = [
    ...dashboardFiles,
    ...dapFileStructure,
    ...reportsFileStructure,
    ...presentationsFileStructure,
  ];
  const totalFiles = countFiles(allProjectFiles);
  const totalMembers = teamMembers.length;
  const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });

  const handleEditProject = () => {
    window.location.href = `https://app.drlevy.ai/#/projects?project=${project.id}`;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-1  p-6 bg-white border-b">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{appConfig.dashboard.welcomeMessage}, {currentUser.name}!</h1>
            <div className="text-gray-600 flex items-center space-x-4 mt-1">
                <span className="flex items-center text-sm">
                    <Files className="w-4 h-4 mr-1.5 text-gray-500" />
                    Total of <b className="mx-1 text-gray-800">{totalFiles}</b> files
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center text-sm">
                    <Users className="w-4 h-4 mr-1.5 text-gray-500" />
                    <b className="mr-1 text-gray-800">{totalMembers}</b> team members
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center text-sm">
                    <CalendarDays className="w-4 h-4 mr-1.5 text-gray-500" />
                    {currentDate}
                </span>
            </div>
          </div>
        </div>
        <button 
            onClick={handleEditProject}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
            <Edit className="w-4 h-4 mr-2" />
            <span>Edit Project</span>
        </button>
      </div>

      <div className="p-6">
        {/* Project Info & Contributors section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project: {project.name}</h1>
          <div className="space-y-4">
            <Accordion
              title="Project Description"
              description="View detailed information about the project's goals and methodology."
              icon={BookText}
              defaultOpen={false}
              rounded={false}
            >
              <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none">
                <p>{project.description}</p>
              </div>
            </Accordion>

            {String(project.id) !== '61' && (
              <Accordion
                title="Contributors"
                description={`${teamMembers.length} team members are contributing to this project.`}
                icon={Users}
                defaultOpen={false}
                rounded={false}
              >
                <div className="flex flex-wrap gap-2">
                  {teamMembers.map((author)=>(
                    <span key={author.id} className="inline-block px-3 py-1.5 bg-gray-100 text-sm font-medium text-gray-800">{author.name} - {author.level}</span>
                  ))}
                </div>
              </Accordion>
            )}
          </div>
        </div>

        {/* Explore Your Project section */}
        <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Explore Your Project</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {navigationItems.map((item) => (
                    <motion.div
                        key={item.id}
                        onClick={() => onNavigate(item.path)}
                        className="bg-white p-3 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col"
                    >
                        <div className="flex items-center space-x-4 mb-3">
                            <div className="bg-blue-50 p-3">
                                <item.icon className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-md font-semibold text-gray-900">{item.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm flex-grow">{item.description}</p>
                        <div className="flex justify-end mt-1">
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
