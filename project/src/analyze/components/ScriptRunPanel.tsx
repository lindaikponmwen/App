import React, { useState, useEffect, useMemo, useRef, useCallback, ReactNode } from 'react';
// FIX: AnimatePresence was not imported from framer-motion.
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Loader, Terminal as TerminalIcon, Image as ImageIcon, ChevronDown, ChevronUp, FileText as FileIcon, List, CheckCircle, Table as TableIcon, History, BarChart } from 'lucide-react';
import { FileNode } from '../../contexts/FileContext';
import { usePyodide } from '../hooks/usePyodide';
import { useWebR } from '../hooks/useWebR';
import { PythonRunner } from './PythonRunner';
import { RRunner } from './RRunner';
import { Loader as LoaderIcon, AlertTriangle } from 'lucide-react';

const MOCK_PLOT_SVG_DATA_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='400' height='300' style='background-color:%23ffffff; font-family: sans-serif;'%3E%3Ctext x='200' y='30' text-anchor='middle' font-size='18' font-weight='bold'%3EGoodness-of-Fit Plot%3C/text%3E%3Ctext x='200' y='280' text-anchor='middle' font-size='14'%3EPredicted Concentration%3C/text%3E%3Ctext x='20' y='150' text-anchor='middle' font-size='14' transform='rotate(-90 20 150)'%3EObserved Concentration%3C/text%3E%3Cg transform='translate(50, 40)'%3E%3Cpath d='M0 220 L320 220' stroke='%23333' stroke-width='1'/%3E%3Cpath d='M0 0 L0 220' stroke='%23333' stroke-width='1'/%3E%3Cpath d='M0 220 L320 0' stroke='%23f00' stroke-width='2' stroke-dasharray='5,5'/%3E%3Ccircle cx='40' cy='180' r='4' fill='%2300f'/%3E%3Ccircle cx='80' cy='150' r='4' fill='%2300f'/%3E%3Ccircle cx='120' cy='130' r='4' fill='%2300f'/%3E%3Ccircle cx='160' cy='100' r='4' fill='%2300f'/%3E%3Ccircle cx='200' cy='80' r='4' fill='%2300f'/%3E%3Ccircle cx='240' cy='60' r='4' fill='%2300f'/%3E%3Ccircle cx='280' cy='30' r='4' fill='%2300f'/%3E%3C/g%3E%3C/svg%3E";
const MOCK_TABLE_DATA = {
    title: 'dt.mtcars',
    headers: ['mpg', 'cyl', 'disp', 'hp', 'drat', 'wt', 'qsec', 'vs', 'am', 'gear', 'carb'],
    rows: [
        [21, 6, 160, 110, 3.9, 2.62, 16.46, 0, 1, 4, 4],
        [21, 6, 160, 110, 3.9, 2.875, 17.02, 0, 1, 4, 4],
        [22.8, 4, 108, 93, 3.85, 2.32, 18.61, 1, 1, 4, 1],
        [21.4, 6, 258, 110, 3.08, 3.215, 19.44, 1, 0, 3, 1],
        [18.7, 8, 360, 175, 3.15, 3.44, 17.02, 0, 0, 3, 2],
        [18.1, 6, 225, 105, 2.76, 3.46, 20.22, 1, 0, 3, 1],
        [14.3, 8, 360, 245, 3.21, 3.57, 15.84, 0, 0, 3, 4],
        [24.4, 4, 146.7, 62, 3.69, 3.19, 20, 1, 0, 4, 2],
        [22.8, 4, 140.8, 95, 3.92, 3.15, 22.9, 1, 0, 4, 2],
        [19.2, 6, 167.6, 123, 3.92, 3.44, 18.3, 1, 0, 4, 4],
        [17.8, 6, 167.6, 123, 3.92, 3.44, 18.9, 1, 0, 4, 4],
        [16.4, 8, 275.8, 180, 3.07, 4.07, 17.4, 0, 0, 3, 3],
        [17.3, 8, 275.8, 180, 3.07, 3.73, 17.6, 0, 0, 3, 3],
        [15.2, 8, 275.8, 180, 3.07, 3.78, 18, 0, 0, 3, 3],
        [10.4, 8, 472, 205, 2.93, 5.25, 17.98, 0, 0, 3, 4],
        [10.4, 8, 460, 215, 3, 5.424, 17.82, 0, 0, 3, 4],
        [14.7, 8, 440, 230, 3.23, 5.345, 17.42, 0, 0, 3, 4],
        [32.4, 4, 78.7, 66, 4.08, 2.2, 19.47, 1, 1, 4, 1],
        [30.4, 4, 75.7, 52, 4.93, 1.615, 18.52, 1, 1, 4, 2],
        [33.9, 4, 71.1, 65, 4.22, 1.835, 19.9, 1, 1, 4, 1],
        [21.5, 4, 120.1, 97, 3.7, 2.465, 20.01, 1, 0, 3, 1]
    ]
};

