
import React, { useState, useEffect } from 'react';
import { ChartInstance, ChartType, PlotConfig,FacetMode } from '../types';
import { UI_ICONS, CHART_MENU_ITEMS } from '../constants';
import { 
  ChevronDown, ChevronRight, BarChart3, Trash2, Pencil, 
  Copy, Check, X, Settings2, Sliders, Palette, Layers,
  Type, MoveHorizontal, MoveVertical, LayoutGrid, Droplets,
  ToggleLeft, ToggleRight, CircleDot, Box, ListChecks, Activity,
  LineChart, Code2, AlertCircle, Columns, Hash
} from 'lucide-react';

interface InstancesPanelProps {
  category: ChartType | null;
  instances: ChartInstance[];
  activeInstanceId: string | null;
  onSelectInstance: (id: string) => void;
  onRemoveInstance: (id: string) => void;
  onRenameInstance: (id: string, newName: string) => void;
  onDuplicateInstance: (id: string) => void;
  onUpdateConfig: (id: string, updates: Partial<PlotConfig>) => void;
  onClose: () => void;
  width: number;
  onMouseDownResize: (e: React.MouseEvent) => void;
  datasetColumns: string[];
}

const SCIENTIFIC_COLORS = [
  { id: 'steelblue', label: 'Steel Blue' },
  { id: 'firebrick', label: 'Firebrick' },
  { id: 'seagreen', label: 'Sea Green' },
  { id: 'darkorange', label: 'Dark Orange' },
  { id: 'slateblue', label: 'Slate Blue' },
  { id: 'dimgray', label: 'Dim Gray' },
  { id: 'black', label: 'Black' },
  { id: 'white', label: 'White' },
];

const COLOR_PALETTES = [
  { group: 'Perceptually Uniform (Viridis)', palettes: [
    { id: 'viridis', label: 'Viridis (Default)' },
    { id: 'magma', label: 'Magma' },
    { id: 'plasma', label: 'Plasma' },
    { id: 'inferno', label: 'Inferno' },
    { id: 'cividis', label: 'Cividis' },
    { id: 'rocket', label: 'Rocket' },
    { id: 'mako', label: 'Mako' },
    { id: 'turbo', label: 'Turbo' },
  ]},
  { group: 'ColorBrewer Qualitative', palettes: [
    { id: 'Set1', label: 'Brewer: Set 1' },
    { id: 'Set2', label: 'Brewer: Set 2' },
    { id: 'Set3', label: 'Brewer: Set 3' },
    { id: 'Dark2', label: 'Brewer: Dark 2' },
    { id: 'Paired', label: 'Brewer: Paired' },
    { id: 'Accent', label: 'Brewer: Accent' },
    { id: 'Pastel1', label: 'Brewer: Pastel 1' },
    { id: 'Pastel2', label: 'Brewer: Pastel 2' },
  ]},
  { group: 'ColorBrewer Sequential', palettes: [
    { id: 'Blues', label: 'Sequential: Blues' },
    { id: 'Greens', label: 'Sequential: Greens' },
    { id: 'Oranges', label: 'Sequential: Oranges' },
    { id: 'Reds', label: 'Sequential: Reds' },
    { id: 'Purples', label: 'Sequential: Purples' },
    { id: 'YlGnBu', label: 'Sequential: YlGnBu' },
  ]},
  { group: 'Diverging', palettes: [
    { id: 'Spectral', label: 'Spectral' },
    { id: 'RdYlBu', label: 'RdYlBu' },
    { id: 'RdBu', label: 'RdBu' },
    { id: 'PiYG', label: 'PiYG' },
    { id: 'PRGn', label: 'PRGn' },
  ]}
];

