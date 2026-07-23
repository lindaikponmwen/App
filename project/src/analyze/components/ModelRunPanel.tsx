import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Zap,
  BarChart2,
  GitCompareArrows,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader,
  Clock,
  Play,
  X,
  ExternalLink,
  Search,
  Maximize2,
  ChevronDown,
  Upload,
  Database,
  ChevronRight,
  Copy,
  Check,
  FileText,
  User,
  Users,
  Layers,
  Activity,
  Download,
  Trash2,
  Lock
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table as DocxTable, 
  TableRow as DocxTableRow, 
  TableCell as DocxTableCell, 
  WidthType, 
  TextRun 
} from 'docx';
import { mockRuns, Run, RunParameterEstimate } from '../data/runData';
import { currentUser } from '../../data/appConfig';
import StandardAccountLimits from '../../components/StandardAccountLimits';
import { FileNode } from '../../contexts/FileContext';

const VITE_USE_PHP_BACKEND = true;

const apiFetch = (url: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  headers.set('X-User-Uid', currentUser.uid || currentUser.id);
  return fetch(url, { ...options, headers });
};

const exportToCSV = (filename: string, headers: string[], rows: (string | number | null | undefined)[][]) => {
  const content = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
        const val = cell === undefined || cell === null ? '' : String(cell);
        return `"${val.replace(/"/g, '""')}"`;
    }).join(','))
  ].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

const exportToDocx = async (filename: string, title: string, headers: string[], rows: (string | number | null | undefined)[][]) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 28 })],
            spacing: { after: 200 }
          }),
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new DocxTableRow({
                children: headers.map(h => new DocxTableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: "f4f4f5" }
                }))
              }),
              ...rows.map(row => new DocxTableRow({
                children: row.map(cell => new DocxTableCell({
                  children: [new Paragraph({ text: cell === undefined || cell === null ? 'N/A' : String(cell) })]
                }))
              }))
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};

interface ModelRunPanelProps {
  onClose?: () => void;
  activeFile: FileNode | null;
  onFileNameChange?: (newName: string) => void;
}

