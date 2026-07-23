
import React from 'react';
import { CHART_MENU_ITEMS, UI_ICONS } from '../constants';
import { ChartType } from '../types';
import { Network } from 'lucide-react';

interface SidebarProps {
  activeCategory: ChartType | null;
  addedCategories: ChartType[];
  onSelectCategory: (type: ChartType) => void;
  isAddMenuOpen: boolean;
  setIsAddMenuOpen: (open: boolean) => void;
  onAddChart: (type: ChartType) => void;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  onOpenWorkflows: () => void;
  activeViewMode: string;
  isWorkflowsOpen?: boolean;
}

const SidebarTooltip = ({ text, active = false }: { text: string; active?: boolean }) => (
  <div className="absolute left-14 invisible group-hover:visible bg-[#1a1f24] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 whitespace-nowrap z-[100] rounded-none shadow-2xl border border-gray-800 flex items-center gap-2 pointer-events-none transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0 opacity-0 group-hover:opacity-100">
    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-gray-600'}`}></div>
    {text}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  activeCategory, 
  addedCategories,
  onSelectCategory, 
  isAddMenuOpen, 
  setIsAddMenuOpen,
  onAddChart,
  isTerminalOpen,
  onToggleTerminal,
  onOpenWorkflows,
  activeViewMode,
  isWorkflowsOpen
}) => {
  return (
    <aside className="w-16 h-full flex flex-col items-center py-6 bg-white border-r border-gray-200 relative z-50 shadow-sm rounded-none">
      {/* ADD MENU SECTION */}
      <div className="relative mb-8 group flex items-center justify-center">
        <button 
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className={`w-10 h-10 flex items-center justify-center transition-all rounded-none ${
            isAddMenuOpen ? 'bg-blue-700' : 'bg-[#1a1f24]'
          } text-white shadow-sm hover:text-blue-300`}
        >
          {UI_ICONS.Plus}
        </button>
        <SidebarTooltip text="Create New Analysis" active={isAddMenuOpen} />

        {isAddMenuOpen && (
          <div className="absolute left-14 top-0 w-52 bg-white border border-gray-200 shadow-xl py-2 z-[60] animate-in slide-in-from-left-2 fade-in duration-200 rounded-none">
            <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
              Analysis Types
            </div>
            {/* Filter headers and cast id to ChartType */}
            {CHART_MENU_ITEMS.filter(item => !item.isHeader).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onAddChart(item.id as ChartType);
                  setIsAddMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-[13px] text-gray-600 hover:bg-gray-50 hover:text-blue-700 transition-colors rounded-none text-left"
              >
                <span className="text-gray-400 group-hover:text-blue-600">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* COLLECTIONS SECTION */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 w-full items-center no-scrollbar rounded-none px-2">
        {addedCategories.map((type) => {
          const menuItem = CHART_MENU_ITEMS.find(item => item.id === type);
          if (!menuItem) return null;
          
          return (
            <div key={type} className="group relative w-full flex justify-center">
              <button
                onClick={() => onSelectCategory(type)}
                className={`w-full aspect-square flex items-center justify-center transition-all relative rounded-none ${
                  activeCategory === type 
                    ? 'bg-gray-100 text-blue-600' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <div className="transform scale-110">
                  {menuItem.icon}
                </div>
                {activeCategory === type && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-600" />
                )}
              </button>
              <SidebarTooltip text={`${menuItem.label} Collections`} active={activeCategory === type} />
            </div>
          );
        })}
      </div>

      {/* FOOTER ACTIONS SECTION */}
      <div className="mt-auto pt-4 border-t border-gray-100 w-full flex flex-col items-center gap-3 rounded-none">
        {/* WORKFLOWS */}
        <div className="group relative flex items-center justify-center">
          <button 
            onClick={onOpenWorkflows}
            className={`w-10 h-10 flex items-center justify-center transition-all rounded-sm ${
              isWorkflowsOpen ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-[#1a1f24] hover:bg-gray-100'
            }`}
          >
            <Network size={20} />
          </button>
          <SidebarTooltip text="Analytical Pipelines" active={isWorkflowsOpen} />
        </div>
        
        {/* R TERMINAL */}
        <div className="group relative flex items-center justify-center">
          <button 
            onClick={onToggleTerminal}
            className={`w-10 h-10 flex items-center justify-center transition-all rounded-none ${
              isTerminalOpen ? 'text-blue-600 bg-blue-50 shadow-inner' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {UI_ICONS.Terminal}
          </button>
          <SidebarTooltip text="R-Engine Console" active={isTerminalOpen} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
