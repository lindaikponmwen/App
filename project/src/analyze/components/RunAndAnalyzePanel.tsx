import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Zap,
  BarChart2,
  GitCompareArrows,
  CheckCircle2,
  XCircle,
  Loader,
  Clock,
  Check,
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FileCode2,
  Play
} from 'lucide-react';
import { mockRuns, Run } from '../data/runData';
import { currentUser, currentProject } from '../../data/appConfig';

interface RunAndAnalyzePanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeFileName: string | undefined;
}

const RunAndAnalyzePanel: React.FC<RunAndAnalyzePanelProps> = ({ isOpen, onClose, activeFileName }) => {
  const [activeRunTab, setActiveRunTab] = useState('run');
  const [selectedCompareRuns, setSelectedCompareRuns] = useState<string[]>([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [executionEngine, setExecutionEngine] = useState<'nonmem' | 'monolix' | 'drlevyai2'>('nonmem');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCompareRunToggle = (runId: string) => {
    setSelectedCompareRuns(prev =>
      prev.includes(runId)
        ? prev.filter(id => id !== runId)
        : [...prev, runId]
    );
  };

  const { selectedRuns, allParameters } = useMemo(() => {
    const selectedRuns = mockRuns.filter(run => selectedCompareRuns.includes(run.id));
    const allParameters = Array.from(
      new Set(selectedRuns.flatMap(run => (run.parameters ? Object.keys(run.parameters) : [])))
    ).sort((a, b) => {
      if (a === 'Objective Function') return 1;
      if (b === 'Objective Function') return -1;
      return a.localeCompare(b);
    });
    return { selectedRuns, allParameters };
  }, [selectedCompareRuns]);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'csv' | 'pdf' | 'r' | 'python') => {
    if (selectedRuns.length === 0) {
      alert("Please select at least one run to export.");
      setIsExportMenuOpen(false);
      return;
    }

    const headers = ['Parameter', ...selectedRuns.map(r => `${r.model} (${r.id})`)];
    const rows = allParameters.map(param => [
      param,
      ...selectedRuns.map(run => run.parameters?.[param] ?? 'N/A')
    ]);

    switch (format) {
      case 'csv': {
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        downloadFile(csvContent, 'model_comparison.csv', 'text/csv;charset=utf-8;');
        break;
      }
      case 'pdf': {
        alert("PDF export is not yet implemented.");
        break;
      }
      case 'r': {
        const scriptHeader = `
# File name: model_comparison.R
# Author: ${currentUser.name}
# Project: ${currentProject.name}
# Software version: DrLevey.AI Files v1.0
# Purpose: Comparison of final parameter estimates for selected models.

library(tibble)

`;
        const dfCreation = `comparison_data <- tribble(\n  ~Parameter, ${selectedRuns.map(r => `~"${r.model}_${r.id}"`).join(', ')},\n${rows.map(row => `  "${row[0]}", ${row.slice(1).map(val => typeof val === 'string' ? `"${val}"` : val).join(', ')}`).join(',\n')}\n)\n\nprint(comparison_data)\n`;
        downloadFile(scriptHeader + dfCreation, 'model_comparison.R', 'text/plain;charset=utf-8;');
        break;
      }
      case 'python': {
        const scriptHeader = `
# File name: model_comparison.py
# Author: ${currentUser.name}
# Project: ${currentProject.name}
# Software version: DrLevey.AI Files v1.0
# Purpose: Comparison of final parameter estimates for selected models.

import pandas as pd

`;
        const dataDict = `data = {\n  "Parameter": [${allParameters.map(p => `"${p}"`).join(', ')}],\n${selectedRuns.map(run => `  "${run.model} (${run.id})": [${allParameters.map(p => {
          const val = run.parameters?.[p];
          return typeof val === 'string' ? `"${val}"` : (val ?? 'None');
        }).join(', ')}]`).join(',\n')}\n}\n`;
        const dfCreation = `df = pd.DataFrame(data)\nprint(df)\n`;
        downloadFile(scriptHeader + dataDict + dfCreation, 'model_comparison.py', 'text/plain;charset=utf-8;');
        break;
      }
    }
    setIsExportMenuOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-1/2 bg-gray-50 z-50 shadow-2xl flex flex-col"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Run & Analyze</h2>
              <motion.button
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="p-2 bg-white border-b border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveRunTab('run')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                    activeRunTab === 'run'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Run</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveRunTab('analyze')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                    activeRunTab === 'analyze'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <BarChart2 className="w-4 h-4" />
                    <span>Analyze</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveRunTab('compare')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                    activeRunTab === 'compare'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <GitCompareArrows className="w-4 h-4" />
                    <span>Compare</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeRunTab === 'run' ? (
                <div className="space-y-8">
                  {/* Run Configuration */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-4">Run Configuration</h3>
                    <div className="bg-white p-4 border border-gray-200 rounded-lg space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Execution Engine</label>
                        <div className="mt-2 flex space-x-2 p-1 bg-gray-100 rounded-lg">
                          <button
                            onClick={() => setExecutionEngine('nonmem')}
                            className={`flex-1 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
                              executionEngine === 'nonmem'
                                ? 'bg-white shadow-sm text-blue-700'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            NONMEM
                          </button>
                          <button
                            onClick={() => setExecutionEngine('monolix')}
                            className={`flex-1 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
                              executionEngine === 'monolix'
                                ? 'bg-white shadow-sm text-blue-700'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            MONOLIX
                          </button>
                          <button
                            onClick={() => setExecutionEngine('drlevyai2')}
                            className={`flex-1 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
                              executionEngine === 'drlevyai2'
                                ? 'bg-white shadow-sm text-blue-700'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            DrLevy.Ai2
                          </button>
                        </div>
                      </div>

                      {executionEngine === 'nonmem' && (
                        <div className="space-y-4 pt-2">
                          <div>
                            <label htmlFor="nonmem-command" className="block text-sm font-medium text-gray-700 mb-2">Command</label>
                            <input
                              id="nonmem-command"
                              type="text"
                              readOnly
                              value={`nmfe75 ${activeFileName || ''}`}
                              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-not-allowed font-mono"
                            />
                          </div>
                          <motion.button
                            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Play className="w-4 h-4" />
                            <span>Start Run</span>
                          </motion.button>
                        </div>
                      )}

                      {executionEngine === 'monolix' && (
                        <div className="space-y-4 pt-2">
                          <div>
                            <label htmlFor="monolix-command" className="block text-sm font-medium text-gray-700 mb-2">Command</label>
                            <input
                              id="monolix-command"
                              type="text"
                              readOnly
                              value={`drleveyaim ${activeFileName || ''}`}
                              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-not-allowed font-mono"
                            />
                          </div>
                          <motion.button
                            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Play className="w-4 h-4" />
                            <span>Start Model Run</span>
                          </motion.button>
                        </div>
                      )}

                      {executionEngine === 'drlevyai2' && (
                        <div className="space-y-4 pt-2">
                          <div>
                            <label htmlFor="drlevyai-command" className="block text-sm font-medium text-gray-700 mb-2">Command</label>
                            <input
                              id="drlevyai-command"
                              type="text"
                              readOnly
                              value={`llmdrl ${activeFileName || ''}`}
                              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-not-allowed font-mono"
                            />
                          </div>
                          <motion.button
                            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Play className="w-4 h-4" />
                            <span>Run AI Model</span>
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Run History */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-4">Run History</h3>
                    <div className="space-y-3">
                      {mockRuns.map(run => {
                        const isRunning = run.status === 'Running';
                        const isCompleted = run.status === 'Completed';
                        const isFailed = run.status === 'Failed';
                        return (
                          <div key={run.id} className="bg-white p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">{run.model}</p>
                                <p className="text-sm text-gray-500">{run.id}</p>
                              </div>
                              <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${
                                isRunning ? 'bg-blue-100 text-blue-700' : 
                                isCompleted ? 'bg-emerald-100 text-emerald-700' : 
                                'bg-red-100 text-red-700'
                              }`}>
                                {isRunning && <Loader className="w-3 h-3 animate-spin" />}
                                {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                                {isFailed && <XCircle className="w-3 h-3" />}
                                <span>{run.status}</span>
                              </div>
                            </div>
                            {isRunning && run.progress !== undefined && (
                              <div className="mt-3">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${run.progress}%` }}></div>
                                </div>
                              </div>
                            )}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>{run.timestamp}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isCompleted && run.objectiveFunction !== undefined && (
                                  <>
                                    <span className="font-medium">Objective Function: {run.objectiveFunction}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>Convergence: <span className="text-emerald-700 font-semibold">{run.convergence}</span></span>
                                  </>
                                )}
                                {isFailed && (
                                  <span>Convergence: <span className="text-red-700 font-semibold">{run.convergence}</span></span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : activeRunTab === 'analyze' ? (
                <div className="flex items-center justify-center h-full text-center text-gray-500">
                  <p>Analysis tools and results will be available here after a run is completed.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-4">Select Runs to Compare</h3>
                    <div className="bg-white p-4 border border-gray-200 rounded-lg space-y-3">
                      {mockRuns.filter(r => r.status === 'Completed').map(run => (
                        <div
                          key={run.id}
                          onClick={() => handleCompareRunToggle(run.id)}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                              selectedCompareRuns.includes(run.id) ? 'bg-blue-50 border border-blue-300 ring-2 ring-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-gray-800">{run.model}</p>
                            <p className="text-xs text-gray-500">{run.id}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedCompareRuns.includes(run.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
                          }`}>
                            {selectedCompareRuns.includes(run.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {selectedCompareRuns.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-semibold text-gray-800">Parameter Comparison</h3>
                        <div className="relative" ref={exportMenuRef}>
                          <motion.button
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                            <ChevronDown className="w-4 h-4" />
                          </motion.button>
                          <AnimatePresence>
                            {isExportMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-10 border border-gray-100 overflow-hidden"
                              >
                                <button onClick={() => handleExport('csv')} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                                  <span>CSV</span>
                                </button>
                                <button onClick={() => handleExport('pdf')} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  <span>PDF</span>
                                </button>
                                <button onClick={() => handleExport('r')} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <FileCode2 className="w-4 h-4 text-gray-500" />
                                  <span>R Script</span>
                                </button>
                                <button onClick={() => handleExport('python')} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <FileCode2 className="w-4 h-4 text-gray-500" />
                                  <span>Python Script</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                              <th scope="col" className="px-6 py-3">Parameter</th>
                              {selectedRuns.map(run => (
                                <th key={run.id} scope="col" className="px-6 py-3 text-center">{run.model}<br/><span className="font-normal text-gray-500">({run.id})</span></th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {allParameters.map(param => (
                              <tr key={param} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                  {param}
                                </th>
                                {selectedRuns.map(run => (
                                  <td key={`${run.id}-${param}`} className="px-6 py-4 text-center">
                                    {run.parameters?.[param] ?? 'N/A'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                      <p>Select two or more completed runs to compare their parameters.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RunAndAnalyzePanel;