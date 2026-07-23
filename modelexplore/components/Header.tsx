
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UI_ICONS } from '../constants';
import { 
  Database, ChevronDown, Plus, Filter, Scissors, Combine, 
  RefreshCcw, Binary, SlidersHorizontal, Trash2, Check, Hash,
  Layers, Settings2, FileCheck, Eye, X, Calculator, AlertCircle,
  Pencil, Save, BarChart, Percent, GripVertical, PlusCircle,
  FunctionSquare, Table, HelpCircle, Info
} from 'lucide-react';
import { DatasetConfig } from '../data/datasets';
import { APP_CONFIG } from '../data/config';

interface HeaderProps {
  selectedDataset: DatasetConfig;
  datasets: DatasetConfig[];
  onSelectDataset: (id: string) => void;
  onViewDataset: (id: string) => void;
  onDeleteDataset: (id: string) => void;
  onRenameDataset: (id: string, newName: string) => void;
  onCreateDataset: (name: string, operations: Array<{type: string, id: string}>, config: Record<string, any>) => void;
  onToggleSidebar: () => void;
  onExportClick?: () => void;
}

const OPERATION_TYPES = [
  { type: 'Filtering', icon: <Filter size={14} />, label: 'Filtering' },
  { type: 'Subsetting', icon: <Scissors size={14} />, label: 'Subsetting' },
  { type: 'Mutation', icon: <Calculator size={14} />, label: 'Mutation' },
  { type: 'Aggregation', icon: <Combine size={14} />, label: 'Aggregation' },
  { type: 'Transformation', icon: <RefreshCcw size={14} />, label: 'Transformation' },
  { type: 'Sampling', icon: <Binary size={14} />, label: 'Sampling' },
];

const MUTATION_FUNCTIONS = [
  'MIN', 'MAX', 'IF', 'TRUE', 'FALSE', 'ABS', 'SUM', 'LOG', 'EXP', 
  'RAND', 'MEAN', 'ROUND', 'SQRT', 'PI', 'POW', 'CEIL', 'FLOOR'
];

const FUNCTION_HELP = [
  { name: 'RAND()', desc: 'Random number (0-1)' },
  { name: 'MEAN(a,b,...)', desc: 'Average of values' },
  { name: 'IF(cond,t,f)', desc: 'Conditional logic' },
  { name: 'SUM(a,b,...)', desc: 'Total of values' },
  { name: 'ROUND(x)', desc: 'Round to integer' },
  { name: 'SQRT(x)', desc: 'Square root' },
  { name: 'ABS(x)', desc: 'Absolute value' },
  { name: 'MIN(a,b,...)', desc: 'Minimum value' },
  { name: 'MAX(a,b,...)', desc: 'Maximum value' },
  { name: 'LOG(x)', desc: 'Natural logarithm' },
  { name: 'EXP(x)', desc: 'Exponential' },
  { name: 'CEIL(x)', desc: 'Round up' },
  { name: 'FLOOR(x)', desc: 'Round down' },
  { name: 'PI()', desc: 'Pi constant' }
];

