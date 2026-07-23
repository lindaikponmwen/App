
import React, { useState } from 'react';
import { Network, Plus, Play, Trash2, Check, X, Box, BarChart3, Clock, Loader2, ListChecks, Hash, Activity, Layers, SquarePlus, ChevronRight, Edit3 } from 'lucide-react';
import { Workflow, ChartType, WorkflowItem } from '../types';
import { CHART_MENU_ITEMS } from '../constants';

interface WorkflowViewProps {
  workflows: Workflow[];
  onClose: () => void;
  onCreateWorkflow: (name: string, items: WorkflowItem[]) => void;
  onDeleteWorkflow: (id: string) => void;
  onRunWorkflow: (id: string) => void;
  isExecuting: boolean;
  executingWorkflowId: string | null;
}

const WorkflowView: React.FC<WorkflowViewProps> = ({ 
  workflows, 
  onClose,
  onCreateWorkflow, 
  onDeleteWorkflow, 
  onRunWorkflow,
  isExecuting,
  executingWorkflowId
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [pendingItems, setPendingItems] = useState<WorkflowItem[]>([]);

  const addChartTypeToPending = (type: ChartType) => {
    const info = CHART_MENU_ITEMS.find(i => i.id === type);
    const count = pendingItems.filter(p => p.type === type).length + 1;
    setPendingItems(prev => [...prev, { 
      type, 
      name: `${info?.label || type} ${count}` 
    }]);
  };

  const removePendingItem = (index: number) => {
    setPendingItems(prev => prev.filter((_, i) => i !== index));
  };

  const updatePendingItemName = (index: number, newName: string) => {
    setPendingItems(prev => prev.map((item, i) => 
      i === index ? { ...item, name: newName } : item
    ));
  };

  const handleCreate = () => {
    if (newWorkflowName.trim() && pendingItems.length > 0) {
      onCreateWorkflow(newWorkflowName.trim(), pendingItems);
      setNewWorkflowName('');
      setPendingItems([]);
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-white flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#1a1f24] text-white shadow-xl">
               <Network size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1a1f24] uppercase tracking-tighter">
                Analysis Pipelines
              </h2>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Automate batch creation of analytical repositories</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-6 py-4 bg-[#1a1f24] text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl active:translate-y-0.5 border-b-4 border-blue-900"
            >
              <Plus size={16} />
              New Sequence
            </button>
            <button 
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
          {workflows.length === 0 && !isCreating ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-12 border-4 border-dashed border-gray-100">
              <Network size={64} className="mb-6 text-blue-600" />
              <h3 className="text-lg font-black uppercase tracking-widest mb-2 text-gray-900">No Pipelines Defined</h3>
              <p className="text-xs max-w-sm font-medium">Create a pipeline to batch-create multiple analysis types with a single execution.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
              {/* Creator Card */}
              {isCreating && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 border-4 border-blue-600 bg-white p-8 flex flex-col md:flex-row gap-8 animate-in slide-in-from-top-4 shadow-2xl relative mb-4">
                  
                  {/* Left Side: Type Selector */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <h4 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">1. Select Chart Components</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                         {/* Filter correct ChartType keys */}
                         {CHART_MENU_ITEMS.filter(item => !item.isHeader).map((item) => (
                           <button
                             key={item.id}
                             onClick={() => addChartTypeToPending(item.id as ChartType)}
                             className="flex items-center gap-3 p-3 bg-white border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all group"
                           >
                              <div className="p-2 bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                {item.icon}
                              </div>
                              <div className="flex flex-col items-start overflow-hidden text-left">
                                <span className="text-[10px] font-black uppercase text-gray-700 truncate">{item.label}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Analysis</span>
                              </div>
                              <Plus size={12} className="ml-auto text-gray-300 group-hover:text-blue-500" />
                           </button>
                         ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Configuration & Pending List */}
                  <div className="w-full md:w-1/3 lg:w-2/5 flex flex-col border-l border-gray-100 pl-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[12px] font-black text-900 uppercase tracking-[0.2em]">2. Finalize Sequence</h4>
                      <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                    </div>

                    <div className="space-y-4 mb-6">
                      <input 
                        autoFocus
                        type="text"
                        placeholder="Pipeline Label (e.g. End of Day Pack)"
                        value={newWorkflowName}
                        onChange={(e) => setNewWorkflowName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all rounded-none"
                      />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Execution Stack ({pendingItems.length})</span>
                          {pendingItems.length > 0 && (
                            <button onClick={() => setPendingItems([])} className="text-[8px] font-black text-red-500 uppercase">Clear All</button>
                          )}
                       </div>
                       <div className="flex-1 overflow-y-auto max-h-72 space-y-2 custom-scrollbar bg-gray-50 p-3 border border-gray-100">
                          {pendingItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                               <ListChecks size={32} />
                               <span className="text-[10px] font-bold uppercase mt-2">Empty Stack</span>
                            </div>
                          ) : (
                            pendingItems.map((item, idx) => {
                              const info = CHART_MENU_ITEMS.find(i => i.id === item.type);
                              return (
                                <div key={idx} className="flex flex-col p-3 bg-white border border-gray-200 group/item shadow-sm animate-in fade-in slide-in-from-right-2">
                                   <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                         <span className="text-[8px] font-black text-blue-600 bg-blue-50 w-5 h-5 flex items-center justify-center border border-blue-100">{idx + 1}</span>
                                         <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{info?.label} Blueprint</span>
                                      </div>
                                      <button onClick={() => removePendingItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                                         <Trash2 size={12} />
                                      </button>
                                   </div>
                                   <div className="relative">
                                      <input 
                                         type="text"
                                         value={item.name}
                                         onChange={(e) => updatePendingItemName(idx, e.target.value)}
                                         className="w-full pl-8 pr-3 py-1.5 text-[11px] font-bold text-gray-700 bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-300 outline-none transition-all"
                                         placeholder="Instance Name..."
                                      />
                                      <Edit3 size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                   </div>
                                </div>
                              );
                            })
                          )}
                       </div>
                    </div>

                    <button 
                      onClick={handleCreate}
                      disabled={!newWorkflowName.trim() || pendingItems.length === 0}
                      className="w-full py-4 bg-blue-600 text-white text-[12px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 disabled:opacity-30 transition-all flex items-center justify-center gap-3 shadow-xl mt-6 border-b-4 border-blue-900"
                    >
                      <Check size={18} /> Save Pipeline
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Workflow Cards */}
              {workflows.map(wf => (
                <div key={wf.id} className={`group border border-gray-200 bg-white hover:border-blue-400 hover:shadow-2xl transition-all flex flex-col relative overflow-hidden ${executingWorkflowId === wf.id ? 'ring-2 ring-blue-500' : ''}`}>
                  {executingWorkflowId === wf.id && (
                    <div className="absolute top-0 left-0 h-1 bg-blue-600 w-full animate-pulse z-20" />
                  )}
                  
                  <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-white shrink-0">
                    <div>
                      <h3 className="text-[16px] font-black text-[#1a1f24] uppercase tracking-tighter mb-1 truncate max-w-[200px]">{wf.name}</h3>
                      <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                        <Clock size={10} />
                        Blueprint ID: {wf.id.slice(0, 6)}
                      </div>
                    </div>
                    <button 
                      onClick={() => onDeleteWorkflow(wf.id)}
                      className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="p-6 bg-gray-50/50 flex-1 overflow-y-auto max-h-60 custom-scrollbar">
                     <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <ListChecks size={14} className="text-blue-500" /> Blueprint Definition
                     </div>
                     <div className="space-y-2">
                       {wf.items.map((item, idx) => {
                          const info = CHART_MENU_ITEMS.find(i => i.id === item.type);
                          return (
                            <div key={idx} className="flex flex-col p-2.5 bg-white border border-gray-100 shadow-sm transition-all group-hover:border-blue-100">
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[8px] font-black text-gray-300 bg-gray-50 w-5 h-5 flex items-center justify-center border border-gray-100 font-mono">{idx + 1}</span>
                                  <span className="text-[10px] font-black text-gray-700 uppercase truncate">{item.name}</span>
                               </div>
                               <div className="flex items-center gap-1.5 pl-7">
                                  <div className="text-blue-600 scale-50 opacity-50">
                                    {info?.icon}
                                  </div>
                                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">{info?.label}</span>
                               </div>
                            </div>
                          );
                       })}
                     </div>
                  </div>

                  <div className="p-6 bg-white border-t border-gray-100 mt-auto">
                    <button 
                      onClick={() => onRunWorkflow(wf.id)}
                      disabled={isExecuting}
                      className={`w-full py-4 flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-md ${
                        executingWorkflowId === wf.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-[#1a1f24] text-white hover:bg-blue-600'
                      } disabled:opacity-50`}
                    >
                      {executingWorkflowId === wf.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Spawning Analyses...
                        </>
                      ) : (
                        <>
                          <Play size={16} fill="currentColor" />
                          Execute Pipeline
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer System Status */}
        <div className="p-6 border-t border-gray-100 bg-[#f8fafc] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-10">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center text-blue-600 shadow-sm">
                  <Hash size={18} />
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Stored Blueprints</span>
                 <span className="text-[16px] font-black text-[#1a1f24] tracking-tighter">{workflows.length}</span>
               </div>
             </div>
             
             <div className="h-10 w-[1px] bg-gray-200"></div>

             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center text-green-600 shadow-sm">
                  <Box size={18} />
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Execution Mode</span>
                 <span className="text-[11px] font-bold text-gray-800 uppercase tracking-tight">Batch Instance Spawner</span>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-200 bg-white px-5 py-2.5 shadow-sm">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
             Workflow Engine Online
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowView;