const DiagnosticPlot: React.FC<{ title: string, xLabel: string, yLabel: string, type?: 'scatter' | 'histogram' }> = ({ title, xLabel, yLabel, type = 'scatter' }) => {
    const points = useMemo(() => Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random() })), []);
    const bars = useMemo(() => Array.from({ length: 15 }, () => Math.random()), []);

    return (
        <div className="bg-white p-4 border border-zinc-200 shadow-sm">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">{title}</h4>
            <div className="aspect-video bg-zinc-50 border border-zinc-100 relative overflow-hidden flex items-center justify-center">
                <svg viewBox="0 0 100 80" className="w-full h-full p-4">
                    {/* Grid lines */}
                    <line x1="10" y1="65" x2="90" y2="65" stroke="#e4e4e7" strokeWidth="0.5" />
                    <line x1="10" y1="5" x2="10" y2="65" stroke="#e4e4e7" strokeWidth="0.5" />
                    
                    {/* Labels */}
                    <text x="50" y="78" fontSize="3" fill="#71717a" textAnchor="middle" className="font-mono">{xLabel}</text>
                    <text x="5" y="35" fontSize="3" fill="#71717a" textAnchor="middle" transform="rotate(-90, 5, 35)" className="font-mono">{yLabel}</text>
                    
                    {type === 'scatter' ? (
                        <>
                            <line x1="10" y1="65" x2="90" y2="5" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
                            {points.map((p, i) => (
                                <circle key={i} cx={10 + p.x * 80} cy={65 - (p.y * 60)} r="0.8" fill="#3b82f6" opacity="0.6" />
                            ))}
                        </>
                    ) : (
                         <g>
                            {bars.map((height, i) => (
                                <rect key={i} x={10 + i * 5.3} y={65 - (height * 55)} width="4" height={height * 55} fill="#10b981" opacity="0.6" />
                            ))}
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
};

const ParameterTable: React.FC<{ title: string, data: RunParameterEstimate[] }> = ({ title, data }) => {
    const hasSE = data.some(p => p.se !== undefined && p.se !== null);
    const hasBackTrans = data.some(p => p.backTransformed);
    const hasBSV = data.some(p => p.bsv);
    const hasShrink = data.some(p => p.shrinkage);

    const handleCSV = () => {
        const headers = ['Parameter', 'Value', 'RSE (%)'];
        if (hasSE) headers.push('SE');
        if (hasBackTrans) headers.push('Back-transformed');
        if (hasBSV) headers.push('BSV (CV%)');
        if (hasShrink) headers.push('Shrinkage (%)');
        
        const rows = data.map(p => {
            const rseStr = p.rse !== undefined && p.rse !== null ? (p.rse * 100).toFixed(1) + '%' : '-';
            const row = [p.name, p.value.toFixed(3), rseStr];
            if (hasSE) row.push(p.se !== undefined && p.se !== null ? p.se.toFixed(3) : '-');
            if (hasBackTrans) row.push(p.backTransformed || '-');
            if (hasBSV) row.push(p.bsv || '-');
            if (hasShrink) row.push(p.shrinkage || '-');
            return row;
        });
        exportToCSV(`${title.replace(/\s+/g, '_')}.csv`, headers, rows);
    };

    const handleDocx = () => {
        const headers = ['Parameter', 'Value', 'RSE (%)'];
        if (hasSE) headers.push('SE');
        if (hasBackTrans) headers.push('Back-transformed');
        if (hasBSV) headers.push('BSV (CV%)');
        if (hasShrink) headers.push('Shrinkage (%)');

        const rows = data.map(p => {
            const rseStr = p.rse !== undefined && p.rse !== null ? (p.rse * 100).toFixed(1) + '%' : '-';
            const row = [p.name, p.value.toFixed(3), rseStr];
            if (hasSE) row.push(p.se !== undefined && p.se !== null ? p.se.toFixed(3) : '-');
            if (hasBackTrans) row.push(p.backTransformed || '-');
            if (hasBSV) row.push(p.bsv || '-');
            if (hasShrink) row.push(p.shrinkage || '-');
            return row;
        });
        exportToDocx(`${title.replace(/\s+/g, '_')}.docx`, title, headers, rows);
    };

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
                <div className="flex space-x-2">
                    <button 
                        onClick={handleCSV}
                        className="flex items-center px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-blue-600 border border-zinc-200 hover:border-blue-200 transition-colors"
                        title="Download as CSV"
                    >
                        <Download className="w-3 h-3 mr-1" /> CSV
                    </button>
                    <button 
                        onClick={handleDocx}
                        className="flex items-center px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-indigo-600 border border-zinc-200 hover:border-indigo-200 transition-colors"
                        title="Download as DOCX"
                    >
                        <FileText className="w-3 h-3 mr-1" /> DOCX
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto border border-zinc-200">
                <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                        <tr>
                            <th className="px-4 py-2 font-medium">Parameter</th>
                            <th className="px-4 py-2 font-medium text-right">Value</th>
                            <th className="px-4 py-2 font-medium text-right">RSE (%)</th>
                            {hasSE && <th className="px-4 py-2 font-medium text-right">SE</th>}
                            {hasBackTrans && <th className="px-4 py-2 font-medium">Back-transformed(95%CI)</th>}
                            {hasBSV && <th className="px-4 py-2 font-medium text-right">BSV(CV%)</th>}
                            {hasShrink && <th className="px-4 py-2 font-medium text-right">Shrink(SD)%</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {data.map(p => (
                            <tr key={p.name} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-4 py-2 font-mono text-zinc-700 whitespace-nowrap">{p.name}</td>
                                <td className="px-4 py-2 font-mono text-right text-zinc-900 tabular-nums">{p.value.toFixed(3)}</td>
                                <td className={`px-4 py-2 font-mono text-right tabular-nums ${p.rse !== undefined && p.rse !== null && p.rse > 0.2 ? 'text-rose-600 font-bold' : 'text-zinc-500'}`}>
                                    {p.rse !== undefined && p.rse !== null ? `${(p.rse * 100).toFixed(1)}%` : '-'}
                                </td>
                                {hasSE && <td className="px-4 py-2 font-mono text-right text-zinc-500 tabular-nums">{p.se !== undefined && p.se !== null ? p.se.toFixed(3) : '-'}</td>}
                                {hasBackTrans && <td className="px-4 py-2 font-mono text-zinc-600 italic whitespace-nowrap">{p.backTransformed || '-'}</td>}
                                {hasBSV && <td className="px-4 py-2 font-mono text-right text-zinc-600 tabular-nums">{p.bsv || '-'}</td>}
                                {hasShrink && <td className="px-4 py-2 font-mono text-right text-zinc-600 tabular-nums">{p.shrinkage || '-'}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const normalizeParamName = (name: string) => {
    if (!name) return '';
    let clean = name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    clean = clean.toUpperCase();
    if (clean === 'CLEARANCE') return 'CL';
    if (clean === 'VOLUME') return 'V1';
    return clean;
};

const ComparisonParameterTable: React.FC<{
    type: 'theta' | 'omega' | 'sigma';
    referenceRun: Run;
    comparatorRuns: Run[];
}> = ({ type, referenceRun, comparatorRuns }) => {

    const data = useMemo(() => {
        const refParams = referenceRun.parameterEstimates?.[type] || [];
        const allParams: { name: string, runId: string | 'ref', value: number }[] = [];
        
        refParams.forEach(p => {
            allParams.push({ name: p.name, runId: 'ref', value: p.value });
        });

        comparatorRuns.forEach(run => {
            (run.parameterEstimates?.[type] || []).forEach(p => {
                allParams.push({ name: p.name, runId: run.id, value: p.value });
            });
        });

        const normalizedKeys = new Set<string>();
        allParams.forEach(p => normalizedKeys.add(normalizeParamName(p.name)));

        return Array.from(normalizedKeys).sort().map(normKey => {
            const groupParams = allParams.filter(p => normalizeParamName(p.name) === normKey);
            const refGroupParam = groupParams.find(p => p.runId === 'ref');
            const representativeName = refGroupParam ? refGroupParam.name : groupParams[0]?.name || normKey;
            
            const refValue = refGroupParam?.value;
            const comparators = comparatorRuns.map(run => {
                const compParam = (run.parameterEstimates?.[type] || []).find(p => normalizeParamName(p.name) === normKey);
                const compValue = compParam?.value;
                const delta = (refValue !== undefined && compValue !== undefined) ? compValue - refValue : null;
                return { value: compValue, delta };
            });

            return { name: representativeName, refValue, comparators };
        });
    }, [type, referenceRun, comparatorRuns]);

    const handleCSV = () => {
        const headers = ['Parameter', `${referenceRun.model} (Ref)`, ...comparatorRuns.map(r => r.model)];
        const rows = data.map(({ name, refValue, comparators }) => [
            name,
            refValue !== undefined ? refValue.toFixed(3) : 'N/A',
            ...comparators.map(c => c.value !== undefined ? c.value.toFixed(3) : 'N/A')
        ]);
        exportToCSV(`${type}_comparison.csv`, headers, rows);
    };

    const handleDocx = () => {
        const headers = ['Parameter', `${referenceRun.model} (Ref)`, ...comparatorRuns.map(r => r.model)];
        const rows = data.map(({ name, refValue, comparators }) => [
            name,
            refValue !== undefined ? refValue.toFixed(3) : 'N/A',
            ...comparators.map(c => c.value !== undefined ? c.value.toFixed(3) : 'N/A')
        ]);
        exportToDocx(`${type}_comparison.docx`, `${type.toUpperCase()} Parameter Comparison`, headers, rows);
    };

    if (data.length === 0) {
        return <p className="text-sm text-zinc-500 italic">No parameters available for comparison.</p>
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-end space-x-2">
                <button onClick={handleCSV} className="flex items-center px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-blue-600 border border-zinc-200 hover:border-blue-200 transition-colors">
                    <Download className="w-3 h-3 mr-1" /> CSV
                </button>
                <button onClick={handleDocx} className="flex items-center px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-indigo-600 border border-zinc-200 hover:border-indigo-200 transition-colors">
                    <FileText className="w-3 h-3 mr-1" /> DOCX
                </button>
            </div>
            <div className="overflow-x-auto border border-zinc-200">
                <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                        <tr>
                            <th className="px-4 py-2 font-medium">Parameter</th>
                            <th className="px-4 py-2 font-medium text-right">{referenceRun.model} (Ref)</th>
                            {comparatorRuns.map(run => (
                                <th key={run.id} className="px-4 py-2 font-medium text-right">{run.model}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {data.map(({ name, refValue, comparators }) => (
                            <tr key={name} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-4 py-2 font-mono font-medium text-zinc-700">{name}</td>
                                <td className="px-4 py-2 font-mono text-right text-zinc-900">{refValue !== undefined ? refValue.toFixed(3) : 'N/A'}</td>
                                {comparators.map((comp, index) => (
                                    <td key={index} className="px-4 py-2 font-mono text-right">
                                        {comp.value !== undefined ? comp.value.toFixed(3) : 'N/A'}
                                        {comp.delta !== null && (
                                            <span className={`ml-2 text-[10px] ${comp.delta > 0 ? 'text-rose-500' : comp.delta < 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                                ({comp.delta > 0 ? '+' : ''}{comp.delta.toFixed(3)})
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ComparisonMetricTable: React.FC<{
    referenceRun: Run;
    comparatorRuns: Run[];
}> = ({ referenceRun, comparatorRuns }) => {
    const metrics = ['Objective Function', 'AIC', 'BIC', 'Condition Number'];
    
    const handleCSV = () => {
        const headers = ['Metric', `Reference (${referenceRun.id})`, ...comparatorRuns.map(r => r.id)];
        const rows = metrics.map(metric => {
            const key = (metric === 'Objective Function' ? 'objectiveFunction' : metric === 'Condition Number' ? 'conditionNumber' : metric.toLowerCase()) as keyof Run;
            return [metric, (referenceRun as Record<string, unknown>)[key] ?? 'N/A', ...comparatorRuns.map(run => (run as Record<string, unknown>)[key] ?? 'N/A') ];
        });
        exportToCSV('metrics_comparison.csv', headers, (rows as (string | number | null | undefined)[][]));
    };

    const handleDocx = () => {
        const headers = ['Metric', `Reference (${referenceRun.id})`, ...comparatorRuns.map(r => r.id)];
        const rows = metrics.map(metric => {
            const key = (metric === 'Objective Function' ? 'objectiveFunction' : metric === 'Condition Number' ? 'conditionNumber' : metric.toLowerCase()) as keyof Run;
            return [metric, (referenceRun as Record<string, unknown>)[key] ?? 'N/A', ...comparatorRuns.map(run => (run as Record<string, unknown>)[key] ?? 'N/A') ];
        });
        exportToDocx('metrics_comparison.docx', 'Metrics Comparison', headers, (rows as (string | number | null | undefined)[][]));
    };

    return (
        <div className="bg-white p-6 border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-zinc-900 uppercase">Metrics Comparison</h3>
                <div className="flex space-x-2">
                    <button onClick={handleCSV} className="flex items-center px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-blue-600 border border-zinc-200 hover:border-blue-200 transition-colors">
                        <Download className="w-3 h-3 mr-1" /> CSV
                    </button>
                    <button onClick={handleDocx} className="flex items-center px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-indigo-600 border border-zinc-200 hover:border-indigo-200 transition-colors">
                        <FileText className="w-3 h-3 mr-1" /> DOCX
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-zinc-500 uppercase bg-zinc-50 border-y border-zinc-200">
                        <tr>
                            <th className="px-4 py-3 font-bold">Metric</th>
                            <th className="px-4 py-3 font-bold text-right text-blue-700">Reference ({referenceRun.id})</th>
                            {comparatorRuns.map(run => (
                                <th key={run.id} className="px-4 py-3 font-bold text-right">{run.id}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {metrics.map(metric => {
                            const key = (metric === 'Objective Function' ? 'objectiveFunction' : metric === 'Condition Number' ? 'conditionNumber' : metric.toLowerCase()) as keyof Run;
                            return (
                                <tr key={metric} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-zinc-900">{metric}</td>
                                    <td className="px-4 py-3 font-mono text-right text-blue-700">{(referenceRun as Record<string, unknown>)[key] as React.ReactNode ?? 'N/A'}</td>
                                    {comparatorRuns.map(run => (
                                        <td key={run.id} className="px-4 py-3 font-mono text-right text-zinc-600">{(run as Record<string, unknown>)[key] as React.ReactNode ?? 'N/A'}</td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ModelRunPanel: React.FC<ModelRunPanelProps> = ({ onClose, activeFile, onFileNameChange }) => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [activeRunTab, setActiveRunTab] = useState('run');
  const [selectedCompareRuns, setSelectedCompareRuns] = useState<string[]>([]);
  const [executionEngine, setExecutionEngine] = useState<'nonmem' | 'r' | 'phikl'>('nonmem');
  
  const [analyzedRunId, setAnalyzedRunId] = useState<string | null>(null);
  const [activeParamsTab, setActiveParamsTab] = useState<'theta' | 'omega' | 'sigma'>('theta');

  const [compareParamsTab, setCompareParamsTab] = useState<'theta' | 'omega' | 'sigma'>('theta');

  const [datasets, setDatasets] = useState<string[]>([]);
  const [datasetsPath, setDatasetsPath] = useState<string>('');
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [datasetColumns, setDatasetColumns] = useState<string[]>([]);
  const [isDatasetSectionOpen, setIsDatasetSectionOpen] = useState(false);
  const [isUploadingDataset, setIsUploadingDataset] = useState(false);

  const [isColumnsCopied, setIsColumnsCopied] = useState(false);
  const [viewingLogRunId, setViewingLogRunId] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<string>('');

  const [lastLogUpdate, setLastLogUpdate] = useState<string>('');
  const [datasetToDelete, setDatasetToDelete] = useState<string | null>(null);

  const stoppedRunsRef = useRef<Set<string>>(new Set());

  const fileName = activeFile?.name || '';
  const code = activeFile?.content || '';

  const isFreeUser = currentUser.level === 'free';
  
  const handleCopyColumns = useCallback(() => {
    if (datasetColumns.length === 0) return;
    const text = `$INPUT ${datasetColumns.join(' ')}`;
    navigator.clipboard.writeText(text);
    setIsColumnsCopied(true);
    setTimeout(() => setIsColumnsCopied(false), 2000);
  }, [datasetColumns]);

  //console.log('ModelRunPanel initialized for:', fileName);


  const handleViewLog = useCallback((runId: string) => {
    setViewingLogRunId(runId);
    setLogContent('Loading log...');
    setLastLogUpdate('');
    
    if (VITE_USE_PHP_BACKEND) {
        const run = runs.find(r => r.id === runId);
        if (run) {
            const actualRunId = run.backendRunId || run.id;
            const url = run.jobId 
                ? `https://execute.drlevy.cloud/api/execute.php?action=log&job_id=${run.jobId}`
                : `https://execute.drlevy.cloud/api/execute.php?action=log&run_id=${actualRunId}`;
                
            apiFetch(url)
                .then(res => res.json())
                .then((data: Record<string, unknown>) => {
                    if (data.log) {
                        setLogContent(data.log as string);
                        setLastLogUpdate(new Date().toLocaleTimeString());
                    } else if (data.message) {
                        setLogContent(data.message as string);
                    } else if (data.files && Array.isArray(data.files) && data.files.length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const logFile = data.files.find((f: any) => f.name.endsWith('.log') || f.name.endsWith('.lst'));
                        if (logFile && logFile.content) {
                            setLogContent(logFile.content as string);
                            setLastLogUpdate(new Date().toLocaleTimeString());
                        } else {
                            setLogContent('No log content available in response.');
                        }
                    } else { 
                        setLogContent('No log content available.'); 
                    }
                })
                .catch(err => setLogContent(`Error fetching log: ${err.message}`));
        } else {
             setLogContent('Log viewing not available for this run.');
        }
    } else {
        setLogContent(`[MOCK LOG] Run ID: ${runId}\nExecution started...\nProcessing data...\nIteration 1: OBJ=123.4\nIteration 2: OBJ=120.1\n...`);
        setLastLogUpdate(new Date().toLocaleTimeString());
    }
  }, [runs]);

  const handleCloseLog = useCallback(() => {
    setViewingLogRunId(null);
    setLogContent('');
    setLastLogUpdate('');
  }, []);

  const handleDownloadRun = useCallback((runId: string) => {
    const run = runs.find(r => r.id === runId);
    if (!run) return;
    const actualRunId = run.backendRunId || run.id;
    if (VITE_USE_PHP_BACKEND) {
        window.open(`https://execute.drlevy.cloud/api/download_run.php?run_id=${actualRunId}&uid=${currentUser.uid || currentUser.id}`, '_blank');
    } else { alert('Downloading runs is only supported with the PHP backend.'); }
  }, [runs]);

  const completedRuns = useMemo(() => runs.filter(r => r.status === 'Completed' || r.status === 'Failed'), [runs]);
  const isExecuting = useMemo(() => runs.some(r => r.status === 'Running'), [runs]);

  // Poll for log updates when modal is open
    useEffect(() => {
        let interval: any;
        if (viewingLogRunId && VITE_USE_PHP_BACKEND) {
            interval = setInterval(() => {
                const run = runs.find(r => r.id === viewingLogRunId);
                if (run) {
                     const actualRunId = run.backendRunId || run.id;
                     const url = run.jobId 
                        ? `https://execute.drlevy.cloud/api/execute.php?action=log&job_id=${run.jobId}`
                        : `https://execute.drlevy.cloud/api/execute.php?action=log&run_id=${actualRunId}`;
                     apiFetch(url)
                        .then(res => res.json())
                        .then(data => {
                            if (data.log) {
                                setLogContent(data.log);
                                setLastLogUpdate(new Date().toLocaleTimeString());
                            } else if (data.message) {
                                setLogContent(data.message);
                            }
                        })
                        .catch(console.error);
                }
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
      }, [viewingLogRunId, runs]);

  useEffect(() => {
    const fetchRuns = () => {
        if (VITE_USE_PHP_BACKEND) {
            apiFetch('https://execute.drlevy.cloud/api/execute.php?action=list')
                .then(res => res.json())
                .then(data => {
                    if (data.runs) {
                        setRuns(prev => {
                            // Merge runs to preserve local state for running/queued runs if needed, 
                            // but generally the backend is the source of truth.
                            // Here we just replace as the list should be fresh.
                            return data.runs;
                        });
                    }
                })
                .catch(err => console.error('Failed to fetch runs', err));
        } else {
            setRuns(mockRuns);
        }
    };

    fetchRuns();
    
    let interval: any;
    if (VITE_USE_PHP_BACKEND) {
        interval = setInterval(fetchRuns, 15000); // Poll every 15s
    }
    
    return () => {
        if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => { if (runs.length > 0 && !analyzedRunId) setAnalyzedRunId(runs[0].id); }, [runs, analyzedRunId]);

  useEffect(() => {
    if (VITE_USE_PHP_BACKEND) {
      apiFetch('https://execute.drlevy.cloud/api/list_datasets.php').then(res => res.json()).then(data => {
          if (data.datasets) {
              setDatasets(data.datasets);
              if (data.datasetsDir) {
                  setDatasetsPath(data.datasetsDir);
              }
              if (data.datasets.length > 0 && !selectedDataset) setSelectedDataset(data.datasets[0]);
          }
      }).catch(console.error);
    } else {
        setDatasets(['sample_data.csv', 'pk_data_v1.csv']);
        setDatasetsPath('/tmp/mock/datasets');
        if (!selectedDataset) setSelectedDataset('sample_data.csv');
    }
  }, [VITE_USE_PHP_BACKEND, selectedDataset]);

  useEffect(() => {
    if (selectedDataset) {
        if (VITE_USE_PHP_BACKEND) {
            apiFetch(`https://execute.drlevy.cloud/api/get_dataset_columns.php?dataset=${encodeURIComponent(selectedDataset)}`).then(res => res.json()).then(data => data.columns && setDatasetColumns(data.columns)).catch(console.error);
        } else { setDatasetColumns(['ID', 'TIME', 'AMT', 'DV', 'WT', 'AGE', 'SEX']); }
    } else { setDatasetColumns([]); }
  }, [selectedDataset]);

  const handleDatasetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDataset(true);
    if (VITE_USE_PHP_BACKEND) {
      const formData = new FormData();
      formData.append('dataset', file);
      try {
        const res = await apiFetch('https://execute.drlevy.cloud/api/upload_dataset.php', { method: 'POST', body: formData });
        if (res.ok) {
            const data = await res.json();
            setDatasets(prev => Array.from(new Set([...prev, data.fileName])));
            setSelectedDataset(data.fileName);
        }
      } catch (err) { console.error('Upload error', err); }
    } else {
      setTimeout(() => {
        setDatasets(prev => Array.from(new Set([...prev, file.name])));
        setSelectedDataset(file.name);
      }, 1000);
    }
    setIsUploadingDataset(false);
  };

  const confirmDatasetDelete = async (dataset: string) => {
    if (VITE_USE_PHP_BACKEND) {
      try {
        const res = await apiFetch(`https://execute.drlevy.cloud/api/delete_dataset.php?dataset=${encodeURIComponent(dataset)}`, {
          method: 'DELETE'
        });
        
        if (!res.ok) throw new Error('Delete failed');
        
        // Refresh datasets list
        const listRes = await apiFetch('https://execute.drlevy.cloud/api/list_datasets.php');
        const listData = await listRes.json();
        if (listData.datasets) {
            setDatasets(listData.datasets);
            setSelectedDataset(listData.datasets.length > 0 ? listData.datasets[0] : '');
            if (listData.datasets.length === 0) {
                setDatasetColumns([]);
            }
        }
      } catch (err) {
        console.error('Delete error', err);
        alert('Failed to delete dataset');
      }
    } else {
      // Mock delete
      setDatasets(prev => {
          const newDatasets = prev.filter(d => d !== dataset);
          setSelectedDataset(newDatasets.length > 0 ? newDatasets[0] : '');
          if (newDatasets.length === 0) {
              setDatasetColumns([]);
          }
          return newDatasets;
      });
    }
    setDatasetToDelete(null);
  };

  const handleStop = useCallback(async (runId: string) => {
    const run = runs.find(r => r.id === runId);
    if (!run) return;
    stoppedRunsRef.current.add(runId);
    setRuns(prev => prev.map(r => r.id === runId ? { ...r, status: 'Cancelled', message: 'Run was cancelled locally.' } : r));
    if (VITE_USE_PHP_BACKEND && run.jobId) {
        try { 
            await apiFetch('https://execute.drlevy.cloud/api/execute.php', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel', job_id: run.jobId }) 
            }); 
        } catch (e) { console.error('Stop error', e); }
    }
  }, [runs]);

  const handleExecute = useCallback(async () => {
    if (isFreeUser) return;
    if ((executionEngine === 'nonmem' || executionEngine === 'phikl') && !selectedDataset) {
        alert('Please upload or select a dataset before executing a NONMEM or PHIKL model.');
        return;
    }
    const baseId = fileName || `RUN${String(runs.length + 1).padStart(3, '0')}`;
    let runId = baseId;
    let counter = 1;
    while (runs.some(r => r.id === runId)) { 
        runId = `${baseId}_${counter}`; 
        counter++; 
    }

    const finalFileName = fileName || (executionEngine === 'r' ? 'model.R' : executionEngine === 'phikl' ? 'model.phikl' : 'model_v2.ctl');

    const newRun: Run = {
      id: runId,
      model: finalFileName,
      status: 'Running',
      timestamp: new Date().toLocaleString(),
      progress: 0,
      engine: executionEngine,
      convergence: 'N/A'
    };

    setRuns(prev => [newRun, ...prev]);
    setAnalyzedRunId(runId);

    if (VITE_USE_PHP_BACKEND) {
      try {
        let finalCode = code;
        // Basic dataset replacement if needed
        if (selectedDataset && executionEngine === 'nonmem') {
            const datasetPath = `${datasetsPath}${datasetsPath.endsWith('/') || datasetsPath.endsWith('\\') ? '' : '/'}${selectedDataset}`;
            if (/\$DATA\s+/i.test(finalCode)) {
                finalCode = finalCode.replace(/^(\s*\$DATA\s+)[^\s]+/im, `$1${datasetPath}`);
            } else {
                const match = finalCode.match(/^\s*\$(SUBROUTINES|PK|ERROR|THETA)/im);
                if (match && match.index !== undefined) {
                    finalCode = finalCode.slice(0, match.index) + `$DATA ${datasetPath} IGNORE=@\n\n` + finalCode.slice(match.index);
                } else {
                    finalCode += `\n$DATA ${datasetPath} IGNORE=@\n`;
                }
            }
        }

        const action = (executionEngine === 'r' || finalFileName.endsWith('.R') || finalFileName.endsWith('.Rmd')) ? 'generate_report' : 'process_file';

        const response = await apiFetch('https://execute.drlevy.cloud/api/execute.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              action,
              run_id: runId,
              filename: finalFileName,
              content: finalCode,
              dataset: selectedDataset,
              engine: executionEngine
          })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Execution failed to start');
        }

        const data = await response.json();
        const jobId = data.job_id;
        const backendRunId = data.run_id;
        
        // Update run with jobId and backendRunId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRuns(prev => prev.map(r => r.id === runId ? { ...r, jobId, backendRunId } : r) as any);

        // Polling Strategy with Exponential Backoff
        const INTERVALS = [2000, 2000, 3000, 5000, 10000, 15000, 30000];
        const TERMINAL = ['completed', 'failed', 'rejected', 'cancelled'];
        let attempt = 0;

        const poll = async () => {
            if (stoppedRunsRef.current.has(runId)) {
                return; // Stop polling if cancelled locally
            }

            try {
                const res = await apiFetch(`https://execute.drlevy.cloud/api/execute.php?action=status&job_id=${jobId}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setRuns(prev => prev.map(r => r.id === runId ? { ...r, status: 'Failed', progress: 0 } : r));
                        return;
                    }
                    throw new Error('Status fetch failed');
                }

                const statusData = await res.json();
                let status = statusData.status;
                if (status === 'done') status = 'completed';

                if (stoppedRunsRef.current.has(runId)) return;

                if (status === 'completed') {
                    setRuns(prev => prev.map(r => r.id === runId ? {
                        ...r,
                        status: 'Completed',
                        progress: 100,
                    } : r));
                } else if (status === 'failed' || status === 'rejected') {
                    setRuns(prev => prev.map(r => r.id === runId ? { 
                        ...r, 
                        status: 'Failed', 
                        message: status === 'rejected' ? 'Run was rejected by the server before execution.' : 'Run encountered an error. Check the log for details.',
                        progress: 0,
                        isRejected: status === 'rejected'
                    } : r));
                } else if (status === 'cancelled') {
                    const isAdvisoryCancel = !!statusData.job?.cancel_note;
                    setRuns(prev => prev.map(r => r.id === runId ? { 
                        ...r, 
                        status: isAdvisoryCancel ? 'Running' : 'Cancelled', 
                        message: statusData.job?.cancel_note || 'Run was cancelled.',
                        progress: isAdvisoryCancel ? r.progress : 0 
                    } : r));
                } else if (status === 'pending') {
                    setRuns(prev => prev.map(r => r.id === runId ? { ...r, status: 'Queued', progress: 0 } : r));
                } else if (status === 'running') {
                    setRuns(prev => prev.map(r => r.id === runId ? { 
                        ...r, 
                        status: 'Running', 
                        progress: Math.min(99, (r.progress || 0) + 5),
                        workerId: statusData.job?.worker_id
                    } : r));
                }

                const isAdvisoryCancel = status === 'cancelled' && !!statusData.job?.cancel_note;
                if (TERMINAL.includes(status) && !isAdvisoryCancel) {
                    // Fetch full analyze if completed
                    if (status === 'completed' && backendRunId) {
                        const analyzeRes = await apiFetch(`https://execute.drlevy.cloud/api/analyze.php?run_id=${backendRunId}`);
                        if (analyzeRes.ok) {
                            const analyzeData = await analyzeRes.json();
                            if (analyzeData && !analyzeData.error) {
                                setRuns(prev => prev.map(r => r.id === runId ? { ...r, ...analyzeData } : r));
                            }
                        }
                    }
                    return; // stop polling
                }

                const delay = INTERVALS[Math.min(attempt, INTERVALS.length - 1)];
                attempt++;
                setTimeout(poll, delay);

            } catch (e) {
                console.error('Polling error', e);
                // Retry on error with backoff
                const delay = INTERVALS[Math.min(attempt, INTERVALS.length - 1)];
                attempt++;
                setTimeout(poll, delay);
            }
        };

        poll();

      } catch (error) {
        console.error('Execution error', error);
        setRuns(prev => prev.map(r => r.id === runId ? { ...r, status: 'Failed' } : r));
      }
      return;
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setRuns(prev => prev.map(r => r.id === runId ? {
          ...r,
          status: 'Completed',
          progress: 100,
          objectiveFunction: parseFloat((1000 + Math.random() * 500).toFixed(2)),
          conditionNumber: parseFloat((10 + Math.random() * 50).toFixed(1)),
          convergence: 'Successful',
          parameterEstimates: {
            theta: [
              { name: 'CL (L/h)', value: 5 + (Math.random() - 0.5), rse: 10 + Math.random() * 5 },
              { name: 'V2 (L)', value: 40 + (Math.random() - 0.5) * 5, rse: 8 + Math.random() * 4 },
              { name: 'Q (L/h)', value: 10 + (Math.random() - 0.5) * 2, rse: 15 + Math.random() * 5 },
              { name: 'V3 (L)', value: 100 + (Math.random() - 0.5) * 10, rse: 12 + Math.random() * 6 },
              { name: 'KA (1/h)', value: 1.5 + (Math.random() - 0.5) * 0.2, rse: 20 + Math.random() * 10 }
            ],
            omega: [
              { name: 'IIV_CL', value: 0.09 + (Math.random() - 0.5) * 0.02, rse: 25 + Math.random() * 10 },
              { name: 'IIV_V2', value: 0.09 + (Math.random() - 0.5) * 0.02, rse: 25 + Math.random() * 10 },
              { name: 'IIV_KA', value: 0.25 + (Math.random() - 0.5) * 0.05, rse: 30 + Math.random() * 15 }
            ],
            sigma: [
              { name: 'PROP_ERR', value: 0.04 + (Math.random() - 0.5) * 0.01, rse: 10 + Math.random() * 5 },
              { name: 'ADD_ERR', value: 0.1 + (Math.random() - 0.5) * 0.02, rse: 40 + Math.random() * 20 }
            ]
          }
        } : r));
      } else {
        setRuns(prev => prev.map(r => r.id === runId ? { ...r, progress } : r));
      }
    }, 800);
  }, [runs, isFreeUser, fileName, code, selectedDataset, executionEngine, datasetsPath]);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analyzedRunData, setAnalyzedRunData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [compareRunData, setCompareRunData] = useState<Record<string, any>>({});

  const analyzedRunBackendId = useMemo(() => {
      const run = runs.find(r => r.id === analyzedRunId);
      return run?.backendRunId || run?.id;
  }, [runs, analyzedRunId]);

  const analyzedRunStatus = useMemo(() => {
      const run = runs.find(r => r.id === analyzedRunId);
      return run?.status;
  }, [runs, analyzedRunId]);

  useEffect(() => {
      if (VITE_USE_PHP_BACKEND && analyzedRunId && analyzedRunStatus === 'Completed') {
          setIsAnalyzing(true);
          apiFetch(`https://execute.drlevy.cloud/api/analyze.php?run_id=${analyzedRunBackendId}`)
              .then(res => res.json())
              .then(data => {
                  setAnalyzedRunData(data);
                  setIsAnalyzing(false);
              })
              .catch(err => {
                  console.error('Failed to fetch analyze data', err);
                  setIsAnalyzing(false);
              });
      } else {
          // If it's not completed or not backend, we don't fetch analyze data
          if (analyzedRunStatus !== 'Completed') {
              setAnalyzedRunData(null);
          }
      }
  }, [analyzedRunId, analyzedRunStatus, analyzedRunBackendId]);

  useEffect(() => {
      if (VITE_USE_PHP_BACKEND) {
          const runsToFetch = [analyzedRunId, ...selectedCompareRuns].filter(Boolean) as string[];
          runsToFetch.forEach(runId => {
              if (!compareRunData[runId]) {
                  const run = runs.find(r => r.id === runId);
                  const actualRunId = run?.backendRunId || runId;
                  apiFetch(`https://execute.drlevy.cloud/api/analyze.php?run_id=${actualRunId}`)
                      .then(res => res.json())
                      .then(data => {
                          setCompareRunData(prev => ({ ...prev, [runId]: data }));
                      })
                      .catch(err => console.error(`Failed to fetch compare data for ${runId}`, err));
              }
          });
      }
  }, [analyzedRunId, selectedCompareRuns, compareRunData, runs]);

  const analyzedRun = useMemo(() => {
      const run = runs.find(r => r.id === analyzedRunId);
      if (VITE_USE_PHP_BACKEND && analyzedRunData && run && run.id === analyzedRunId) {
          return { ...run, ...analyzedRunData };
      }
      return run;
  }, [analyzedRunId, runs, analyzedRunData]);

  const [runToDelete, setRunToDelete] = useState<string | null>(null);

  const handleDeleteRun = useCallback(async (runId: string) => {
    const run = runs.find(r => r.id === runId);
    if (!run) return;
    
    const actualRunId = run.backendRunId || run.id;

    if (VITE_USE_PHP_BACKEND) {
        try {
            const res = await apiFetch('https://execute.drlevy.cloud/api/delete_run.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId, backendRunId: actualRunId })
            });
            
            if (!res.ok) throw new Error('Delete failed');
        } catch (err) {
            console.error('Delete error', err);
            alert('Failed to delete run');
            return;
        }
    }
    setRuns(prev => prev.filter(r => r.id !== runId));
    if (analyzedRunId === runId) setAnalyzedRunId(null);
    setRunToDelete(null);
  }, [runs, analyzedRunId]);

  const referenceRun = useMemo(() => {
      const run = completedRuns.find(r => r.id === analyzedRunId);
      if (VITE_USE_PHP_BACKEND && compareRunData[analyzedRunId || ''] && run) {
          return { ...run, ...compareRunData[analyzedRunId || ''] };
      }
      return run;
  }, [analyzedRunId, completedRuns, compareRunData]);

  const selectedComparatorRuns = useMemo(() => {
      return runs.filter(run => selectedCompareRuns.includes(run.id)).map(run => {
          if (VITE_USE_PHP_BACKEND && compareRunData[run.id]) {
              return { ...run, ...compareRunData[run.id] };
          }
          return run;
      });
  }, [selectedCompareRuns, runs, compareRunData]);

  return (
    <div className="h-full flex flex-col bg-zinc-50 relative">
        {runToDelete && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl border border-zinc-200 max-w-sm w-full space-y-4">
                    <div className="flex items-center space-x-3 text-rose-600">
                        <div className="p-2 bg-rose-50 rounded-full"><XCircle className="w-6 h-6" /></div>
                        <h3 className="text-lg font-bold text-zinc-900">Delete Run?</h3>
                    </div>
                    <p className="text-sm text-zinc-600">Are you sure you want to delete run <span className="font-mono font-bold text-zinc-900">{runToDelete}</span>?</p>
                    <div className="flex items-center justify-end space-x-2 pt-2">
                        <button onClick={() => setRunToDelete(null)} className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded">Cancel</button>
                        <button onClick={() => handleDeleteRun(runToDelete)} className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-sm">Delete</button>
                    </div>
                </div>
            </div>
        )}

        {/* Dataset Delete Confirmation Modal */}
        {datasetToDelete && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl border border-zinc-200 max-w-sm w-full space-y-4">
                    <div className="flex items-center space-x-3 text-rose-600">
                        <div className="p-2 bg-rose-50 rounded-full">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900">Delete Dataset?</h3>
                    </div>
                    <p className="text-sm text-zinc-600">
                        Are you sure you want to delete dataset <span className="font-mono font-bold text-zinc-900">{datasetToDelete}</span>? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button 
                            onClick={() => setDatasetToDelete(null)}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => confirmDatasetDelete(datasetToDelete)}
                            className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-zinc-900">Model Dashboard</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-2 bg-white border-b border-zinc-200">
          <div className="flex space-x-1 bg-zinc-100 p-1">
            {['run', 'analyze', 'compare'].map(tab => (
              <button
                key={tab}
                disabled={tab !== 'run' && completedRuns.length === 0}
                onClick={() => setActiveRunTab(tab)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 text-sm font-medium transition-all ${
                  activeRunTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {tab === 'run' ? <Zap className="w-4 h-4" /> : tab === 'analyze' ? <BarChart2 className="w-4 h-4" /> : <GitCompareArrows className="w-4 h-4" />}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>
        </div>

        {isFreeUser && <StandardAccountLimits />}

        <div className="flex-1 overflow-y-auto p-6">
                {activeRunTab === 'run' && (
                    <div className="space-y-8">
                        <section>
                            <button 
                                onClick={() => setIsDatasetSectionOpen(!isDatasetSectionOpen)}
                                className="flex items-center space-x-2 text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 hover:text-zinc-300 transition-colors"
                            >
                                <ChevronRight className={`w-4 h-4 transition-transform ${isDatasetSectionOpen ? 'rotate-90' : ''}`} />
                                <span>Dataset Configuration</span>
                            </button>
                            
                            {isDatasetSectionOpen && (
                                <div className="bg-white p-6 border border-zinc-200 shadow-sm space-y-6 mb-8">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block">Select Dataset</label>
                                        <div className="flex space-x-2">
                                            <div className="relative flex-1">
                                                <select
                                                    value={selectedDataset}
                                                    onChange={(e) => setSelectedDataset(e.target.value)}
                                                    className="w-full bg-zinc-50 border border-zinc-200 p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-zinc-700"
                                                >
                                                    {datasets.length === 0 && <option value="">No datasets available</option>}
                                                    {datasets.map(ds => (
                                                        <option key={ds} value={ds}>{ds}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                            </div>
                                            <div className="relative flex space-x-2">
                                                <input
                                                    type="file"
                                                    id="dataset-upload"
                                                    className="hidden"
                                                    accept=".csv,.txt,.dat"
                                                    onChange={handleDatasetUpload}
                                                    disabled={isUploadingDataset}
                                                />
                                                <label
                                                    htmlFor="dataset-upload"
                                                    className={`flex items-center space-x-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold cursor-pointer transition-colors border border-zinc-200 ${isUploadingDataset ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {isUploadingDataset ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                    <span>Upload</span>
                                                </label>
                                                <button
                                                    onClick={() => setDatasetToDelete(selectedDataset)}
                                                    disabled={!selectedDataset || isUploadingDataset}
                                                    className={`flex items-center space-x-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer transition-colors border border-rose-200 ${(!selectedDataset || isUploadingDataset) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title="Delete selected dataset"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {selectedDataset && (
                                        <div className="flex flex-col space-y-1 text-xs text-zinc-500 bg-zinc-50 p-2 border border-zinc-100">
                                            <div className="flex items-center space-x-2">
                                                <Database className="w-3 h-3" />
                                                <span>Active Dataset: <span className="font-mono font-bold text-zinc-700">{selectedDataset}</span></span>
                                            </div>
                                            {datasetsPath && (
                                                <div className="pl-5 text-[10px] font-mono text-zinc-400 break-all">
                                                    Path: {datasetsPath}{datasetsPath.endsWith('/') || datasetsPath.endsWith('\\') ? '' : '/'}{selectedDataset}
                                                </div>
                                            )}
                                            {datasetColumns.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-zinc-100">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Columns</span>
                                                        <button 
                                                            onClick={handleCopyColumns}
                                                            className="flex items-center space-x-1 text-[10px] font-medium text-blue-500 hover:text-blue-600 transition-colors"
                                                            title="Copy as NONMEM $INPUT"
                                                        >
                                                            {isColumnsCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                            <span>{isColumnsCopied ? 'Copied!' : 'Copy $INPUT'}</span>
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {datasetColumns.map((col, i) => (
                                                            <span key={i} className="text-[10px] font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                                                                {col}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        <section>
                            <div className="flex space-x-2 mb-6 border-b border-zinc-200">
                                {['nonmem', 'r', 'phikl'].map(engine => (
                                    <button
                                        key={engine}
                                        onClick={() => {
                                            setExecutionEngine(engine as any);
                                            if (onFileNameChange) {
                                                const currentName = activeFile?.name || 'model';
                                                const baseName = currentName.replace(/\.[^/.]+$/, "");
                                                const newExt = engine === 'r' ? '.R' : engine === 'phikl' ? '.phikl' : '.ctl';
                                                onFileNameChange(`${baseName}${newExt}`);
                                            }
                                        }}
                                        className={`px-4 py-3 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors ${
                                            executionEngine === engine
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span>{engine}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                                executionEngine === engine 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-zinc-100 text-zinc-500'
                                            }`}>
                                                {runs.filter(r => (r.engine || 'nonmem') === engine).length}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Run Configuration</h3>
                                    <div className="bg-white p-6 border border-zinc-200 shadow-sm space-y-4">
                                        <div className="p-4 bg-zinc-900 font-mono text-xs text-zinc-300 border border-zinc-800">
                                            <span className="text-emerald-400">$</span> {executionEngine === 'nonmem' ? `nmfe75 ${fileName || 'model_v2.ctl'} ${(fileName || 'model_v2.ctl').replace(/\.[^/.]+$/, "")}.res -parafile=mpi.pnm -nodes=4` : executionEngine === 'r' ? `nlmixr2-cli ${fileName || 'model.R'}` : `phikl ${fileName || 'model.phikl'}`}
                                        </div>
                                        <button 
                                            onClick={handleExecute}
                                            disabled={isExecuting || isFreeUser}
                                            className={`w-full flex items-center justify-center space-x-2 py-3 text-white transition-all font-bold ${
                                                (isExecuting || isFreeUser) ? 'bg-zinc-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        >
                                            {isExecuting ? <Loader className="w-4 h-4 animate-spin" /> : isFreeUser ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                                            <span>{isExecuting ? 'Executing Model...' : isFreeUser ? 'Standard Account Limit' : 'Execute'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Recent Activity</h3>
                                    <div className="space-y-3">
                                        {runs.filter(r => (r.engine?.toLowerCase() || 'nonmem') === executionEngine).length === 0 ? (
                                            <div className="bg-white p-8 border border-zinc-200 border-dashed text-center">
                                                <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                                                <p className="text-sm text-zinc-500">No recent activity for {executionEngine.toUpperCase()}. Execute a model to see results.</p>
                                            </div>
                                        ) : (
                                            runs.filter(r => (r.engine?.toLowerCase() || 'nonmem') === executionEngine).map(run => (
                                                <div key={run.id} className="bg-white p-4 border border-zinc-200 shadow-sm hover:border-blue-200 transition-colors group">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`p-2 ${
                                                                run.status === 'Running' ? 'bg-blue-50 text-blue-600' : 
                                                                run.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                                                                run.status === 'Queued' ? 'bg-amber-50 text-amber-600' :
                                                                run.status === 'Cancelled' ? 'bg-zinc-50 text-zinc-600' :
                                                                'bg-rose-50 text-rose-600'
                                                            }`}>
                                                                {run.status === 'Running' ? <Loader className="w-4 h-4 animate-spin" /> : 
                                                                 run.status === 'Completed' ? <CheckCircle2 className="w-4 h-4" /> : 
                                                                 run.status === 'Queued' ? <Clock className="w-4 h-4" /> :
                                                                 run.status === 'Cancelled' ? <XCircle className="w-4 h-4" /> :
                                                                 <XCircle className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center space-x-2">
                                                                    <p className="font-bold text-zinc-900">{run.model}</p>
                                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 rounded border border-zinc-200">
                                                                        {run.engine || 'nonmem'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">{run.id} • {run.timestamp}</p>
                                                            </div>
                                                        </div>
                                                            <div className="text-right">
                                                                <div className="flex items-center justify-end space-x-2">
                                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                                                                        run.status === 'Running' ? 'text-blue-600' : 
                                                                        run.status === 'Completed' ? 'text-emerald-600' : 
                                                                        run.status === 'Queued' ? 'text-amber-600' :
                                                                        run.status === 'Cancelled' ? 'text-zinc-600' :
                                                                        'text-rose-600'
                                                                    }`}>
                                                                        {run.isRejected ? 'Rejected' : run.status}
                                                                    </span>
                                                                    {!run.isRejected && (
                                                                        <a 
                                                                            href={`http://app.drlevy.ai/modelexplore?model=${run.id}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-zinc-400 hover:text-indigo-500 transition-colors"
                                                                            title="Explore Model"
                                                                        >
                                                                            <ExternalLink className="w-4 h-4" />
                                                                        </a>
                                                                    )}
                                                                    {!run.isRejected && (
                                                                        <button 
                                                                            onClick={() => handleViewLog(run.id)}
                                                                            className="text-zinc-400 hover:text-blue-500 transition-colors"
                                                                            title="View Log"
                                                                        >
                                                                            <FileText className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                    {run.status !== 'Running' && run.status !== 'Queued' && !run.isRejected && (
                                                                        <>
                                                                            <button 
                                                                                onClick={() => handleDownloadRun(run.id)}
                                                                                className="text-zinc-400 hover:text-emerald-500 transition-colors"
                                                                                title="Download Run"
                                                                            >
                                                                                <Download className="w-4 h-4" />
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => setRunToDelete(run.id)}
                                                                                className="text-zinc-400 hover:text-rose-500 transition-colors"
                                                                                title="Delete Run"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    {run.isRejected && (
                                                                        <button 
                                                                            onClick={() => setRunToDelete(run.id)}
                                                                            className="text-zinc-400 hover:text-rose-500 transition-colors"
                                                                            title="Delete Run"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                    </div>
                                                    {(run.status === 'Running' || run.status === 'Queued') && (
                                                        <div className="mt-4 space-y-1">
                                                            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                                                                <span>
                                                                    {run.status === 'Queued' ? (run.message || 'Waiting in queue...') : 
                                                                     run.workerId ? `Running on worker ${run.workerId}` : 'Progress'}
                                                                </span>
                                                                <div className="flex items-center space-x-2">
                                                                    <span>{run.progress}%</span>
                                                                    <button 
                                                                        onClick={() => handleStop(run.id)}
                                                                        className="flex items-center space-x-1 bg-rose-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                                                        title="Stop Execution"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                        <span>Stop</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="w-full bg-zinc-100 h-1.5 overflow-hidden">
                                                                <div 
                                                                    style={{ width: `${run.progress}%` }}
                                                                    className={`h-full transition-all duration-300 ${run.status === 'Queued' ? 'bg-amber-500/50 w-full animate-pulse' : 'bg-blue-600'}`} 
                                                                />
                                                            </div>
                                                            {run.message && run.status === 'Running' && (
                                                                <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                                                    {run.message}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                

                {activeRunTab === 'analyze' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 border border-zinc-200 shadow-sm">
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block">Selected Run</label>
                            <div className="relative">
                                <select
                                    value={analyzedRunId || ''}
                                    onChange={(e) => setAnalyzedRunId(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                >
                                    {runs.map(run => (
                                        <option key={run.id} value={run.id}>{run.model} ({run.id}) - {run.status}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                        
                        {analyzedRun && (analyzedRun.status === 'Running' || analyzedRun.status === 'Queued') && (
                            <div className="flex flex-col items-center justify-center p-12 bg-white border border-zinc-200 shadow-sm">
                                <Loader className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                                <p className="text-sm font-medium text-zinc-600">Execution in progress...</p>
                                <p className="text-xs text-zinc-400 mt-2">Analysis will be available once the run completes ({analyzedRun.progress}%).</p>
                            </div>
                        )}
                        
                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-white border border-zinc-200 shadow-sm">
                                <Loader className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                                <p className="text-sm font-medium text-zinc-600">Loading analysis data...</p>
                            </div>
                        ) : analyzedRun && (
                            <div className="space-y-6">
                                {analyzedRun.status === 'Failed' && (
                                    <div className="bg-rose-50 border border-rose-200 p-6 flex items-start space-x-4">
                                        <div className="p-2 bg-rose-100 rounded-full text-rose-600">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-rose-900 uppercase mb-1">Model Execution Failed</h3>
                                            <p className="text-xs text-rose-700 leading-relaxed max-w-2xl">
                                                The estimation process terminated prematurely. This typically occurs due to numerical instability, poor starting values, or specification errors in the control stream.
                                                {analyzedRun.message && (
                                                    <span className="block mt-2 font-mono bg-rose-100/50 p-2 border border-rose-200/50">
                                                        {analyzedRun.message}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {analyzedRun.status === 'Completed' && (
                                    <div className="space-y-2">
                                        {/* Summary Header with Export */}
                                        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Execution Summary</h3>
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => {
                                                        const headers = ['Category', 'Statistic', 'Value'];
                                                        const rows = [
                                                            ['Model Fit', 'Objective Function', analyzedRun.objectiveFunction],
                                                            ['Model Fit', 'AIC', analyzedRun.aic],
                                                            ['Model Fit', 'BIC', analyzedRun.bic],
                                                            ['Dataset', 'Observations', analyzedRun.nObs],
                                                            ['Dataset', 'Subjects', analyzedRun.nInd],
                                                            ['Stability', 'Condition Number', analyzedRun.conditionNumber]
                                                        ].filter(r => r[2] != null);
                                                        exportToCSV(`run_${analyzedRun.id}_summary.csv`, headers, rows);
                                                    }}
                                                    className="flex items-center px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-blue-600 border border-zinc-200 hover:border-blue-200 transition-colors"
                                                >
                                                    <Download className="w-3 h-3 mr-1" /> CSV
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const headers = ['Category', 'Statistic', 'Value'];
                                                        const rows = [
                                                            ['Model Fit', 'Objective Function', analyzedRun.objectiveFunction],
                                                            ['Model Fit', 'AIC', analyzedRun.aic],
                                                            ['Model Fit', 'BIC', analyzedRun.bic],
                                                            ['Dataset', 'Observations', analyzedRun.nObs],
                                                            ['Dataset', 'Subjects', analyzedRun.nInd],
                                                            ['Stability', 'Condition Number', analyzedRun.conditionNumber]
                                                        ].filter(r => r[2] != null);
                                                        exportToDocx(`run_${analyzedRun.id}_summary.docx`, 'Run Summary Statistics', headers, rows);
                                                    }}
                                                    className="flex items-center px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-indigo-600 border border-zinc-200 hover:border-indigo-200 transition-colors"
                                                >
                                                    <FileText className="w-3 h-3 mr-1" /> DOCX
                                                </button>
                                            </div>
                                        </div>

                                        {/* Model Fit Statistics */}
                                        <div className="space-y-0">
                                            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center">
                                                    <BarChart2 className="w-3 h-3 mr-2" />
                                                    Model Fit Statistics
                                                </h3>
                                            </div>
                                            <div className="flex flex-col md:flex-row flex-wrap gap-4">
                                                {analyzedRun.objectiveFunction != null && (
                                                    <div className="flex-1 min-w-[200px] bg-white p-5 border border-zinc-200 shadow-sm transition-all hover:border-blue-200 hover:shadow-md group">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Objective Function</p>
                                                            <div className="w-6 h-6 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                                <BarChart2 className="w-3 h-3 text-zinc-400 group-hover:text-blue-500" />
                                                            </div>
                                                        </div>
                                                        <p className="text-3xl font-mono font-bold text-zinc-900 tabular-nums leading-none tracking-tight">
                                                            {typeof analyzedRun.objectiveFunction === 'number' ? analyzedRun.objectiveFunction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : analyzedRun.objectiveFunction}
                                                        </p>
                                                    </div>
                                                )}
                                                {analyzedRun.aic != null && (
                                                    <div className="flex-1 min-w-[200px] bg-white p-5 border border-zinc-200 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md group">
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight mb-2">AIC</p>
                                                        <p className="text-3xl font-mono font-bold text-zinc-900 tabular-nums leading-none tracking-tight">
                                                            {typeof analyzedRun.aic === 'number' ? analyzedRun.aic.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : analyzedRun.aic}
                                                        </p>
                                                    </div>
                                                )}
                                                {analyzedRun.bic != null && (
                                                    <div className="flex-1 min-w-[200px] bg-white p-5 border border-zinc-200 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md group">
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight mb-2">BIC</p>
                                                        <p className="text-3xl font-mono font-bold text-zinc-900 tabular-nums leading-none tracking-tight">
                                                            {typeof analyzedRun.bic === 'number' ? analyzedRun.bic.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : analyzedRun.bic}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dataset Summary & Numerical Stability */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-2">
                                                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center">
                                                        <Users className="w-3 h-3 mr-2" />
                                                        Dataset Summary
                                                    </h3>
                                                </div>
                                                <div className="flex">
                                                    {analyzedRun.nObs != null && (
                                                        <div className="flex-2 bg-zinc-50/50 p-4 border border-zinc-200 shadow-sm transition-all hover:border-zinc-300 group">
                                                            <div className="flex items-center space-x-2 mb-2">
                                                                <Layers className="w-3 h-3 text-zinc-400 group-hover:text-indigo-500" />
                                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Observations</p>
                                                            </div>
                                                            <p className="text-2xl font-mono font-bold text-zinc-900 leading-none">{analyzedRun.nObs}</p>
                                                        </div>
                                                    )}
                                                    {analyzedRun.nInd != null && (
                                                        <div className="flex-1 bg-zinc-50/50 p-4 border border-zinc-200 shadow-sm transition-all hover:border-zinc-300 group">
                                                            <div className="flex items-center space-x-2 mb-2">
                                                                <Users className="w-3 h-3 text-zinc-400 group-hover:text-amber-500" />
                                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Subjects</p>
                                                            </div>
                                                            <p className="text-2xl font-mono font-bold text-zinc-900 leading-none">{analyzedRun.nInd}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {analyzedRun.conditionNumber != null && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-2">
                                                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center">
                                                            <Activity className="w-3 h-3 mr-2" />
                                                            Numerical Stability
                                                        </h3>
                                                    </div>
                                                    <div className={`bg-white p-4 border shadow-sm transition-all group ${Number(analyzedRun.conditionNumber) > 900 ? 'border-rose-300 bg-rose-50/30' : 'border-zinc-200 hover:border-rose-200'}`}>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight mb-2">Condition Number</p>
                                                        <p className={`text-2xl font-mono font-bold leading-none tabular-nums ${Number(analyzedRun.conditionNumber) > 900 ? 'text-rose-600' : 'text-zinc-900'}`}>
                                                            {typeof analyzedRun.conditionNumber === 'number' ? analyzedRun.conditionNumber.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : analyzedRun.conditionNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {analyzedRun.status === 'Completed' && (
                                    <div className="bg-white p-6 border border-zinc-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-sm font-bold text-zinc-900 uppercase">Parameter Estimates</h3>
                                            <div className="flex bg-zinc-100 p-1">
                                                {['theta', 'omega', 'sigma'].map(type => (
                                                    <button
                                                        key={type}
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        onClick={() => setActiveParamsTab(type as any)}
                                                        className={`px-3 py-1 text-[10px] font-bold uppercase transition-all ${
                                                            activeParamsTab === type ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                                                        }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {analyzedRun.parameterEstimates && (
                                            <ParameterTable 
                                                title={activeParamsTab === 'theta' ? 'Fixed Effects' : activeParamsTab === 'omega' ? 'Random Effects' : 'Residual Error'} 
                                                data={analyzedRun.parameterEstimates[activeParamsTab]} 
                                            />
                                        )}
                                    </div>
                                )}

                                {analyzedRun.status === 'Completed' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-bold text-zinc-900 uppercase mb-4">Diagnostic Plots (Goodness-of-Fit)</h3>
                                            
                                            {VITE_USE_PHP_BACKEND && analyzedRunData?.plots?.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-0 border border-zinc-200 overflow-hidden">
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {analyzedRunData.plots.map((plot: any, idx: number) => (
                                                    <div key={idx} className="border-r last:border-r-0 border-b border-zinc-100 p-4 bg-white flex flex-col items-center group relative">
                                                        <div className="flex items-center justify-between w-full mb-3">
                                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{plot.name}</p>
                                                        </div>
                                                        <div className="w-full aspect-square flex items-center justify-center p-2">
                                                            <img src={plot.data} alt={plot.name} className="max-w-full max-h-full object-contain cursor-pointer" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-0 border border-zinc-200 overflow-hidden">
                                                <div className="border-r border-b border-zinc-100 group relative">
                                                    <DiagnosticPlot title="DV vs PRED" xLabel="PRED" yLabel="DV" />
                                                </div>
                                                <div className="border-b border-zinc-100 group relative">
                                                    <DiagnosticPlot title="DV vs IPRED" xLabel="IPRED" yLabel="DV" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

                {activeRunTab === 'compare' && referenceRun && (
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Select Runs to Compare</h3>
                            <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="max-h-48 overflow-y-auto">
                                    {completedRuns.filter(r => r.id !== referenceRun.id).map(r => (
                                        <label key={r.id} className="flex items-center space-x-3 p-3 hover:bg-zinc-50 border-b border-zinc-100 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedCompareRuns.includes(r.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedCompareRuns(prev => [...prev, r.id]);
                                                    else setSelectedCompareRuns(prev => prev.filter(id => id !== r.id));
                                                }}
                                                className="w-4 h-4 text-blue-600 bg-zinc-100 border-zinc-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-zinc-900">{r.model}</span>
                                            <span className="text-xs text-zinc-500 font-mono tracking-wider">{r.id}</span>
                                        </label>
                                    ))}
                                    {completedRuns.length <= 1 && (
                                        <div className="p-4 text-sm text-zinc-500 italic text-center">No other completed runs available for comparison.</div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <ComparisonMetricTable referenceRun={referenceRun} comparatorRuns={selectedComparatorRuns} />
                        <div className="bg-white p-6 border border-zinc-200 shadow-sm">
                            <div className="flex bg-zinc-100 p-1 mb-4">
                                {(['theta', 'omega', 'sigma'] as const).map(type => (
                                    <button key={type} onClick={() => setCompareParamsTab(type)} className={`flex-1 py-1 text-[10px] font-bold uppercase ${compareParamsTab === (type as string) ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500'}`}>{type}</button>
                                ))}
                            </div>
                            <ComparisonParameterTable type={compareParamsTab} referenceRun={referenceRun} comparatorRuns={selectedComparatorRuns} />
                        </div>
                    </div>
                )}
        </div>

        {viewingLogRunId && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white shadow-2xl border border-zinc-200 w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">Run Log</h3>
                                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{viewingLogRunId}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleCloseLog}
                            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-full transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-0 bg-zinc-900">
                        <pre className="p-6 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                            {logContent}
                        </pre>
                    </div>
                    <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                {lastLogUpdate ? `Last updated: ${lastLogUpdate}` : 'Loading...'}
                            </span>
                        </div>
                        <button 
                            onClick={handleCloseLog}
                            className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-200 rounded transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ModelRunPanel;
