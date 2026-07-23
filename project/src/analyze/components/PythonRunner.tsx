import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FileText, Database, ChevronLeft, ChevronRight, Brush, Download, ArrowUp, ArrowDown, ChevronsUpDown, Image, Sparkles, Settings, HelpCircle, Play, Loader } from 'lucide-react';
import type { ConsoleOutput, PythonEnvironment, TableData, PlotData } from '../types';

interface PythonRunnerProps {
  consoleOutput: ConsoleOutput[];
  environment: PythonEnvironment;
  isEnvLoading: boolean;
  isLoading: boolean;
  tableData: TableData | null;
  plots: PlotData[];
  editorCode: string;
  onClearPlots: () => void;
  onClearTable: () => void;
  onClearConsole: () => void;
  onViewObject: (name: string) => void;
  onViewPlot: (name: string) => void;
  runCode: (code: string, options?: { isInteractive?: boolean }) => void;
}

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    extra?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, isOpen, onToggle, extra }) => {
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <button 
        onClick={onToggle} 
        className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 flex justify-between items-center text-gray-700 flex-shrink-0 border-b border-gray-200"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          <h2 className="font-bold text-sm uppercase tracking-wider">{title}</h2>
        </div>
        <div className="flex items-center space-x-2">
            {extra}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isOpen ? '' : '-rotate-90'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </div>
      </button>
      {isOpen && (
        <div className="flex-grow flex flex-col overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );
};

export function PythonRunner({ consoleOutput, environment, isEnvLoading, tableData, plots, editorCode, onClearPlots, onClearTable, onClearConsole, onViewObject, onViewPlot, runCode, isLoading }: PythonRunnerProps) {
  const [activeTopTab, setActiveTopTab] = useState('Console');
  const [activeBottomTab, setActiveBottomTab] = useState('Plots');
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [isOutputOpen, setIsOutputOpen] = useState(true);
  
  const openPanelsCount = [isWorkspaceOpen, isOutputOpen].filter(Boolean).length;

  const getPanelStyle = (isOpen: boolean) => {
    if (!isOpen) return { flex: '0 0 auto' };
    if (openPanelsCount === 0) return { flex: '1 1 0%', minHeight: 0 };
    return { flex: `1 1 ${100 / openPanelsCount}%`, minHeight: 0 };
  };

  useEffect(() => {
    if (plots.length > 0) setActiveBottomTab('Plots');
  }, [plots]);

  useEffect(() => {
    if (tableData) setActiveBottomTab('Tables');
  }, [tableData]);

  const handleViewObject = (name: string) => {
    onViewObject(name);
    setActiveBottomTab('Tables');
  };

  const handleViewPlot = (name: string) => {
    onViewPlot(name);
    setActiveBottomTab('Plots');
  };

  const handleRunScript = () => {
    runCode(editorCode, { isInteractive: false });
  };

  return (
    <>
      <div className="h-full flex flex-col text-sm bg-white overflow-hidden" style={{ minHeight: 0 }}>
        <div style={getPanelStyle(isWorkspaceOpen)}>
          <CollapsibleSection 
              title="Workspace"
              isOpen={isWorkspaceOpen}
              onToggle={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
          >
              <div className="flex-shrink-0 border-b border-gray-200 bg-gray-100">
                  <nav className="flex">
                      <TabButton isActive={activeTopTab === 'Console'} onClick={() => setActiveTopTab('Console')}>Console</TabButton>
                      <TabButton isActive={activeTopTab === 'Environment'} onClick={() => setActiveTopTab('Environment')}>Environment</TabButton>
                  </nav>
              </div>
              <div className="flex-grow overflow-hidden p-2 bg-white">
                  {activeTopTab === 'Console' && <ConsolePanel output={consoleOutput} onClear={onClearConsole} runCode={runCode} onRunScript={handleRunScript} isLoading={isLoading} />}
                  {activeTopTab === 'Environment' && <EnvironmentPanel environment={environment} onViewObject={handleViewObject} onViewPlot={handleViewPlot} isEnvLoading={isEnvLoading} />}
              </div>
          </CollapsibleSection>
        </div>

        <div className="border-t border-gray-200" style={getPanelStyle(isOutputOpen)}>
          <CollapsibleSection 
              title="Output"
              isOpen={isOutputOpen}
              onToggle={() => setIsOutputOpen(!isOutputOpen)}
          >
              <div className="flex-shrink-0 border-b border-gray-200 bg-gray-100">
                  <nav className="flex">
                      <TabButton isActive={activeBottomTab === 'Plots'} onClick={() => setActiveBottomTab('Plots')}>Plots</TabButton>
                      <TabButton isActive={activeBottomTab === 'Tables'} onClick={() => setActiveBottomTab('Tables')}>Tables</TabButton>
                      <TabButton isActive={activeBottomTab === 'Help'} onClick={() => setActiveBottomTab('Help')}>Help</TabButton>
                  </nav>
              </div>
              <div className="flex-grow overflow-hidden bg-white">
                  {activeBottomTab === 'Plots' && <PlotPanel plots={plots} onClear={onClearPlots}/>}
                  {activeBottomTab === 'Tables' && <TablesPanel tableData={tableData} onClear={onClearTable}/>}
                  {activeBottomTab === 'Help' && <HelpPanel />}
              </div>
          </CollapsibleSection>
        </div>
      </div>
    </>
  );
}

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm border-r border-gray-200 transition-colors ${
        isActive 
            ? 'bg-white text-gray-800 font-medium' 
            : 'text-gray-600 hover:bg-gray-200'
    }`}>
        {children}
    </button>
);

const HelpPanel = () => (
    <div className="h-full overflow-y-auto p-4 text-xs text-gray-700 space-y-4">
        <div>
            <h3 className="font-bold text-sm text-gray-800 mb-2">Keyboard Shortcuts</h3>
            <ul className="list-disc list-inside space-y-1">
                <li><span className="font-mono bg-gray-200 px-1 rounded">Ctrl + Enter</span> / <span className="font-mono bg-gray-200 px-1 rounded">Cmd + Enter</span>: Run the code in the editor.</li>
                <li><span className="font-mono bg-gray-200 px-1 rounded">Up/Down Arrow</span> (in editor): Navigate command history.</li>
                <li><span className="font-mono bg-gray-200 px-1 rounded">Up/Down Arrow</span> (in console): Navigate command history.</li>
                <li><span className="font-mono bg-gray-200 px-1 rounded">Enter</span> (in Console): Run the current line in the console.</li>
            </ul>
        </div>
        <div>
            <h3 className="font-bold text-sm text-gray-800 mb-2">How to Use This IDE</h3>
            <dl className="space-y-2">
                <div>
                    <dt className="font-semibold">Viewing Data:</dt>
                    <dd>Click on a pandas DataFrame variable in the "Environment" tab. The data will appear in the "Tables" tab.</dd>
                </div>
                <div>
                    <dt className="font-semibold">Generating Plots:</dt>
                    <dd>Use a plotting library like <code className="font-mono bg-gray-200 px-1 rounded">matplotlib</code>. Plots will automatically be captured and displayed in the "Plots" tab after your script runs.</dd>
                    <dd className="mt-1">You can also click on a Matplotlib Figure object in the "Environment" tab to display it.</dd>
                </div>
                <div>
                    <dt className="font-semibold">Environment:</dt>
                    <dd>The Environment tab shows all the variables in your current session. Click on DataFrames or Figure objects to view them.</dd>
                </div>
            </dl>
        </div>
    </div>
);

const ConsolePanel = ({ output, onClear, runCode, onRunScript, isLoading }: { output: ConsoleOutput[], onClear: () => void, runCode: (code: string, options?: { isInteractive?: boolean }) => void, onRunScript: () => void, isLoading: boolean }) => {
    const endOfConsoleRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [tempUserCode, setTempUserCode] = useState('');

    useEffect(() => {
        endOfConsoleRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [output]);

    useEffect(() => {
        if (historyIndex > -1 && inputValue !== commandHistory[historyIndex]) {
            setHistoryIndex(-1);
        }
    }, [inputValue, historyIndex, commandHistory]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmedCode = inputValue.trim();
            if (trimmedCode) {
                runCode(trimmedCode, { isInteractive: true });
                setCommandHistory(prev => [trimmedCode, ...prev.filter(c => c !== trimmedCode)]);
                setHistoryIndex(-1);
                setInputValue('');
                setTempUserCode('');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length === 0) return;
            if (historyIndex === -1) {
                setTempUserCode(inputValue);
            }
            const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
            setHistoryIndex(newIndex);
            setInputValue(commandHistory[newIndex]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex === -1) return;
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            if (newIndex < 0) {
                setInputValue(tempUserCode);
            } else {
                setInputValue(commandHistory[newIndex]);
            }
        }
    };
    
    return (
        <div className="h-full font-mono text-xs whitespace-pre-wrap relative flex flex-col" onClick={() => inputRef.current?.focus()}>
            <div className="absolute top-1 right-1 z-10 flex items-center space-x-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onRunScript(); }}
                    disabled={isLoading}
                    className="p-1.5 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Run Script"
                >
                    {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                </button>
                {output.length > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onClear(); }}
                        className="p-1.5 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300"
                        title="Clear console"
                    >
                        <Brush className="h-4 w-4" />
                    </button>
                )}
            </div>
            <div className="flex-grow overflow-y-auto pt-8">
                {output.map((line, index) => {
                    let colorClass = '';
                    let prefix = '';
                    switch (line.type) {
                        case 'input': colorClass = 'text-blue-600'; prefix = '>>> '; break;
                        case 'stdout': colorClass = 'text-gray-800'; break;
                        case 'stderr': colorClass = 'text-red-600'; break;
                        case 'system': colorClass = 'text-purple-600'; prefix = '# '; break;
                    }
                    return <p key={index} className={colorClass}>{prefix}{line.message}</p>;
                })}
                <div ref={endOfConsoleRef} />
            </div>
            <div className="flex-shrink-0 flex items-center mt-1">
                <span className="text-blue-600 font-bold">&gt;&gt;&gt;</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-grow bg-transparent border-none focus:ring-0 focus:outline-none p-0 pl-2 font-mono text-xs"
                    autoFocus
                    spellCheck="false"
                />
            </div>
        </div>
    );
};

const EnvironmentPanel = ({ environment, onViewObject, onViewPlot, isEnvLoading }: { environment: PythonEnvironment, onViewObject: (name: string) => void, onViewPlot: (name: string) => void, isEnvLoading: boolean }) => (
    <div className="h-full overflow-y-auto">
        {isEnvLoading ? (
            <p className="text-gray-500 italic p-2">Loading variables and data from environment...</p>
        ) : Object.keys(environment).length === 0 ? (
            <p className="text-gray-500 italic">Environment is empty.</p>
        ) : (
            <table className="w-full text-left text-xs">
                <thead>
                    <tr className="border-b border-gray-300">
                        <th className="p-1 font-semibold text-gray-700">Name</th>
                        <th className="p-1 font-semibold text-gray-700">Type</th>
                        <th className="p-1 font-semibold text-gray-700">Value</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(environment).map(([name, details]) => {
                         const isClickable = details.is_dataframe || details.is_figure;
                         const rowClass = isClickable
                            ? "border-b border-gray-200 hover:bg-blue-50 cursor-pointer"
                            : "border-b border-gray-200 hover:bg-gray-100";
                         
                         const handleClick = () => {
                             if (details.is_dataframe) {
                                 onViewObject(name);
                             } else if (details.is_figure) {
                                 onViewPlot(name);
                             }
                         }

                        return (
                            <tr key={name} className={rowClass} onClick={isClickable ? handleClick : undefined}>
                                <td className="p-1 font-mono text-gray-900 flex items-center space-x-2">
                                    {details.is_dataframe 
                                     ? <Database className="h-3 w-3 text-green-600 flex-shrink-0" /> 
                                     : details.is_figure
                                     ? <Image className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                     : <FileText className="h-3 w-3 text-blue-600 flex-shrink-0" />}
                                    <span>{name}</span>
                                </td>
                                <td className="p-1 font-mono text-gray-500">{details.type}</td>
                                <td className="p-1 font-mono text-gray-500 truncate" title={details.repr}>{details.repr}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        )}
    </div>
);

const TablesPanel = ({ tableData, onClear }: { tableData: TableData | null; onClear: () => void; }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });

    const sortedData = useMemo(() => {
        if (!tableData?.data) return [];
        let sortableItems = [...tableData.data];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key!];
                const valB = b[sortConfig.key!];
                if (valA === null || valA === undefined) return 1;
                if (valB === null || valB === undefined) return -1;
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
                }
                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                if (strA < strB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (strA > strB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [tableData?.data, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnName: string) => {
        if (sortConfig.key !== columnName) return <ChevronsUpDown className="h-3 w-3 text-gray-400" />;
        if (sortConfig.direction === 'ascending') return <ArrowUp className="h-3 w-3 text-blue-600" />;
        return <ArrowDown className="h-3 w-3 text-blue-600" />;
    };
    
    if (!tableData) return <p className="text-gray-500 italic p-4">No data to display. Click a DataFrame in the Environment tab.</p>;

    return (
        <div className="h-full flex flex-col p-2 bg-white">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                 <h3 className="font-bold text-base text-gray-800 font-sans">{tableData.name}</h3>
                 <button onClick={onClear} className="px-3 py-1 text-xs font-semibold bg-gray-200 rounded hover:bg-gray-300">Clear</button>
            </div>
            <div className="overflow-auto border rounded-sm flex-grow shadow-inner bg-gray-50">
                <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 bg-gray-100 z-10">
                        <tr>
                            {tableData.columns.map(col => (
                                <th key={col} className="p-2 font-bold border bg-gray-200 text-left cursor-pointer hover:bg-gray-300" onClick={() => requestSort(col)}>
                                    <div className="flex items-center justify-between">
                                        <span>{col}</span>
                                        {getSortIcon(col)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {sortedData.map((row, i) => (
                            <tr key={i} className="even:bg-gray-50 hover:bg-blue-50">
                                {tableData.columns.map(col => (
                                    <td key={col} className="p-2 border whitespace-nowrap font-mono">{String(row[col])}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {sortedData.length === 0 && <p className="text-center p-4">This data frame has 0 rows.</p>}
            </div>
        </div>
    );
};

const PlotPanel = ({ plots, onClear }: { plots: PlotData[]; onClear: () => void; }) => {
    const [currentPlotIndex, setCurrentPlotIndex] = useState(0);

    useEffect(() => {
        if (plots.length > 0) setCurrentPlotIndex(plots.length - 1);
    }, [plots.length]);

    const handleNextPlot = () => setCurrentPlotIndex(prev => Math.min(prev + 1, plots.length - 1));
    const handlePrevPlot = () => setCurrentPlotIndex(prev => Math.max(prev - 1, 0));

    const handleExportPlot = () => {
        const currentPlot = plots[currentPlotIndex];
        if (!currentPlot) return;
        const link = document.createElement('a');
        link.href = currentPlot.dataUrl;
        link.download = `python-plot-${currentPlotIndex + 1}.png`;
        link.click();
    };

    if (plots.length === 0) {
        return <p className="text-gray-500 italic p-4">No plots to display. Run plotting code.</p>;
    }

    const currentPlot = plots[currentPlotIndex];

    return (
        <div className="h-full flex flex-col p-2 space-y-2">
            <div className="flex justify-between items-center flex-shrink-0">
                <div className="flex items-center space-x-2">
                    {plots.length > 1 && (
                        <>
                            <button onClick={handlePrevPlot} disabled={currentPlotIndex === 0} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-xs font-medium">Plot {currentPlotIndex + 1} of {plots.length}</span>
                            <button onClick={handleNextPlot} disabled={currentPlotIndex === plots.length - 1} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handleExportPlot} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300" title="Export plot as PNG">
                        <Download className="h-4 w-4" />
                    </button>
                    <button onClick={() => { onClear(); setCurrentPlotIndex(0); }} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">
                        Clear Plots
                    </button>
                </div>
            </div>
            <div className="flex-grow relative overflow-hidden">
                {currentPlot && (
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                         <img src={currentPlot.dataUrl} alt={`Python Plot ${currentPlotIndex + 1}`} className="max-w-full max-h-full object-contain" />
                    </div>
                )}
            </div>
        </div>
    );
};