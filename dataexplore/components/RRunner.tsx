
import React, { useState, useRef, useEffect } from 'react';
import { FileText, FunctionSquare, Package, Brush, Play, Loader, Plus } from 'lucide-react';

type RunCodeSource = 'editor' | 'console' | 'ai';

interface ConsoleOutput {
  type: 'input' | 'stdout' | 'stderr' | 'system';
  message: string;
}

interface EnvironmentDetails {
  class: string[];
  type: string;
  str: string;
  objectType: 'variable' | 'function' | 'data';
}

type Environment = Record<string, EnvironmentDetails>;

interface RRunnerProps {
  consoleOutput: ConsoleOutput[];
  environment: Environment;
  packages: Record<string, string>;
  editorCode: string;
  isLoading: boolean;
  onClearConsole: () => void;
  onViewObject: (name: string) => void;
  runCode: (code: string, source: RunCodeSource) => void;
  onInstallPackage: (name: string) => void;
}

export function RRunner({ consoleOutput, environment, packages, editorCode, onClearConsole, onViewObject, runCode, onInstallPackage, isLoading }: RRunnerProps) {
  const [activeTopTab, setActiveTopTab] = useState('Console');

  const handleRunScript = () => {
    runCode(editorCode, 'editor');
  };

  return (
    <div className="h-full flex flex-col text-sm bg-white overflow-hidden">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="w-full text-left p-4 bg-gray-50 flex justify-between items-center text-gray-700 flex-shrink-0 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-[10px] uppercase tracking-[0.2em] text-[#1a1f24]">R-Engine Runtime</h2>
          </div>
        </div>
        
        <div className="flex-grow flex flex-col overflow-hidden relative">
          <div className="flex-shrink-0 border-b border-gray-200 bg-white">
            <nav className="flex">
              <TabButton isActive={activeTopTab === 'Console'} onClick={() => setActiveTopTab('Console')}>Console</TabButton>
              <TabButton isActive={activeTopTab === 'Environment'} onClick={() => setActiveTopTab('Environment')}>Env</TabButton>
              <TabButton isActive={activeTopTab === 'Package'} onClick={() => setActiveTopTab('Package')}>Packages</TabButton>
            </nav>
          </div>
          <div className="flex-grow overflow-hidden bg-white relative">
            {activeTopTab === 'Console' && <ConsolePanel output={consoleOutput} onClear={onClearConsole} runCode={runCode} onRunScript={handleRunScript} isLoading={isLoading} />}
            {activeTopTab === 'Environment' && <EnvironmentPanel environment={environment} onViewObject={onViewObject} runCode={runCode} />}
            {activeTopTab === 'Package' && <PackagesPanel packages={packages} onInstall={onInstallPackage} isLoading={isLoading} />}
          </div>
        </div>
      </div>
    </div>
  );
}

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button onClick={onClick} className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r border-gray-100 transition-colors relative ${
        isActive 
            ? 'text-blue-600 bg-blue-50/20' 
            : 'text-gray-400 hover:bg-gray-50 hover:text-gray-800'
    }`}>
        {children}
        {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />}
    </button>
);

const ConsolePanel = ({ output, onClear, runCode, onRunScript, isLoading }: { output: ConsoleOutput[], onClear: () => void, runCode: (code: string, source: RunCodeSource) => void, onRunScript: () => void, isLoading: boolean }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [tempUserCode, setTempUserCode] = useState('');

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [output]);

    const focusInput = () => inputRef.current?.focus();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmedCode = inputValue.trim();
            if (trimmedCode) {
                runCode(trimmedCode, 'console');
                setCommandHistory(prev => [trimmedCode, ...prev.filter(c => c !== trimmedCode)]);
                setHistoryIndex(-1);
                setInputValue('');
                setTempUserCode('');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length === 0) return;
            if (historyIndex === -1) setTempUserCode(inputValue);
            const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
            setHistoryIndex(newIndex);
            setInputValue(commandHistory[newIndex]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex === -1) return;
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInputValue(newIndex < 0 ? tempUserCode : commandHistory[newIndex]);
        }
    };
    
    return (
        <div className="h-full font-mono text-[11px] whitespace-pre-wrap relative flex flex-col bg-white" onClick={focusInput}>
            <div className="absolute top-2 right-2 z-10 flex items-center space-x-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onRunScript(); }}
                    disabled={isLoading}
                    className="p-1.5 bg-white text-gray-600 hover:text-blue-600 border border-gray-200 transition-colors shadow-sm"
                    title="Execute Workspace Code"
                >
                    {isLoading ? <Loader className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onClear(); }}
                    className="p-1.5 bg-white text-gray-600 hover:text-red-500 border border-gray-200 transition-colors shadow-sm"
                    title="Flush Output"
                >
                    <Brush size={12} />
                </button>
            </div>
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-1 custom-scrollbar">
                {output.map((line, index) => {
                    let colorClass = '';
                    let prefix = '';
                    switch (line.type) {
                        case 'input': colorClass = 'text-blue-600 font-bold'; prefix = '> '; break;
                        case 'stdout': colorClass = 'text-gray-800'; break;
                        case 'stderr': colorClass = 'text-red-600 bg-red-50 px-1 rounded'; break;
                        case 'system': colorClass = 'text-purple-600 italic opacity-70'; prefix = '# '; break;
                    }
                    return <div key={index} className={`${colorClass} leading-relaxed`}>{prefix}{line.message}</div>;
                })}
            </div>
            <div className="flex-shrink-0 flex items-center px-4 py-3 bg-gray-50 border-t border-gray-100">
                <span className="text-blue-600 font-bold mr-2">&gt;</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-grow bg-transparent border-none focus:ring-0 focus:outline-none p-0 font-mono text-[11px] text-gray-800"
                    autoFocus
                    spellCheck="false"
                    placeholder="Enter R command..."
                />
            </div>
        </div>
    );
};

const EnvironmentPanel = ({ environment, onViewObject, runCode }: { environment: Environment, onViewObject: (name: string) => void, runCode: (code: string, source: RunCodeSource) => void }) => (
    <div className="h-full overflow-y-auto bg-white custom-scrollbar">
        {Object.keys(environment).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                <span className="text-[10px] font-black uppercase tracking-widest">Environment Idle</span>
            </div>
        ) : (
            <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr className="border-b border-gray-200">
                        <th className="px-4 py-2 font-black text-gray-400 uppercase tracking-widest w-1/3">Symbol</th>
                        <th className="px-4 py-2 font-black text-gray-400 uppercase tracking-widest">Descriptor</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {Object.entries(environment).map(([name, details]) => {
                        const isData = details.objectType === 'data';
                        return (
                            <tr
                                key={name}
                                className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                                onClick={() => isData ? onViewObject(name) : runCode(name, 'console')}
                            >
                                <td className="px-4 py-2 font-mono text-[#1a1f24] flex items-center gap-2">
                                    {details.objectType === 'function'
                                        ? <FunctionSquare className="h-3 w-3 text-purple-500"/>
                                        : isData ? <FileText className="h-3 w-3 text-blue-500"/> : <Package className="h-3 w-3 text-gray-400"/>
                                    }
                                    <span className="font-bold group-hover:text-blue-600">{name}</span>
                                </td>
                                <td className="px-4 py-2 font-mono text-gray-400 truncate max-w-[150px]">{details.str}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        )}
    </div>
);

const PackagesPanel = ({ packages, onInstall, isLoading }: { packages: Record<string, string>, onInstall: (name: string) => void, isLoading: boolean }) => {
    const [pkgName, setPkgName] = useState('');
    const handleInstall = (e: React.FormEvent) => {
        e.preventDefault();
        if (pkgName.trim()) {
            onInstall(pkgName.trim());
            setPkgName('');
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-3 border-b border-gray-100 bg-gray-50">
                <form onSubmit={handleInstall} className="flex gap-2">
                    <input 
                        type="text" 
                        value={pkgName}
                        onChange={(e) => setPkgName(e.target.value)}
                        placeholder="Install library..."
                        className="flex-1 px-3 py-1.5 text-[11px] border border-gray-200 focus:border-blue-500 focus:ring-0 outline-none rounded-none font-bold"
                    />
                    <button 
                        type="submit" 
                        disabled={!pkgName.trim() || isLoading}
                        className="p-2 bg-[#1a1f24] text-white rounded-none hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </form>
            </div>
            <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                {Object.keys(packages).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                        <span className="text-[10px] font-black uppercase tracking-widest">Base Image Only</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-1">
                        {Object.entries(packages)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([pkg, ver]) => (
                            <div key={pkg} className="p-2 border border-gray-100 bg-white hover:border-blue-200 flex items-center justify-between transition-all group">
                                <div className="flex items-center gap-2">
                                    <Package className="h-3 w-3 text-blue-600"/>
                                    <span className="text-[11px] font-bold text-gray-700">{pkg}</span>
                                </div>
                                <span className="text-[9px] font-black text-gray-300 uppercase">{ver}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