const MOCK_ENV_DATA = [
    { name: 'dt.mtcars', details: "'data.frame': 32 obs. of 11 variables", type: 'dataframe' },
    { name: 'env_details', details: "list()", type: 'list' },
    { name: 'my_data', details: "'data.frame': 5 obs. of 3 variables", type: 'dataframe' },
    { name: 'res', details: "List of 2", type: 'list' }
];

const MOCK_PACKAGE_DATA = [
    { name: 'base', version: '4.5.1' },
    { name: 'datasets', version: '4.5.1' },
    { name: 'ggplot2', version: '4.0.0' },
    { name: 'graphics', version: '4.5.1' },
    { name: 'grDevices', version: '4.5.1' },
    { name: 'methods', version: '4.5.1' },
    { name: 'stats', version: '4.5.1' },
    { name: 'utils', version: '4.5.1' },
];

interface ScriptRunPanelProps {
  onClose: () => void;
  activeFile: FileNode | null;
}

type VmState = 'READY' | 'RUNNING';
type ConsoleLine = { id: number; type: 'stdout' | 'stderr' | 'system' | 'stdin'; content: string };
type TableData = { title: string; headers: string[]; rows: (string | number)[][] } | null;

const CollapsibleSection = ({ title, children, isCollapsed, onToggle }: { title: string, children: ReactNode, isCollapsed: boolean, onToggle: () => void }) => (
    <div className="border-b border-gray-200">
        <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200">
            <h3 className="font-semibold text-xs uppercase text-gray-600">{title}</h3>
            {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
        </button>
        <AnimatePresence initial={false}>
            {!isCollapsed && (
                 <motion.div
                    key="content"
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                        open: { opacity: 1, height: 'auto' },
                        collapsed: { opacity: 0, height: 0 },
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                 >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const TabButton = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 text-sm font-semibold rounded-md ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
    >
        {label}
    </button>
);

const DataTable = ({ data, onClear }: { data: TableData, onClear: () => void }) => {
    if (!data) {
        return <div className="p-4 text-sm text-gray-500">No data to display. Run code that uses `View()`.</div>;
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-2">
                <p className="font-mono font-semibold text-sm">{data.title}</p>
                <button onClick={onClear} className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Clear</button>
            </div>
            <div className="w-full overflow-auto border border-gray-300 max-h-96">
                <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-gray-200 z-10">
                        <tr>
                            <th className="sticky left-0 bg-gray-200 border-r border-gray-300 p-2 text-center font-bold">#</th>
                            {data.headers.map((header, i) => (
                                <th key={i} className="p-2 border-l border-gray-300 text-left font-bold">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="even:bg-gray-50">
                                <td className="sticky left-0 bg-gray-100 border-r border-gray-300 p-2 text-center text-gray-600">{rowIndex + 1}</td>
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="p-2 border-l border-gray-300 whitespace-nowrap">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PythonPanel = ({ activeFile, onClose }: { activeFile: FileNode; onClose: () => void }) => {
    // FIX: Destructure clear functions to pass as props to PythonRunner.
    const { isLoading, isEnvLoading, runCode, viewObjectByName, viewPlotByName, clearPlots, clearTable, clearConsole, ...pyodideState } = usePyodide();
    
    return (
        <div className="h-full w-full flex flex-col bg-white">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-2">
                    <button onClick={() => runCode(activeFile.content || '', { isInteractive: false })} disabled={isLoading} className="px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center">
                        {isLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {isLoading ? 'Running...' : 'Run Script'}
                    </button>
                </div>
                <motion.button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5" />
                </motion.button>
            </div>
            <div className="flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <LoaderIcon className="w-6 h-6 animate-spin mr-2" /> Loading Python Environment...
                    </div>
                ) : (
                    // FIX: Pass onClearPlots, onClearTable, and onClearConsole props to PythonRunner.
                    <PythonRunner
                        {...pyodideState}
                        isEnvLoading={isEnvLoading}
                        isLoading={isLoading}
                        runCode={runCode}
                        onViewObject={viewObjectByName}
                        onViewPlot={viewPlotByName}
                        editorCode={activeFile.content || ''}
                        onClearPlots={clearPlots}
                        onClearTable={clearTable}
                        onClearConsole={clearConsole}
                    />
                )}
            </div>
        </div>
    );
};

const RPanel = ({ activeFile, onClose }: { activeFile: FileNode; onClose: () => void }) => {
    // FIX: Destructure clear functions to pass as props to RRunner.
    const { isLoading, runCode, viewObjectByName, clearPlots, clearTable, clearConsole, ...webRState } = useWebR();

    return (
        <div className="h-full w-full flex flex-col bg-white">
             <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-2">
                     <button onClick={() => runCode(activeFile.content || '')} disabled={isLoading} className="px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center">
                        {isLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {isLoading ? 'Running...' : 'Run Script'}
                    </button>
                </div>
                <motion.button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5" />
                </motion.button>
            </div>
             <div className="flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <LoaderIcon className="w-6 h-6 animate-spin mr-2" /> Loading R Environment...
                    </div>
                ) : (
                    // FIX: Pass onClearPlots, onClearTable, and onClearConsole props to RRunner.
                    <RRunner
                        {...webRState}
                        isLoading={isLoading}
                        runCode={runCode}
                        onViewObject={viewObjectByName}
                        editorCode={activeFile.content || ''}
                        onClearPlots={clearPlots}
                        onClearTable={clearTable}
                        onClearConsole={clearConsole}
                    />
                )}
            </div>
        </div>
    );
};

const ScriptRunPanel: React.FC<ScriptRunPanelProps> = ({ onClose, activeFile }) => {
    const extension = activeFile?.extension?.toLowerCase();

    if (!activeFile) {
        return (
            <div className="flex items-center justify-center h-full text-center text-gray-500">
                <p>No script file selected.</p>
            </div>
        );
    }

    if (extension === 'py') {
        return <PythonPanel activeFile={activeFile} onClose={onClose} />;
    }
    if (extension === 'r' || extension === 'R') {
        return <RPanel activeFile={activeFile} onClose={onClose} />;
    }
    
    return (
        <div className="h-full w-full flex flex-col bg-white">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-2">
                    <button disabled className="px-3 py-1.5 text-sm font-semibold bg-gray-400 text-white rounded-md flex items-center cursor-not-allowed">
                        <Play className="w-4 h-4 mr-2" />
                        Run Script
                    </button>
                </div>
                <motion.button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5" />
                </motion.button>
            </div>
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
                <AlertTriangle className="w-10 h-10 text-yellow-500 mb-4" />
                <p className="font-semibold">Cannot run this file type</p>
                <p>The interactive runner only supports Python (.py) and R (.R) files.</p>
            </div>
        </div>
    );
};

export default ScriptRunPanel;