const Header: React.FC<HeaderProps> = ({ 
  selectedDataset, 
  datasets, 
  onSelectDataset, 
  onViewDataset, 
  onDeleteDataset,
  onRenameDataset,
  onCreateDataset,
  onToggleSidebar,
  onExportClick
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  
  const [pipeline, setPipeline] = useState<Array<{type: string, id: string}>>([]);
  const [opParams, setOpParams] = useState<Record<string, any>>({});
  
  const [editingDatasetId, setEditingDatasetId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [showFunctionList, setShowFunctionList] = useState<string | null>(null);

  const [suggestionState, setSuggestionState] = useState<{
    opId: string | null;
    list: Array<{ name: string; type: 'function' | 'column' }>;
    index: number;
    word: string;
    start: number;
    end: number;
  }>({ opId: null, list: [], index: 0, word: '', start: 0, end: 0 });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsCreating(false);
        setEditingDatasetId(null);
        setSuggestionState({ opId: null, list: [], index: 0, word: '', start: 0, end: 0 });
        setShowFunctionList(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addOperation = (type: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setPipeline(prev => [...prev, { type, id }]);
    
    const defaults: Record<string, any> = {
      Filtering: { col: selectedDataset.columns[0], cond: 'greater than', val: '5.0' },
      Subsetting: { cols: [...selectedDataset.columns], start: 0, end: selectedDataset.rowCount },
      Mutation: { formula: '' },
      Aggregation: { groupBy: selectedDataset.columns[0], method: 'mean', valueCols: [selectedDataset.columns[0]] },
      Transformation: { cols: [selectedDataset.columns[0]], type: 'log10', exponent: 2 },
      Sampling: { mode: 'count', value: Math.min(10, selectedDataset.rowCount) }
    };

    setOpParams(prev => ({
      ...prev,
      [id]: defaults[type]
    }));
  };

  const removeOperation = (id: string) => {
    setPipeline(prev => prev.filter(op => op.id !== id));
    setOpParams(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateOpParam = (id: string, updates: any) => {
    setOpParams(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && pipeline.length > 0 && !hasErrors) {
      onCreateDataset(
        newName.trim().endsWith('.csv') ? newName.trim() : `${newName.trim()}.csv`, 
        pipeline,
        opParams
      );
      setNewName('');
      setPipeline([]);
      setOpParams({});
      setIsCreating(false);
      setIsDropdownOpen(false);
    }
  };

  const validateMutation = (formula: string, columns: string[]) => {
    if (!formula.trim()) return "Formula cannot be empty";
    const parts = formula.split(';').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    if (parts.length === 0) return "No valid mutations found";

    for (const part of parts) {
      if (!part.includes('=')) return `Invalid syntax in "${part}". Missing "="`;
      const [lhs, rhs] = part.split('=').map(s => s.trim());
      if (!lhs || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(lhs)) return `Invalid column name: "${lhs}"`;
      if (!rhs) return `Missing expression for "${lhs}"`;

      const tokens = rhs.match(/[a-zA-Z_][a-zA-Z0-9_]*|\d+(\.\d+)?|[+\-*/%(),><=!&|]/g) || [];

      for (const token of tokens) {
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
          if (!MUTATION_FUNCTIONS.includes(token.toUpperCase()) && !columns.includes(token) && token !== lhs) {
            if (!columns.includes(token)) return `Unknown column or function: "${token}"`;
          }
        }
      }
    }
    return null;
  };

  const getErrors = () => {
    const errors: Record<string, string> = {};
    pipeline.forEach(op => {
      if (op.type === 'Mutation') {
        const err = validateMutation(opParams[op.id]?.formula || '', selectedDataset.columns);
        if (err) errors[op.id] = err;
      }
    });
    return errors;
  };

  const errors = useMemo(getErrors, [pipeline, opParams, selectedDataset.columns]);
  const hasErrors = Object.keys(errors).length > 0;

  const handleRenameSubmit = (id: string) => {
    if (editNameValue.trim()) {
      onRenameDataset(id, editNameValue.trim());
    }
    setEditingDatasetId(null);
  };

  const handleMutationChange = (opId: string, value: string, cursorPosition: number) => {
    updateOpParam(opId, { formula: value });

    const beforeCursor = value.slice(0, cursorPosition);
    const match = beforeCursor.match(/([a-zA-Z0-9_]*)$/);
    const word = match ? match[1] : '';

    if (word.length >= 1) {
      const filteredCols = selectedDataset.columns
        .filter(c => c.toLowerCase().startsWith(word.toLowerCase()))
        .map(c => ({ name: c, type: 'column' as const }));
      
      const filteredFuncs = MUTATION_FUNCTIONS
        .filter(f => f.toLowerCase().startsWith(word.toLowerCase()))
        .map(f => ({ name: f, type: 'function' as const }));

      const list = [...filteredCols, ...filteredFuncs];
      
      if (list.length > 0) {
        setSuggestionState({
          opId,
          list,
          index: 0,
          word,
          start: cursorPosition - word.length,
          end: cursorPosition
        });
      } else {
        setSuggestionState({ opId: null, list: [], index: 0, word: '', start: 0, end: 0 });
      }
    } else {
      setSuggestionState({ opId: null, list: [], index: 0, word: '', start: 0, end: 0 });
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (!suggestionState.opId) return;
    const currentFormula = opParams[suggestionState.opId].formula;
    const isFunc = MUTATION_FUNCTIONS.includes(suggestion);
    const suffix = isFunc ? '()' : '';
    const newFormula = 
      currentFormula.slice(0, suggestionState.start) + 
      suggestion + suffix +
      currentFormula.slice(suggestionState.end);
    
    updateOpParam(suggestionState.opId, { formula: newFormula });
    setSuggestionState({ opId: null, list: [], index: 0, word: '', start: 0, end: 0 });
  };

  const handleMutationKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestionState.list.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionState(prev => ({ ...prev, index: (prev.index + 1) % prev.list.length }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionState(prev => ({ ...prev, index: (prev.index - 1 + prev.list.length) % prev.list.length }));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestionState.list[suggestionState.index].name);
      } else if (e.key === 'Escape') {
        setSuggestionState({ opId: null, list: [], index: 0, word: '', start: 0, end: 0 });
      }
    }
  };

  const renderOpInput = (op: {type: string, id: string}) => {
    const params = opParams[op.id];
    const columns = selectedDataset.columns;

    switch (op.type) {
      case 'Filtering':
        return (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <select className="col-span-2 w-full bg-white border border-gray-200 px-2 py-1.5 text-[10px] outline-none font-bold" value={params.col} onChange={(e) => updateOpParam(op.id, { col: e.target.value })}>
              {columns.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="w-full bg-white border border-gray-200 px-2 py-1.5 text-[10px] outline-none" value={params.cond} onChange={(e) => updateOpParam(op.id, { cond: e.target.value })}>
              <option>greater than</option>
              <option>less than</option>
              <option>equals</option>
            </select>
            <input type="text" placeholder="Value..." className="w-full bg-white border border-gray-200 px-2 py-1.5 text-[10px] outline-none" value={params.val} onChange={(e) => updateOpParam(op.id, { val: e.target.value })} />
          </div>
        );
      case 'Subsetting':
        return (
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Columns to Retain</label>
              <div className="flex flex-wrap gap-1">
                {columns.map(col => (
                  <button 
                    key={col} type="button" 
                    onClick={() => {
                      const next = params.cols.includes(col) ? params.cols.filter((c: string) => c !== col) : [...params.cols, col];
                      updateOpParam(op.id, { cols: next });
                    }} 
                    className={`px-2 py-1 text-[9px] font-bold border transition-all ${params.cols.includes(col) ? 'bg-[#1a1f24] text-white border-[#1a1f24]' : 'bg-white text-gray-400 border-gray-200'}`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={params.start} onChange={(e) => updateOpParam(op.id, { start: parseInt(e.target.value) || 0 })} placeholder="Start row" className="w-full bg-white border border-gray-200 px-2 py-1.5 text-[10px] outline-none" />
              <input type="number" value={params.end} onChange={(e) => updateOpParam(op.id, { end: parseInt(e.target.value) || selectedDataset.rowCount })} placeholder="End row" className="w-full bg-white border border-gray-200 px-2 py-1.5 text-[10px] outline-none" />
            </div>
          </div>
        );
      case 'Mutation':
        return (
          <div className="space-y-2 mt-2 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Mutation Logic</label>
              <button 
                type="button"
                onClick={() => setShowFunctionList(showFunctionList === op.id ? null : op.id)}
                className="flex items-center gap-1 text-[8px] font-black text-blue-600 uppercase hover:text-blue-700 transition-colors"
              >
                <HelpCircle size={10} /> Available Functions
              </button>
            </div>

            {showFunctionList === op.id && (
              <div className="bg-blue-50/50 border border-blue-100 p-2 grid grid-cols-2 gap-x-4 gap-y-1 mb-2 max-h-40 overflow-y-auto no-scrollbar animate-in slide-in-from-top-1">
                {FUNCTION_HELP.map(f => (
                  <div key={f.name} className="flex flex-col">
                    <span className="text-[9px] font-bold text-blue-700">{f.name}</span>
                    <span className="text-[7px] text-gray-400 uppercase leading-none mb-1">{f.desc}</span>
                  </div>
                ))}
              </div>
            )}

            <textarea 
              value={params.formula}
              onKeyDown={handleMutationKeyDown}
              onBlur={() => setTimeout(() => setSuggestionState({ opId: null, list: [], index: 0, word: '', start: 0, end: 0 }), 150)}
              onChange={(e) => handleMutationChange(op.id, e.target.value, e.target.selectionStart)}
              placeholder="COL1 = COL2 + COL3; NEW_COL = IF(COL2 > 5, TRUE, FALSE)"
              className={`w-full bg-white border p-2 text-[10px] outline-none font-mono h-24 transition-all ${errors[op.id] ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
            />
            {suggestionState.opId === op.id && suggestionState.list.length > 0 && (
              <div className="absolute left-0 bottom-full mb-1 w-full bg-white border border-gray-200 shadow-2xl z-[150] max-h-40 overflow-y-auto no-scrollbar rounded-none animate-in fade-in slide-in-from-bottom-1">
                {suggestionState.list.map((item, idx) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => applySuggestion(item.name)}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-[11px] transition-colors ${
                      idx === suggestionState.index ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.type === 'function' ? <FunctionSquare size={12} className={idx === suggestionState.index ? 'text-blue-100' : 'text-purple-500'} /> : <Table size={12} className={idx === suggestionState.index ? 'text-blue-100' : 'text-blue-400'} />}
                      <span className="font-bold">{item.name}</span>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest opacity-50`}>
                      {item.type === 'function' ? 'func' : 'col'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {errors[op.id] ? (
              <div className="flex items-center gap-1.5 text-red-600">
                <AlertCircle size={10} />
                <span className="text-[8px] font-black uppercase tracking-tighter">{errors[op.id]}</span>
              </div>
            ) : params.formula.trim() && (
              <div className="flex items-center gap-1.5 text-green-600">
                <Check size={10} />
                <span className="text-[8px] font-black uppercase tracking-tighter">Syntax Validated</span>
              </div>
            )}
          </div>
        );
      case 'Aggregation':
        return (
          <div className="space-y-3 mt-2">
            <select value={params.groupBy} onChange={(e) => updateOpParam(op.id, { groupBy: e.target.value })} className="w-full bg-white border border-gray-200 px-2 py-1.5 text-[10px] outline-none font-bold">
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select value={params.method} onChange={(e) => updateOpParam(op.id, { method: e.target.value })} className="w-full bg-white border border-gray-200 px-2 py-1.5 text-[10px] outline-none">
                <option value="mean">Average</option>
                <option value="sum">Sum</option>
                <option value="count">Count</option>
              </select>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto no-scrollbar border p-1">
                {columns.map(col => (
                  <button key={col} type="button" onClick={() => {
                    const next = params.valueCols.includes(col) ? params.valueCols.filter((c:string) => c !== col) : [...params.valueCols, col];
                    updateOpParam(op.id, { valueCols: next });
                  }} className={`px-1 py-0.5 text-[8px] font-black border uppercase transition-all ${params.valueCols.includes(col) ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'}`}>
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'Transformation':
        return (
          <div className="space-y-3 mt-2">
            <select value={params.type} onChange={(e) => updateOpParam(op.id, { type: e.target.value })} className="w-full bg-white border border-gray-200 px-2 py-1.5 text-[10px] outline-none font-bold">
              <option value="log10">Log Base 10</option>
              <option value="log2">Log Base 2</option>
              <option value="exp">Exponential (exp)</option>
              <option value="sqrt">Square Root</option>
              <option value="inverse">Inverse (1/x)</option>
              <option value="abs">Absolute Value</option>
              <option value="pow">Power (^)</option>
              <option value="sin">Sine</option>
              <option value="cos">Cosine</option>
              <option value="tan">Tangent</option>
              <option value="normalize">Min-Max Scale</option>
            </select>
            
            {params.type === 'pow' && (
              <div className="animate-in slide-in-from-top-1">
                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Exponent Value</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={params.exponent} 
                  onChange={(e) => updateOpParam(op.id, { exponent: parseFloat(e.target.value) || 0 })} 
                  className="w-full bg-white border border-gray-200 px-2 py-1.5 text-[10px] outline-none font-bold"
                  placeholder="2.0"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-1">
              {columns.map(col => (
                <button key={col} type="button" onClick={() => {
                  const next = params.cols.includes(col) ? params.cols.filter((c:string) => c !== col) : [...params.cols, col];
                  updateOpParam(op.id, { cols: next });
                }} className={`px-2 py-1 text-[9px] font-bold border transition-all ${params.cols.includes(col) ? 'bg-[#1a1f24] text-white border-[#1a1f24]' : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300'}`}>
                  {col}
                </button>
              ))}
            </div>
          </div>
        );
      case 'Sampling':
        return (
          <div className="space-y-3 mt-2">
            <div className="flex border">
              {['count', 'percent'].map(mode => (
                <button key={mode} type="button" onClick={() => updateOpParam(op.id, { mode })} className={`flex-1 py-1.5 text-[9px] font-black uppercase ${params.mode === mode ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'}`}>
                  {mode}
                </button>
              ))}
            </div>
            <input type="number" value={params.value} onChange={(e) => updateOpParam(op.id, { value: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-gray-200 px-2 py-1.5 text-[10px] outline-none font-bold" />
          </div>
        );
      default: return null;
    }
  };

  return (
    <header className="h-16 w-full bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 z-[60] shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col -space-y-1">
        <h1 className="text-[14px] font-black text-[#1a1f24] tracking-tighter uppercase leading-tight">
          {APP_CONFIG.branding.title}<span className="text-blue-600">{APP_CONFIG.branding.titleAccent}</span>
        </h1>
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.3em] leading-tight whitespace-nowrap">{APP_CONFIG.branding.subTitle}</span>
      </div>

      <div className="flex-1 flex justify-center max-w-2xl mx-4 lg:mx-12 relative" ref={dropdownRef}>
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`group flex items-center bg-gray-50 border px-4 py-2 gap-4 w-full transition-all hover:bg-white hover:border-blue-300 rounded-none cursor-pointer ${
            isDropdownOpen ? 'border-blue-400 bg-white ring-2 ring-blue-50' : 'border-gray-200/80'
          }`}
        >
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Context</span>
              <div className="flex items-center gap-1">
                 <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                 <span className="text-[9px] font-bold text-green-600 uppercase tracking-tighter">Sync Active</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
               <Database size={14} className="text-blue-600 shrink-0" strokeWidth={2.5} />
               <span className="text-xs md:text-sm font-bold text-gray-800 truncate tracking-tight">{selectedDataset.name}</span>
               <ChevronDown size={12} className={`text-gray-400 group-hover:text-blue-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end shrink-0 border-l border-gray-200 pl-4">
             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Rows</span>
             <span className="text-[11px] font-black text-gray-700 tabular-nums">{selectedDataset.rowCount}</span>
          </div>
        </div>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-2xl z-[100] animate-in fade-in slide-in-from-top-1 rounded-none overflow-hidden">
            <div className="max-h-[85vh] flex flex-col overflow-y-auto no-scrollbar">
              <div className="bg-gray-50/50 p-4 border-b border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={10} /> Repository</h3>
                <div className="space-y-1">
                  {datasets.map((ds) => (
                    <div key={ds.id} className={`flex items-center transition-all border ${ds.id === selectedDataset.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
                      <div className="flex-1 flex items-center min-w-0">
                        {editingDatasetId === ds.id ? (
                          <div className="flex-1 flex items-center px-3 py-2.5 gap-2" onClick={e => e.stopPropagation()}>
                              <input autoFocus value={editNameValue} onChange={e => setEditNameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRenameSubmit(ds.id)} className="flex-1 bg-white border border-blue-400 text-xs px-2 py-1 outline-none font-bold" />
                              <button onClick={() => handleRenameSubmit(ds.id)} className="text-green-600"><Save size={14} /></button>
                              <button onClick={() => setEditingDatasetId(null)} className="text-red-500"><X size={14} /></button>
                          </div>
                        ) : (
                          <button onClick={() => { onSelectDataset(ds.id); setIsDropdownOpen(false); }} className={`flex-1 flex items-center justify-between px-3 py-2.5 text-xs font-medium ${ds.id === selectedDataset.id ? 'text-blue-700' : 'text-gray-600 hover:text-blue-600'}`}>
                            <div className="flex items-center gap-3 truncate">
                              <Database size={12} className={ds.id === selectedDataset.id ? 'text-blue-600' : 'text-gray-400'} />
                              <div className="flex flex-col items-start truncate">
                                <span className="truncate">{ds.name}</span>
                                <span className="text-[8px] text-gray-400 font-bold uppercase">{ds.rowCount} Records</span>
                              </div>
                            </div>
                            {ds.id === selectedDataset.id && <Check size={14} className="text-blue-600" />}
                          </button>
                        )}
                      </div>
                      {editingDatasetId !== ds.id && (
                        <div className="flex items-center shrink-0 border-l border-gray-100 bg-white group-hover:bg-gray-50/50">
                          <button onClick={(e) => { e.stopPropagation(); onViewDataset(ds.id); setIsDropdownOpen(false); }} className="px-2.5 py-2.5 text-gray-400 hover:text-blue-600"><Eye size={14} /></button>
                          {ds.id !== 'ds-001' && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setEditingDatasetId(ds.id); setEditNameValue(ds.name); }} className="px-2.5 py-2.5 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                              <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${ds.name}?`)) onDeleteDataset(ds.id); }} className="px-2.5 py-2.5 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white">
                <button
                  onClick={() => setIsCreating(!isCreating)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all text-[11px] font-black uppercase tracking-widest rounded-none"
                >
                  <PlusCircle size={14} /> Engineer New Variant
                </button>

                {isCreating && (
                  <form onSubmit={handleCreate} className="mt-4 p-5 bg-gray-50/50 rounded-none border-t-2 border-blue-500 space-y-5">
                    <div>
                      <label className="text-[10px] font-black text-[#1a1f24] uppercase tracking-widest block mb-2">1. Variant Identity</label>
                      <div className="relative">
                        <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="new_variant.csv" className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 focus:border-blue-500 outline-none font-bold" />
                        <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-[#1a1f24] uppercase tracking-widest block mb-3">2. Construct Execution Pipeline</label>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {OPERATION_TYPES.map((op) => (
                          <button key={op.type} type="button" onClick={() => addOperation(op.type)} className="flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold uppercase transition-all border border-gray-200 bg-white text-gray-500 hover:border-blue-500 hover:text-blue-600">
                            {op.icon} <span className="truncate">Add {op.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3">
                        {pipeline.map((op, index) => (
                          <div key={op.id} className="p-3 border border-blue-100 bg-blue-50/20 relative animate-in slide-in-from-top-1">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-blue-100/50">
                               <div className="flex items-center gap-2 text-blue-700 font-black text-[9px] uppercase tracking-widest">
                                 <span className="flex items-center justify-center w-4 h-4 bg-blue-700 text-white rounded-full text-[8px]">{index + 1}</span>
                                 {op.type}
                               </div>
                               <button type="button" onClick={() => removeOperation(op.id)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                            </div>
                            {renderOpInput(op)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-2">
                      <button type="submit" disabled={!newName.trim() || pipeline.length === 0 || hasErrors} className="flex-1 bg-blue-600 text-white py-3 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 disabled:opacity-30 flex items-center justify-center gap-2">
                        <FileCheck size={14} /> Run Execution
                      </button>
                      <button type="button" onClick={() => { setIsCreating(false); setPipeline([]); }} className="px-6 py-3 text-[11px] font-black uppercase text-gray-400 border border-gray-200 hover:bg-white">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center">
        <button onClick={onExportClick} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-[#1a1f24] text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-blue-700 transition-all rounded-none">
          {UI_ICONS.Export} <span className="hidden lg:inline">Export</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