const InstancesPanel: React.FC<InstancesPanelProps> = ({
  category,
  instances,
  activeInstanceId,
  onSelectInstance,
  onRemoveInstance,
  onRenameInstance,
  onDuplicateInstance,
  onUpdateConfig,
  onClose,
  width,
  onMouseDownResize,
  datasetColumns
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [openPanels, setOpenPanels] = useState<Record<string, string[]>>({});
  const [rMutationValue, setRMutationValue] = useState('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Sync internal state when active instance changes
  useEffect(() => {
    const active = instances.find(i => i.id === activeInstanceId);
    if (active) {
      setRMutationValue(active.config.customRMutation || '');
      setMutationError(null);
    }
  }, [activeInstanceId, instances]);

  if (!category) return null;

  const categoryInfo = CHART_MENU_ITEMS.find(i => i.id === category);
  const filteredInstances = instances.filter(inst => inst.type === category);

  const startEditing = (e: React.MouseEvent, inst: ChartInstance) => {
    e.stopPropagation();
    setEditingId(inst.id);
    setEditValue(inst.name);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const submitRename = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (editValue.trim()) {
      onRenameInstance(id, editValue.trim());
    }
    setEditingId(null);
  };

  const togglePanel = (instanceId: string, panelName: string) => {
    setOpenPanels(prev => {
      const current = prev[instanceId] || [];
      const isOpened = current.includes(panelName);
      return {
        ...prev,
        [instanceId]: isOpened ? current.filter(p => p !== panelName) : [...current, panelName]
      };
    });
  };

  const isPanelOpen = (instanceId: string, panelName: string) => {
    return (openPanels[instanceId] || []).includes(panelName);
  };

  const validateRMutation = (val: string) => {
    if (!val.trim()) return null;
    // Simple basic syntax check for unbalanced brackets/quotes
    const openBrackets = (val.match(/\(/g) || []).length;
    const closeBrackets = (val.match(/\)/g) || []).length;
    if (openBrackets !== closeBrackets) return "Unbalanced parentheses detected.";
    
    const openQuotes = (val.match(/"/g) || []).length;
    if (openQuotes % 2 !== 0) return "Unbalanced double quotes detected.";
    
    const openSingleQuotes = (val.match(/'/g) || []).length;
    if (openSingleQuotes % 2 !== 0) return "Unbalanced single quotes detected.";

    return null;
  };

  const handleMutationChange = (id: string, val: string) => {
    setRMutationValue(val);
    const error = validateRMutation(val);
    setMutationError(error);
    if (!error) {
      onUpdateConfig(id, { customRMutation: val });
    }
  };

  return (
    <div 
      className="h-full bg-white border-r border-gray-200 flex flex-col shadow-inner animate-in slide-in-from-left duration-200 rounded-none relative overflow-visible"
      style={{ width: `${width}px` }}
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-none shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-blue-600 shrink-0">{categoryInfo?.icon}</span>
          <h2 className="font-semibold text-sm text-gray-700 truncate">{categoryInfo?.label}s</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-none shrink-0 ml-2">
          {UI_ICONS.Close}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 rounded-none custom-scrollbar">
        {filteredInstances.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-none">
            <p className="text-xs text-gray-400">No {categoryInfo?.label} charts yet.</p>
          </div>
        ) : (
          filteredInstances.map((inst) => {
            const isActive = activeInstanceId === inst.id;
            const isEditing = editingId === inst.id;
            const config: PlotConfig = inst.config;

            // Compute available columns based on chart type
            const availableColumns = [...datasetColumns];
            if (inst.type === ChartType.LINE) {
               availableColumns.push('MEAN_DV', 'MEDIAN_DV');
            }

            return (
              <div 
                key={inst.id}
                onClick={() => !isEditing && onSelectInstance(inst.id)}
                className={`group border transition-all cursor-pointer rounded-none ${
                  isActive 
                    ? 'border-blue-200 bg-blue-50/30 shadow-sm' 
                    : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="p-3 flex items-center justify-between rounded-none">
                  <div className="flex items-center gap-2 overflow-hidden rounded-none flex-1">
                    <div className={`p-1.5 rounded-none shrink-0 ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <BarChart3 size={14} />
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitRename(e, inst.id)}
                          className="w-full text-xs font-medium border-b border-blue-500 bg-transparent outline-none py-0.5"
                        />
                        <button onClick={(e) => submitRename(e, inst.id)} className="text-green-600 hover:text-green-700 p-0.5"><Check size={14} /></button>
                        <button onClick={cancelEditing} className="text-red-600 hover:text-red-700 p-0.5"><X size={14} /></button>
                      </div>
                    ) : (
                      <span className={`text-xs font-medium truncate ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                        {inst.name}
                      </span>
                    )}
                  </div>
                  
                  {!isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-none shrink-0 ml-1">
                       <button 
                          onClick={(e) => startEditing(e, inst)}
                          title="Rename"
                          className="p-1 text-gray-400 hover:text-blue-600 rounded-none"
                        >
                          <Pencil size={12} />
                       </button>
                       <button 
                          onClick={(e) => { e.stopPropagation(); onDuplicateInstance(inst.id); }}
                          title="Duplicate"
                          className="p-1 text-gray-400 hover:text-blue-600 rounded-none"
                        >
                          <Copy size={12} />
                       </button>
                       <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveInstance(inst.id);
                          }}
                          title="Delete"
                          className="p-1 text-gray-400 hover:text-red-500 rounded-none"
                        >
                          <Trash2 size={12} />
                       </button>
                       {isActive ? <ChevronDown size={14} className="text-blue-600" /> : <ChevronRight size={14} className="text-gray-300" />}
                    </div>
                  )}
                </div>
                
                {isActive && !isEditing && (
                  <div className="px-3 pb-4 pt-2 border-t border-blue-100/50 mt-1 animate-in fade-in slide-in-from-top-1 rounded-none space-y-1">
                    {/* Axes Panel */}
                    {category !== ChartType.PAIRS && (
                      <div className="rounded-none border border-blue-100/50 overflow-hidden bg-white/50">
                        <button 
                          onClick={(e) => { e.stopPropagation(); togglePanel(inst.id, 'axes'); }}
                          className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors bg-gray-50/30"
                        >
                          <div className="flex items-center gap-2">
                            <Sliders size={10} /> Axes & Variables
                          </div>
                          {isPanelOpen(inst.id, 'axes') ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                        {isPanelOpen(inst.id, 'axes') && (
                          <div className="p-2 space-y-2 animate-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">X-Axis</label>
                                <select 
                                  value={config.xAxis}
                                  onChange={(e) => onUpdateConfig(inst.id, { xAxis: e.target.value })}
                                  className="w-full px-1 py-1 text-[10px] bg-white border border-gray-100 outline-none focus:border-blue-500 font-medium"
                                >
                                  {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                </select>
                              </div>
                              {category !== ChartType.HISTOGRAM && (
                                <div>
                                  <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">Y-Axis</label>
                                  <select 
                                    value={config.yAxis}
                                    onChange={(e) => onUpdateConfig(inst.id, { yAxis: e.target.value })}
                                    className="w-full px-1 py-1 text-[10px] bg-white border border-gray-100 outline-none focus:border-blue-500 font-medium"
                                  >
                                    {availableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                  </select>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">Plot Title</label>
                              <input 
                                type="text"
                                value={config.title}
                                onChange={(e) => onUpdateConfig(inst.id, { title: e.target.value })}
                                className="w-full px-2 py-1 text-[10px] bg-white border border-gray-100 outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">X Label</label>
                                <input 
                                  type="text"
                                  value={config.xLabel}
                                  onChange={(e) => onUpdateConfig(inst.id, { xLabel: e.target.value })}
                                  className="w-full px-2 py-1 text-[10px] bg-white border border-gray-100 outline-none focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">Y Label</label>
                                <input 
                                  type="text"
                                  value={config.yLabel}
                                  onChange={(e) => onUpdateConfig(inst.id, { yLabel: e.target.value })}
                                  className="w-full px-2 py-1 text-[10px] bg-white border border-gray-100 outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                            {category !== ChartType.HISTOGRAM && (
                              <div>
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">Legend/Color Label</label>
                                <input 
                                  type="text"
                                  value={config.colorLabel}
                                  onChange={(e) => onUpdateConfig(inst.id, { colorLabel: e.target.value })}
                                  className="w-full px-2 py-1 text-[10px] bg-white border border-gray-100 outline-none focus:border-blue-500"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Histogram Specific Panel */}
                    {category === ChartType.HISTOGRAM && (
                      <div className="rounded-none border border-blue-100 overflow-hidden bg-blue-50/30">
                        <button 
                          onClick={(e) => { e.stopPropagation(); togglePanel(inst.id, 'hist-opt'); }}
                          className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-700 hover:text-blue-800 transition-colors bg-blue-100/30"
                        >
                          <div className="flex items-center gap-2">
                            <Columns size={10} /> Histogram Settings
                          </div>
                          {isPanelOpen(inst.id, 'hist-opt') ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                        {isPanelOpen(inst.id, 'hist-opt') && (
                          <div className="p-3 space-y-4 animate-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter block">Bins: {config.histogramBins}</label>
                              </div>
                              <input 
                                type="range" min="5" max="100" step="1"
                                value={config.histogramBins}
                                onChange={(e) => onUpdateConfig(inst.id, { histogramBins: parseInt(e.target.value) })}
                                className="w-full h-1 bg-gray-200 appearance-none cursor-pointer accent-blue-600"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => onUpdateConfig(inst.id, { histogramShowDensity: !config.histogramShowDensity })}
                                className={`flex items-center justify-center gap-2 px-2 py-2 text-[8px] font-black uppercase transition-all border ${
                                  config.histogramShowDensity ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-400'
                                }`}
                              >
                                {config.histogramShowDensity ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                                Density Curve
                              </button>
                              <button 
                                onClick={() => onUpdateConfig(inst.id, { histogramShowMeanLine: !config.histogramShowMeanLine })}
                                className={`flex items-center justify-center gap-2 px-2 py-2 text-[8px] font-black uppercase transition-all border ${
                                  config.histogramShowMeanLine ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-400'
                                }`}
                              >
                                {config.histogramShowMeanLine ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                                Mean Line
                              </button>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter block">Fill Color</label>
                              <div className="grid grid-cols-4 gap-1">
                                {SCIENTIFIC_COLORS.map(color => (
                                  <button
                                    key={color.id}
                                    onClick={() => onUpdateConfig(inst.id, { histogramFill: color.id })}
                                    className={`w-full aspect-square border transition-all ${config.histogramFill === color.id ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-100 hover:border-gray-300'}`}
                                    style={{ backgroundColor: color.id }}
                                    title={color.label}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pairs Matrix Variable Selection */}
                    {category === ChartType.PAIRS && (
                      <div className="rounded-none border border-purple-100 overflow-hidden bg-purple-50/30">
                        <button 
                          onClick={(e) => { e.stopPropagation(); togglePanel(inst.id, 'pairs'); }}
                          className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-purple-700 hover:text-purple-800 transition-colors bg-purple-100/30"
                        >
                          <div className="flex items-center gap-2">
                            <ListChecks size={10} /> Select Matrix Covariates
                          </div>
                          {isPanelOpen(inst.id, 'pairs') ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                        {isPanelOpen(inst.id, 'pairs') && (
                          <div className="p-2 space-y-2 animate-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-2 gap-1.5">
                              {datasetColumns.map(col => (
                                <button
                                  key={col}
                                  onClick={() => {
                                    const current = config.pairsVariables || [];
                                    const next = current.includes(col) 
                                      ? current.filter(c => c !== col) 
                                      : [...current, col];
                                    onUpdateConfig(inst.id, { pairsVariables: next });
                                  }}
                                  className={`px-2 py-1.5 text-[9px] font-black uppercase border text-left flex items-center justify-between transition-all ${
                                    (config.pairsVariables || []).includes(col)
                                      ? 'bg-purple-600 border-purple-600 text-white'
                                      : 'bg-white border-gray-100 text-gray-400 hover:border-purple-200'
                                  }`}
                                >
                                  <span className="truncate">{col}</span>
                                  {(config.pairsVariables || []).includes(col) && <Check size={10} />}
                                </button>
                              ))}
                            </div>
                            <div className="pt-2 border-t border-purple-100/50">
                               <p className="text-[8px] text-purple-400 uppercase font-bold italic">Select 2+ variables for meaningful output.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scatter Plot Line Toggle */}
                    {category === ChartType.SCATTER && (
                      <div className="rounded-none border border-blue-100 overflow-hidden bg-blue-50/30">
                        <button 
                          onClick={(e) => { e.stopPropagation(); togglePanel(inst.id, 'scatter-opt'); }}
                          className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-700 hover:text-blue-800 transition-colors bg-blue-100/30"
                        >
                          <div className="flex items-center gap-2">
                            <Activity size={10} /> Scatter Options
                          </div>
                          {isPanelOpen(inst.id, 'scatter-opt') ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                        {isPanelOpen(inst.id, 'scatter-opt') && (
                          <div className="p-2 space-y-2 animate-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                             <button 
                              onClick={() => onUpdateConfig(inst.id, { scatterShowLine: !config.scatterShowLine })}
                              className="w-full flex items-center justify-between p-2 bg-white border border-blue-100 text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <Activity size={14} className={config.scatterShowLine ? 'text-blue-600' : 'text-gray-300'} />
                                Show Trend Line (Smooth)
                              </div>
                              <span className={config.scatterShowLine ? 'text-blue-700' : 'text-gray-400'}>{config.scatterShowLine ? 'ON' : 'OFF'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Line Plot Options */}
                    {category === ChartType.LINE && (
                      <div className="rounded-none border border-blue-100 overflow-hidden bg-blue-50/30">
                        <button 
                          onClick={(e) => { e.stopPropagation(); togglePanel(inst.id, 'line-opt'); }}
                          className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-700 hover:text-blue-800 transition-colors bg-blue-100/30"
                        >
                          <div className="flex items-center gap-2">
                            <Activity size={10} /> Line Profile Options
                          </div>
                          {isPanelOpen(inst.id, 'line-opt') ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                        {isPanelOpen(inst.id, 'line-opt') && (
                          <div className="p-2 space-y-2 animate-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                             <button 
                              onClick={() => onUpdateConfig(inst.id, { lineShowPoints: !config.lineShowPoints })}
                              className="w-full flex items-center justify-between p-2 bg-white border border-blue-100 text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <CircleDot size={14} className={config.lineShowPoints ? 'text-blue-600' : 'text-gray-300'} />
                                Show Data Points
                              </div>
                              <span className={config.lineShowPoints ? 'text-blue-700' : 'text-gray-400'}>{config.lineShowPoints ? 'ON' : 'OFF'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {category === ChartType.BOXPLOT && (
                      <div className="rounded-none border border-amber-100 overflow-hidden bg-amber-50/30">
                        <button 
                          onClick={(e) => { e.stopPropagation(); togglePanel(inst.id, 'boxplot'); }}
                          className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-amber-700 hover:text-amber-800 transition-colors bg-amber-100/30"
                        >
                          <div className="flex items-center gap-2">
                            <Box size={10} /> Boxplot Settings
                          </div>
                          {isPanelOpen(inst.id, 'boxplot') ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                        {isPanelOpen(inst.id, 'boxplot') && (
                          <div className="p-2 space-y-3 animate-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                             <button 
                              onClick={() => onUpdateConfig(inst.id, { boxplotNotch: !config.boxplotNotch })}
                              className="w-full flex items-center justify-between p-2 bg-white border border-amber-100 text-[10px] font-bold uppercase tracking-widest"
                            >
                              <div className="flex items-center gap-2">
                                <ToggleRight size={14} className={config.boxplotNotch ? 'text-amber-600' : 'text-gray-300'} />
                                Enable Notch
                              </div>
                              <span className={config.boxplotNotch ? 'text-amber-700' : 'text-gray-400'}>{config.boxplotNotch ? 'ON' : 'OFF'}</span>
                            </button>

                            <button 
                              onClick={() => onUpdateConfig(inst.id, { boxplotOverlayPoints: !config.boxplotOverlayPoints })}
                              className="w-full flex items-center justify-between p-2 bg-white border border-amber-100 text-[10px] font-bold uppercase tracking-widest"
                            >
                              <div className="flex items-center gap-2">
                                <CircleDot size={14} className={config.boxplotOverlayPoints ? 'text-amber-600' : 'text-gray-300'} />
                                Overlay Raw Data
                              </div>
                              <span className={config.boxplotOverlayPoints ? 'text-amber-700' : 'text-gray-400'}>{config.boxplotOverlayPoints ? 'ON' : 'OFF'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Advanced R Mutation Section */}
                    <div className="rounded-none border border-emerald-100 overflow-hidden bg-emerald-50/30">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePanel(inst.id, 'advanced-r'); }}
                        className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:text-emerald-800 transition-colors bg-emerald-100/30"
                      >
                        <div className="flex items-center gap-2">
                          <Code2 size={10} /> Advanced R Mutation
                        </div>
                        {isPanelOpen(inst.id, 'advanced-r') ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      </button>
                      {isPanelOpen(inst.id, 'advanced-r') && (
                        <div className="p-3 space-y-2 animate-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest block">In-line Dplyr Logic</label>
                          <div className="relative">
                            <textarea 
                              value={rMutationValue}
                              onChange={(e) => handleMutationChange(inst.id, e.target.value)}
                              placeholder="e.g. WT_KG = WT / 1000, LNDV = log(DV)"
                              className={`w-full bg-white border p-2 text-[10px] outline-none font-mono h-20 transition-all ${mutationError ? 'border-red-300 focus:border-red-400' : 'border-emerald-100 focus:border-emerald-400'}`}
                            />
                            {mutationError && (
                              <div className="absolute top-full left-0 mt-1 flex items-center gap-1 text-red-500 z-10 bg-white shadow-sm p-1 border border-red-100">
                                <AlertCircle size={10} />
                                <span className="text-[8px] font-bold uppercase">{mutationError}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[7px] text-emerald-500 font-bold uppercase italic mt-1">This code is inserted into a mutate() block piped before the plot.</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-none border border-blue-100/50 overflow-hidden bg-white/50">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePanel(inst.id, 'theme'); }}
                        className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors bg-gray-50/30"
                      >
                        <div className="flex items-center gap-2">
                          <Palette size={10} /> Visual Aesthetics
                        </div>
                        {isPanelOpen(inst.id, 'theme') ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      </button>
                      {isPanelOpen(inst.id, 'theme') && (
                        <div className="p-2 space-y-2 animate-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                          <div>
                            <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">GGPlot2 Theme</label>
                            <select 
                              value={config.theme}
                              onChange={(e) => onUpdateConfig(inst.id, { theme: e.target.value as any })}
                              className="w-full px-1 py-1 text-[10px] bg-white border border-gray-100 outline-none focus:border-blue-500 font-medium"
                            >
                              <option value="bw">theme_bw()</option>
                              <option value="minimal">theme_minimal()</option>
                              <option value="classic">theme_classic()</option>
                              <option value="light">theme_light()</option>
                              <option value="dark">theme_dark()</option>
                              <option value="gray">theme_gray()</option>
                              <option value="void">theme_void()</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">Legend Position</label>
                            <div className="flex flex-wrap gap-1">
                              {['bottom', 'top', 'left', 'right', 'none'].map(pos => (
                                <button 
                                  key={pos}
                                  onClick={() => onUpdateConfig(inst.id, { legendPosition: pos as any })}
                                  className={`px-2 py-1 text-[8px] font-black uppercase border transition-all ${
                                    config.legendPosition === pos 
                                    ? 'bg-[#1a1f24] text-white border-[#1a1f24]' 
                                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                                  }`}
                                >
                                  {pos}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">Color Palette</label>
                            <div className="relative">
                                <select 
                                value={config.colorPalette}
                                onChange={(e) => onUpdateConfig(inst.id, { colorPalette: e.target.value })}
                                className="w-full pl-2 pr-8 py-2 text-[10px] bg-white border border-gray-100 outline-none focus:border-blue-500 font-bold text-gray-700 appearance-none"
                                >
                                {COLOR_PALETTES.map(group => (
                                    <optgroup key={group.group} label={group.group}>
                                    {group.palettes.map(p => (
                                        <option key={p.id} value={p.id}>{p.label}</option>
                                    ))}
                                    </optgroup>
                                ))}
                                </select>
                                <Droplets size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t border-gray-100 space-y-2">
                             <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter block">Axis Title Font: {config.axisTitleSize}</label>
                              </div>
                              <input 
                                type="range" min="6" max="24" step="1"
                                value={config.axisTitleSize}
                                // Fix typo: replaced setUpdateConfig with onUpdateConfig
                                onChange={(e) => onUpdateConfig(inst.id, { axisTitleSize: parseInt(e.target.value) })}
                                className="w-full h-1 bg-gray-100 appearance-none cursor-pointer accent-blue-600"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter block">Axis Text Font: {config.axisTextSize}</label>
                              </div>
                              <input 
                                type="range" min="6" max="24" step="1"
                                value={config.axisTextSize}
                                onChange={(e) => onUpdateConfig(inst.id, { axisTextSize: parseInt(e.target.value) })}
                                className="w-full h-1 bg-gray-100 appearance-none cursor-pointer accent-blue-600"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-none border border-blue-100/50 overflow-hidden bg-white/50">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePanel(inst.id, 'Colors'); }}
                        className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors bg-gray-50/30"
                      >
                        <div className="flex items-center gap-2">
                          <Layers size={10} /> Coloring Layers
                        </div>
                        {isPanelOpen(inst.id, 'Colors') ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      </button>
                      {isPanelOpen(inst.id, 'Colors') && (
                        <div className="p-2 space-y-2 animate-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                          <div>
                            <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">Color By (Categorical)</label>
                            <select 
                              value={config.colorBy}
                              onChange={(e) => onUpdateConfig(inst.id, { colorBy: e.target.value })}
                              className="w-full px-1 py-1 text-[10px] bg-white border border-gray-100 outline-none focus:border-blue-500 font-medium"
                            >
                              <option value="none">No Coloring</option>
                              {datasetColumns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Faceting Panel: Only for charts supporting facets (not Pairs Matrix) */}
                    {category !== ChartType.PAIRS && (
                      <div className="rounded-none border border-blue-100/50 overflow-hidden bg-white/50">
                        <button 
                          onClick={(e) => { e.stopPropagation(); togglePanel(inst.id, 'faceting'); }}
                          className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors bg-gray-50/30"
                        >
                          <div className="flex items-center gap-2">
                            <LayoutGrid size={10} /> Faceting Layers
                          </div>
                          {isPanelOpen(inst.id, 'faceting') ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                        {isPanelOpen(inst.id, 'faceting') && (
                          <div className="p-3 space-y-3 animate-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                            <div>
                              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Faceting Mode</label>
                              <div className="flex w-full border border-gray-100 rounded-none overflow-hidden">
                                {(['none', 'wrap', 'grid'] as FacetMode[]).map((mode) => (
                                  <button
                                    key={mode}
                                    onClick={() => onUpdateConfig(inst.id, { facetMode: mode })}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase transition-all ${
                                      config.facetMode === mode 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-white text-gray-400 hover:text-gray-600'
                                    } ${mode !== 'grid' ? 'border-r border-gray-100' : ''}`}
                                  >
                                    {mode}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {config.facetMode === 'wrap' && (
                              <div className="animate-in fade-in slide-in-from-top-1">
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Facet Wrap Variable</label>
                                <div className="relative">
                                  <select 
                                    value={config.facetWrapVar}
                                    onChange={(e) => onUpdateConfig(inst.id, { facetWrapVar: e.target.value })}
                                    className="w-full pl-2 pr-8 py-2 text-[11px] bg-white border border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none font-bold text-gray-700 appearance-none"
                                  >
                                    <option value="none">Select Variable...</option>
                                    {datasetColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                  </select>
                                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-800 pointer-events-none" />
                                </div>
                              </div>
                            )}

                            {config.facetMode === 'grid' && (
                              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                                <div>
                                  <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Grid Rows</label>
                                  <div className="relative">
                                    <select 
                                      value={config.facetGridRow}
                                      onChange={(e) => onUpdateConfig(inst.id, { facetGridRow: e.target.value })}
                                      className="w-full pl-2 pr-8 py-2 text-[11px] bg-white border border-gray-200 focus:border-blue-400 outline-none font-bold text-gray-700 appearance-none"
                                    >
                                      <option value="none">None</option>
                                      {datasetColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-800 pointer-events-none" />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Grid Columns</label>
                                  <div className="relative">
                                    <select 
                                      value={config.facetGridCol}
                                      onChange={(e) => onUpdateConfig(inst.id, { facetGridCol: e.target.value })}
                                      className="w-full pl-2 pr-8 py-2 text-[11px] bg-white border border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none font-bold text-gray-700 appearance-none"
                                    >
                                      <option value="none">None</option>
                                      {datasetColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-800 pointer-events-none" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="rounded-none border border-blue-100/50 overflow-hidden bg-white/50">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePanel(inst.id, 'advanced'); }}
                        className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors bg-gray-50/30"
                      >
                        <div className="flex items-center gap-2">
                          <Settings2 size={10} /> Geometric Params
                        </div>
                        {isPanelOpen(inst.id, 'advanced') ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      </button>
                      {isPanelOpen(inst.id, 'advanced') && (
                        <div className="p-2 space-y-3 animate-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter block">Point Size: {config.pointSize}</label>
                            </div>
                            <input 
                              type="range" min="0.5" max="8" step="0.1"
                              value={config.pointSize}
                              onChange={(e) => onUpdateConfig(inst.id, { pointSize: parseFloat(e.target.value) })}
                              className="w-full h-1 bg-gray-100 appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter block">Transparency (Alpha): {config.alpha}</label>
                            </div>
                            <input 
                              type="range" min="0.1" max="1" step="0.05"
                              value={config.alpha}
                              onChange={(e) => onUpdateConfig(inst.id, { alpha: parseFloat(e.target.value) })}
                              className="w-full h-1 bg-gray-100 appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-none shrink-0">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
             <Hash size={12} className="text-gray-400" />
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Analysis Count</span>
           </div>
           <span className="text-xs font-black text-blue-600 tabular-nums bg-blue-50 px-2 py-0.5 border border-blue-100">
             {filteredInstances.length}
           </span>
        </div>
      </div>

      <div 
        onMouseDown={onMouseDownResize}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors z-20 flex items-center justify-center group"
      >
        <div className="w-[1px] h-8 bg-gray-200 group-hover:bg-blue-300"></div>
      </div>
    </div>
  );
};

export default InstancesPanel;
