import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from './components/Header';
import Sidebar from '././components/Sidebar';
import InstancesPanel from './components/InstancesPanel';
import MainContentArea from './components/center/MainContentArea';
import AiPanel from './components/AiPanel';
import RTerminal from './components/RTerminal';
import ExportModal from './components/ExportModal';
import WorkflowView from './components/WorkflowView';
import MissingDatasetModal from './components/MissingDatasetModal';
import eventBus from './utils/eventBus';
import webrService from './services/webrService';
import { s3Service } from './services/s3Service';
import { ChartType, AppState, ChartInstance, DataRecord, PlotConfig, ViewMode, Workflow, WorkflowItem } from './types';
import { UI_ICONS } from './constants';
import { DEFAULT_APP_STATE } from './data/initialData';
import { DatasetConfig, SAMPLE_NONMEM_DATA, INITIAL_DATASETS, parseCsv } from './data/datasets';
import { R_SAMPLES } from './data/rSamples';
import { APP_CONFIG, currentProject } from './data/config';
import { db, migrateFromLocalStorage, type AppSettings } from './services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import LoadingScreen from './components/LoadingScreen';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Booting up...');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const instances = useLiveQuery<ChartInstance[]>(() => db.instances.toArray(), []);
  const workflows = useLiveQuery<Workflow[]>(() => db.workflows.toArray(), []);
  const datasets = useLiveQuery<DatasetConfig[]>(() => db.datasets.toArray(), []);
  const appSettings = useLiveQuery<AppSettings>(() => db.appSettings.get(0) as Promise<AppSettings>, []);

  const [localSettings, setLocalSettings] = useState({
    isAddMenuOpen: false,
    isTerminalOpen: false,
    activePlotUrl: null as string | null,
  });
  
  const [panelWidth, setPanelWidth] = useState(() => 
    Math.max(APP_CONFIG.layout.minPanelWidth, window.innerWidth * APP_CONFIG.layout.defaultPanelWidthPercent)
  );
  const [aiPanelWidth] = useState(APP_CONFIG.layout.aiPanelWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<string | null>(null);
  
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);
  const [executingWorkflowId, setExecutingWorkflowId] = useState<string | null>(null);

  const activeInstanceIdRef = useRef<string | null | undefined>(null);
  useEffect(() => {
    activeInstanceIdRef.current = appSettings?.activeInstanceId;
  }, [appSettings?.activeInstanceId]);
  
  const initializeApp = async (forceMock: boolean = false) => {
    const steps = [
      'Migrating Storage',
      'Initializing R Engine',
      'Loading Datasets',
      'Mounting Filesystem'
    ];

    setLoadingMessage('Preparing workspace storage...');
    await migrateFromLocalStorage();
    
    // Seed default settings if empty
    const settingsCount = await db.appSettings.count();
    if (settingsCount === 0) {
      await db.appSettings.put({
        id: 0,
        selectedDatasetId: INITIAL_DATASETS[0].id,
        activeCategory: null,
        activeInstanceId: null,
        viewMode: 'plot',
        isInstancesPanelOpen: false,
        isTerminalOpen: false,
      });
    }

    setCompletedSteps(prev => [...prev, steps[0]]);
    
    setLoadingMessage('Initializing WebR statistical engine...');
    await webrService.init();
    setCompletedSteps(prev => [...prev, steps[1]]);

    setLoadingMessage('Hydrating application state...');

    /**
     * CLOUD DATA INTEGRATION BLOCK
     * This logic attempts to pull data from the PHP backend and S3.
     */
    if (APP_CONFIG.enableCloudSync && !forceMock) {
      setLoadingMessage(`Verifying Project UID: ${currentProject.id}...`);
      try {
        // 1. Get Project Files from PHP Database using the project_id (matching project uid in your request)
        const cloudFiles = await s3Service.getProjectFiles(currentProject.id);
        
        if (cloudFiles && cloudFiles.length > 0) {
          const mainDatasetFile = cloudFiles[0]; // Assuming first file for simplicity
          setLoadingMessage(`Authorized: Retrieving '${mainDatasetFile.file_name}' from S3...`);
          
          // 2. Obtain Presigned GET URL
          const getUrl = await s3Service.getPresignedGetUrl(mainDatasetFile.file_path);
          
          // 3. Fetch CSV Content directly from S3
          const csvContent = await s3Service.downloadCsvContent(getUrl);
          const parsedData = parseCsv(csvContent);

          const cloudDs: DatasetConfig = {
            id: `cloud-${mainDatasetFile.uid}`,
            name: mainDatasetFile.file_name,
            description: `Remote Dataset Synchronized from S3`,
            rowCount: parsedData.length,
            columns: parsedData.length > 0 ? Object.keys(parsedData[0]) : [],
            data: parsedData,
            createdAt: new Date().toISOString(),
            parentDatasetId: null
          };

          // Update local DB with cloud data
          await db.datasets.put(cloudDs);
          await db.appSettings.update(0, { selectedDatasetId: cloudDs.id });
          
          setLoadingMessage(`Sync Complete. Mounting '${cloudDs.name}'...`);
          await webrService.mountDataset(cloudDs.name, cloudDs.data);
          setCompletedSteps(prev => [...prev, steps[2], steps[3]]);
          
          setIsInitialized(true);
          return; // Exit init success
        } else {
          // No files found in database for this project
          setShowWarningModal(true);
          return;
        }
      } catch (error) {
        console.error("Cloud synchronization failed:", error);
        setShowWarningModal(true);
        return;
      }
    }

    // FALLBACK TO LOCAL MOCK DATA
    const datasetsCount = await db.datasets.count();
    if (datasetsCount === 0) {
      await db.datasets.bulkAdd(INITIAL_DATASETS);
    }
    
    setCompletedSteps(prev => [...prev, steps[2]]);
    
    const currentDatasets = await db.datasets.toArray();
    const currentSettings = await db.appSettings.get(0);
    
    if (currentDatasets.length > 0) {
      const targetDataset = currentDatasets.find(d => d.id === currentSettings?.selectedDatasetId) || currentDatasets[0];
      setLoadingMessage(`Mounting '${targetDataset.name}' (Local)...`);
      await webrService.mountDataset(targetDataset.name, targetDataset.data);
      setCompletedSteps(prev => [...prev, steps[3]]);
    } else {
      setCompletedSteps(prev => [...prev, steps[3]]);
    }
    
    setLoadingMessage('Finalizing workspace...');
    setTimeout(() => {
      setIsInitialized(true);
    }, 500);
  };

  useEffect(() => {
    initializeApp();
  }, []);
  
  const updateSetting = useCallback((key: string, value: any) => {
    db.appSettings.update(0, { [key]: value });
  }, []);

  const handleSidebarCategoryClick = useCallback((type: ChartType) => {
    if (!appSettings) return;
    
    // Toggle Logic: If it's already active and panel is open, close it.
    // Otherwise, select the category and open the panel.
    const isSameCategory = appSettings.activeCategory === type;
    const isPanelOpen = appSettings.isInstancesPanelOpen;

    if (isSameCategory && isPanelOpen) {
      updateSetting('isInstancesPanelOpen', false);
    } else {
      updateSetting('activeCategory', type);
      updateSetting('isInstancesPanelOpen', true);
    }
  }, [appSettings, updateSetting]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX - APP_CONFIG.layout.sidebarWidth; 
      if (newWidth >= APP_CONFIG.layout.minPanelWidth && newWidth <= APP_CONFIG.layout.maxPanelWidth) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const selectedDataset = useMemo(() => {
    if (!datasets || !appSettings) return INITIAL_DATASETS[0];
    return datasets.find(ds => ds.id === appSettings.selectedDatasetId) || datasets[0];
  }, [datasets, appSettings]);

  const activeInstance = useMemo(() => {
    if (!instances || !appSettings) return null;
    return instances.find(i => i.id === appSettings.activeInstanceId) || null;
  }, [instances, appSettings]);

  const getDerivationRCode = useCallback((ds: DatasetConfig, config: PlotConfig): string => {
    let codeParts: string[] = [];
    let currentDs = ds;
    let steps: DatasetConfig[] = [];

    while (currentDs) {
      steps.unshift(currentDs);
      if (!currentDs.parentDatasetId) break;
      const parent = datasets?.find(d => d.id === currentDs.parentDatasetId);
      if (!parent) break;
      currentDs = parent;
    }

    steps.forEach((step, idx) => {
      const varName = `data.${idx}`;
      if (idx === 0) {
        const fsPath = step.name.startsWith('/') ? step.name : `/${step.name}`;
        codeParts.push(`${varName} <- read.csv("${fsPath}")`);
      } else {
        const prevVar = `data.${idx - 1}`;
        let dplyrPipeline = `${varName} <- ${prevVar} %>% \n`;
        
        step.pipeline?.forEach((op, opIdx) => {
          const p = op.params;
          let opCode = "";
          switch (op.type) {
            case 'Filtering':
              const rCond = p.cond === 'greater than' ? '>' : p.cond === 'less than' ? '<' : '==';
              opCode = `  filter(${p.col} ${rCond} ${p.val})`;
              break;
            case 'Subsetting':
              opCode = `  select(${p.cols.join(', ')}) %>% \n  slice(${p.start + 1}:${p.end})`;
              break;
            case 'Mutation':
              const rFormula = p.formula.replace(/IF\(/g, 'ifelse(').replace(/;/g, ',\n    ');
              opCode = `  mutate(\n    ${rFormula}\n  )`;
              break;
            case 'Aggregation':
              const summary = p.valueCols.map((c: string) => `${c}_${p.method} = ${p.method}(${c}, na.rm = TRUE)`).join(', ');
              opCode = `  group_by(${p.groupBy}) %>% \n  summarise(${summary})`;
              break;
            case 'Transformation':
              const transExpr = p.cols.map((c: string) => {
                let func = "";
                switch(p.type) {
                  case 'log10': func = `log10(${c})`; break;
                  case 'log2': func = `log2(${c})`; break;
                  case 'exp': func = `exp(${c})`; break;
                  case 'sqrt': func = `sqrt(${c})`; break;
                  case 'inverse': func = `1/(${c})`; break;
                  case 'abs': func = `abs(${c})`; break;
                  case 'pow': func = `(${c})^(${p.exponent || 2})`; break;
                  case 'sin': func = `sin(${c})`; break;
                  case 'cos': func = `cos(${c})`; break;
                  case 'tan': func = `tan(${c})`; break;
                  case 'normalize': func = `scale(${c})`; break;
                  default: func = `scale(${c})`;
                }
                return `${c}_${p.type} = ${func}`;
              }).join(',\n    ');
              opCode = `  mutate(\n    ${transExpr}\n  )`;
              break;
            case 'Sampling':
              opCode = p.mode === 'percent' ? `  sample_frac(${p.value / 100})` : `  sample_n(${p.value})`;
              break;
          }
          dplyrPipeline += opCode + (opIdx < (step.pipeline?.length || 0) - 1 ? " %>% \n" : "");
        });
        codeParts.push(dplyrPipeline);
      }
    });

    let plotDataAssignment = `plot_data <- data.${steps.length - 1}`;
    if (config.customRMutation && config.customRMutation.trim()) {
      plotDataAssignment += ` %>% \n  mutate(\n    ${config.customRMutation.trim()}\n  )`;
    }
    codeParts.push(plotDataAssignment);
    
    return `\n# --- Data Preparation and Plot Block ---\nlibrary(dplyr)\n\n${codeParts.join('\n\n')}\n\n`;
  }, [datasets]);

  const generateRCodeWithConfig = useCallback((type: ChartType, config: PlotConfig, ds: DatasetConfig) => {
    let baseCode = R_SAMPLES[type] || `# Default R Script\nggplot(plot_data, aes(x=TIME, y=DV)) + geom_point()`;
    
    const headerMatch = baseCode.match(/^# =+[\s\S]*?# =+\n/);
    const scriptHeader = headerMatch ? headerMatch[0] : "";
    let scriptBody = headerMatch ? baseCode.slice(headerMatch[0].length) : baseCode;

    const prepCode = getDerivationRCode(ds, config);
    
    if (type === ChartType.SCATTER) {
       if (!config.scatterShowLine) {
          scriptBody = scriptBody.replace(/geom_smooth\(.*?\)\s*\+\s*/, '');
       }
    }
    if (type === ChartType.PAIRS) {
       if (config.pairsVariables && config.pairsVariables.length > 0) {
          const varList = config.pairsVariables.map(v => `"${v}"`).join(', ');
          scriptBody = scriptBody.replace(/cov_cols\s*<-\s*num_cols\[.*\]/, `cov_cols <- plot_data[, c(${varList})]`);
       }
    }
    if (type === ChartType.BOXPLOT) {
       scriptBody = scriptBody.replace(/geom_boxplot\((.*?)\)/, (match, p1) => {
         const hasParams = p1 && p1.trim().length > 0;
         return `geom_boxplot(${p1}${hasParams ? ', ' : ''}notch = ${config.boxplotNotch ? 'TRUE' : 'FALSE'})`;
       });
       if (config.boxplotOverlayPoints) {
          scriptBody += ` +\n  geom_jitter(width = 0.2, alpha = 0.4, size = ${config.pointSize * 0.5})`;
       }
    }
    if (type === ChartType.LINE) {
       if (!config.lineShowPoints) {
          scriptBody = scriptBody.replace(/geom_point\(.*?\)\s*\+\s*/, '');
       }
    }
    if (type === ChartType.HISTOGRAM) {
      scriptBody = scriptBody.replace(/bins\s*=\s*\d+/, `bins = ${config.histogramBins}`);
      scriptBody = scriptBody.replace(/fill\s*=\s*".*?"/, `fill = "${config.histogramFill}"`);
      scriptBody = scriptBody.replace(/color\s*=\s*".*?"/, `color = "${config.histogramOutline}"`);
      if (!config.histogramShowDensity) {
        scriptBody = scriptBody.replace(/geom_density\(.*?\)\s*\+\s*/, '');
      }
      if (!config.histogramShowMeanLine) {
        scriptBody = scriptBody.replace(/geom_vline\(.*?\)\s*\+\s*/, '');
      }
    }

    const replaceStandaloneLabel = (body: string, func: string, value: string) => {
      const regex = new RegExp(`\\b${func}\\(".*?"\\)`, 'g');
      if (regex.test(body)) {
        return body.replace(regex, `${func}("${value}")`);
      } else {
        if (body.includes('theme_')) {
          return body.replace(/(theme_[a-z]+\(\))/, `${func}("${value}") +\n  $1`);
        }
        return body + ` +\n  ${func}("${value}")`;
      }
    };

    const replaceLabsValue = (body: string, key: string, value: string) => {
      const labsRegex = /labs\(([\s\S]*?)\)/;
      if (!labsRegex.test(body)) return body;
      return body.replace(labsRegex, (match, content) => {
        const itemRegex = new RegExp(`(\\b${key}\\s*=\\s*")([^"]*)(")`, 'g');
        if (itemRegex.test(content)) {
          return `labs(${content.replace(itemRegex, `$1${value}$3`)})`;
        } else {
          const trimmed = content.trim();
          const comma = (trimmed && !trimmed.endsWith(',')) ? ', ' : '';
          return `labs(${trimmed}${comma}${key} = "${value}")`;
        }
      });
    };

    let finalBody = scriptBody;
    
    finalBody = replaceStandaloneLabel(finalBody, 'xlab', config.xLabel);
    finalBody = replaceStandaloneLabel(finalBody, 'ylab', config.yLabel);
    finalBody = replaceLabsValue(finalBody, 'title', config.title);
    finalBody = replaceLabsValue(finalBody, 'color', config.colorLabel);
    finalBody = replaceLabsValue(finalBody, 'fill', config.colorLabel);
    
    if (type === ChartType.HISTOGRAM) {
      finalBody = finalBody.replace(/\bDV\b/g, config.xAxis);
    } else {
      finalBody = finalBody.replace(/x\s*=\s*[a-zA-Z0-9._]+(?=[,\s\)])/, `x = ${config.xAxis}`);
      finalBody = finalBody.replace(/y\s*=\s*[a-zA-Z0-9._]+(?=[,\s\)])/, `y = ${config.yAxis}`);
    }
    
    if (config.colorBy !== 'none') {
      if (finalBody.includes('color = ')) {
        finalBody = finalBody.replace(/color\s*=\s*[a-zA-Z0-9._]+(?=[,\s\)])/, `color = ${config.colorBy}`);
      } else if (finalBody.includes('fill = ')) {
        finalBody = finalBody.replace(/fill\s*=\s*[a-zA-Z0-9._]+(?=[,\s\)])/, `fill = ${config.colorBy}`);
      }
    }

    const replaceParam = (body: string, param: string, value: number) => {
      const paramRegex = new RegExp(`(?<=(geom_point|geom_line|geom_histogram|geom_density|geom_boxplot|geom_bar)\\(.*?)${param}\\s*=\\s*[0-9.]+`, 'g');
      return body.replace(paramRegex, `${param} = ${value}`);
    };

    finalBody = replaceParam(finalBody, 'size', config.pointSize);
    finalBody = replaceParam(finalBody, 'alpha', config.alpha);
    finalBody = finalBody.replace(/theme_[a-z]+\(\)/, `theme_${config.theme}()`);
    finalBody = finalBody.replace(/legend\.position\s*=\s*".*?"/, `legend.position = "${config.legendPosition}"`);
    
    finalBody = finalBody.replace(/axis\.title\.x\s*=\s*element_text\(size\s*=\s*\d+\)/, `axis.title.x = element_text(size = ${config.axisTitleSize})`);
    finalBody = finalBody.replace(/axis\.title\.y\s*=\s*element_text\(size\s*=\s*\d+\)/, `axis.title.y = element_text(size = ${config.axisTitleSize})`);
    finalBody = replaceParam(finalBody, 'alpha', config.alpha);
    finalBody = finalBody.replace(/theme_[a-z]+\(\)/, `theme_${config.theme}()`);
    finalBody = finalBody.replace(/legend\.position\s*=\s*".*?"/, `legend.position = "${config.legendPosition}"`);
    
    finalBody = finalBody.replace(/axis\.title\.x\s*=\s*element_text\(size\s*=\s*\d+\)/, `axis.title.x = element_text(size = ${config.axisTitleSize})`);
    finalBody = finalBody.replace(/axis\.title\.y\s*=\s*element_text\(size\s*=\s*\d+\)/, `axis.title.y = element_text(size = ${config.axisTitleSize})`);
    finalBody = finalBody.replace(/axis\.text\.x\s*=\s*element_text\(size\s*=\s*\d+\)/, `axis.text.x = element_text(size = ${config.axisTextSize})`);
    finalBody = finalBody.replace(/axis\.text\.y\s*=\s*element_text\(size\s*=\s*\d+\)/, `axis.text.y = element_text(size = ${config.axisTextSize})`);

    finalBody = finalBody.replace(/\s*\+\s*facet_(wrap|grid)\(.*?\)/g, '');
    if (config.facetMode === 'wrap' && config.facetWrapVar !== 'none') {
      finalBody += ` +\n  facet_wrap(~${config.facetWrapVar})`;
    } else if (config.facetMode === 'grid') {
      const row = config.facetGridRow === 'none' ? '.' : config.facetGridRow;
      const col = config.facetGridCol === 'none' ? '.' : config.facetGridCol;
      if (row !== '.' || col !== '.') {
        finalBody += ` +\n  facet_grid(${row} ~ ${col})`;
      }
    }

    finalBody = finalBody.replace(/\s*\+\s*scale_(color|fill)_(brewer|viridis_d|viridis_c|viridis_b)\(.*?\)/g, '');
    const hasColorMapping = finalBody.includes('color = ');
    const hasFillMapping = finalBody.includes('fill = ');
    if (hasColorMapping || hasFillMapping) {
        const isViridis = ['viridis', 'magma', 'plasma', 'inferno', 'cividis', 'rocket', 'mako', 'turbo'].includes(config.colorPalette);
        const scaleType = hasFillMapping ? 'fill' : 'color';
        if (isViridis) {
            finalBody += ` +\n  scale_${scaleType}_viridis_d(option = "${config.colorPalette}")`;
        } else {
            finalBody += ` +\n  scale_${scaleType}_brewer(palette = "${config.colorPalette}")`;
        }
    }

    const saveBlock = `\n\n# --- Export Block (Uncomment to save) ---\n# ggsave("${config.title.replace(/\s+/g, '_').toLowerCase()}.png", width = 8, height = 6, dpi = 300)`;
    const sessionBlock = '\n\n## --- Session Print Block ---\n\nsessionInfo()';
    return scriptHeader + prepCode + finalBody + saveBlock + sessionBlock;
  }, [getDerivationRCode]);

  const handleRunRCode = useCallback((code: string) => {
    setLocalSettings(prev => ({ ...prev, activePlotUrl: null }));
    eventBus.dispatch('run-r-code', { code, source: 'editor' });
  }, []);

  useEffect(() => {
    if (instances && instances.length > 0 && selectedDataset) {
      instances.forEach(inst => {
        const newCode = generateRCodeWithConfig(inst.type, inst.config, selectedDataset);
        db.instances.update(inst.id, { code: newCode });
      });
    }
  }, [appSettings?.selectedDatasetId, generateRCodeWithConfig, instances, selectedDataset]);

  useEffect(() => {
    const handlePlot = (data: { dataUrl: string }) => {
      const currentActiveId = activeInstanceIdRef.current;
      setLocalSettings(prev => ({ ...prev, activePlotUrl: data.dataUrl }));
      if (currentActiveId) {
        db.instances.update(currentActiveId, { lastPlotUrl: data.dataUrl });
      }
    };
    
    const handleTable = (data: { name: string; columns: string[]; data: any[] }) => {
      const currentActiveId = activeInstanceIdRef.current;
      if (currentActiveId) {
        db.instances.update(currentActiveId, { lastTableData: data, lastHtmlOutput: undefined });
      }
    };

    const handleHtml = (data: { html: string }) => {
      const currentActiveId = activeInstanceIdRef.current;
      if (currentActiveId) {
        db.instances.update(currentActiveId, { lastHtmlOutput: data.html, lastTableData: undefined });
      }
    };

    eventBus.on('r-plot-created', handlePlot);
    eventBus.on('r-table-created', handleTable);
    eventBus.on('r-html-created', handleHtml);
    
    return () => {
      eventBus.remove('r-plot-created', handlePlot);
      eventBus.remove('r-table-created', handleTable);
      eventBus.remove('r-html-created', handleHtml);
    };
  }, []);

  // Consolidate initial run logic: Wait for isInitialized, engine ready, and activeInstance availability.
  useEffect(() => {
    if (isInitialized && activeInstance && activeInstance.code && webrService.isReady()) {
      handleRunRCode(activeInstance.code);
    }
  }, [isInitialized, appSettings?.activeInstanceId, handleRunRCode]);

  const handleAddChart = useCallback(async (type: ChartType, customName?: string) => {
    if (!instances || !selectedDataset) return;
    const typeCount = instances.filter(i => i.type === type).length;
    let specificDefaults: Partial<PlotConfig> = {};
    if (type === ChartType.PAIRS) specificDefaults.pairsVariables = ['DV', 'TIME', 'AGE', 'WT'];
    if (type === ChartType.LINE) specificDefaults.yAxis = 'MEAN_DV';
    
    const finalName = customName || `${type} Analysis ${typeCount + 1}`;
    const defaultConfig: PlotConfig = {
      ...APP_CONFIG.defaults.plot,
      ...specificDefaults,
      title: finalName,
      yAxis: specificDefaults.yAxis || (type === ChartType.PIE ? 'GROUP' : APP_CONFIG.defaults.plot.yAxis),
    };
    
    const initialCode = generateRCodeWithConfig(type, defaultConfig, selectedDataset);
    const newInstance: ChartInstance = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: finalName,
      createdAt: Date.now(),
      code: initialCode,
      config: defaultConfig
    };

    await db.instances.add(newInstance);
    const isTableType = [ChartType.SUMMARY_TABLE, ChartType.FREQ_TABLE, ChartType.LISTING_TABLE, ChartType.PK_PARAM_TABLE].includes(type);
    
    db.appSettings.update(0, {
      activeInstanceId: newInstance.id,
      activeCategory: type,
      isInstancesPanelOpen: true,
      viewMode: isTableType ? 'result' : 'plot'
    });
    setLocalSettings(prev => ({...prev, isAddMenuOpen: false }));
  }, [instances, selectedDataset, generateRCodeWithConfig]);

  const handleUpdateInstanceConfig = async (id: string, updates: Partial<PlotConfig>) => {
    const inst = await db.instances.get(id);
    if (!inst || !selectedDataset) return;
    const newConfig = { ...inst.config, ...updates };
    const newCode = generateRCodeWithConfig(inst.type, newConfig, selectedDataset);
    await db.instances.update(id, { config: newConfig, code: newCode });
    handleRunRCode(newCode);
  };

  const handleRunWorkflow = useCallback(async (workflowId: string) => {
    if (!workflows) return;
    const wf = workflows.find(w => w.id === workflowId);
    if (!wf || isExecutingWorkflow) return;
    setIsExecutingWorkflow(true);
    setExecutingWorkflowId(workflowId);
    for (const item of wf.items) {
        await handleAddChart(item.type, item.name);
        await new Promise(resolve => setTimeout(resolve, 800));
    }
    setIsExecutingWorkflow(false);
    setExecutingWorkflowId(null);
    setIsWorkflowModalOpen(false);
  }, [workflows, isExecutingWorkflow, handleAddChart]);

  const addedCategories = useMemo<ChartType[]>(() => 
    Array.from(new Set((instances || []).map(i => i.type))), 
    [instances]
  );

  if (!isInitialized || !appSettings) {
    return (
      <>
        <LoadingScreen message={loadingMessage} completedSteps={completedSteps} />
        {showWarningModal && (
          <MissingDatasetModal 
            projectId={currentProject.id} 
            onContinue={() => {
              setShowWarningModal(false);
              initializeApp(true); // Continue forcing mock data
            }}
            onRetry={() => {
              setShowWarningModal(false);
              initializeApp(); // Attempt re-init
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden rounded-none">
      <div className={`${isSidebarVisible ? 'flex' : 'hidden'} md:flex h-full z-50`}>
        <Sidebar 
          activeCategory={appSettings.activeCategory} 
          addedCategories={addedCategories}
          onSelectCategory={handleSidebarCategoryClick}
          isAddMenuOpen={localSettings.isAddMenuOpen}
          setIsAddMenuOpen={(open) => setLocalSettings(p => ({ ...p, isAddMenuOpen: open }))}
          onAddChart={handleAddChart}
          isTerminalOpen={appSettings.isTerminalOpen}
          onToggleTerminal={() => updateSetting('isTerminalOpen', !appSettings.isTerminalOpen)}
          onOpenWorkflows={() => setIsWorkflowModalOpen(true)}
          activeViewMode={appSettings.viewMode}
          isWorkflowsOpen={isWorkflowModalOpen}
        />
      </div>

      {appSettings.isInstancesPanelOpen && appSettings.activeCategory && (
        <InstancesPanel 
          category={appSettings.activeCategory}
          instances={instances || []}
          activeInstanceId={appSettings.activeInstanceId}
          onSelectInstance={(id) => updateSetting('activeInstanceId', id)}
          onRemoveInstance={(id) => setInstanceToDelete(id)}
          onRenameInstance={(id, name) => db.instances.update(id, { name })}
          onDuplicateInstance={async (id) => {
            const original = await db.instances.get(id);
            if (!original) return;
            const newInst = { ...original, id: Math.random().toString(36).substr(2, 9), name: `${original.name} (Copy)`, createdAt: Date.now() };
            await db.instances.add(newInst);
            updateSetting('activeInstanceId', newInst.id);
          }}
          onUpdateConfig={handleUpdateInstanceConfig}
          onClose={() => updateSetting('isInstancesPanelOpen', false)}
          width={panelWidth}
          onMouseDownResize={() => setIsResizing(true)}
          datasetColumns={selectedDataset.columns}
        />
      )}

      <div 
        className={`h-full border-r border-gray-200 shadow-xl overflow-hidden ${appSettings.isTerminalOpen ? 'flex' : 'hidden'}`} 
        style={{ width: `${panelWidth}px` }}
      >
        <RTerminal />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          selectedDataset={selectedDataset}
          datasets={datasets || []}
          onSelectDataset={(id) => updateSetting('selectedDatasetId', id)}
          onViewDataset={(id) => {
            updateSetting('selectedDatasetId', id);
            updateSetting('viewMode', 'table');
            updateSetting('activeInstanceId', null);
          }}
          onDeleteDataset={(id) => {
            if (id === 'ds-001') return;
            db.datasets.delete(id);
            if (appSettings.selectedDatasetId === id) {
              updateSetting('selectedDatasetId', (datasets || [])[0].id);
            }
          }}
          onRenameDataset={(id, newName) => {
            if (id === 'ds-001') return;
            const finalName = newName.endsWith('.csv') ? newName : `${newName}.csv`;
            db.datasets.update(id, { name: finalName });
          }}
          onCreateDataset={async (name, pipeline, config) => {
            const webR = webrService.getWebR();
            if (!webR || !selectedDataset) return;

            const parentDataset = selectedDataset;
            let codeParts: string[] = [];
            const fsPath = parentDataset.name.startsWith('/') ? parentDataset.name : `/${parentDataset.name}`;
            codeParts.push(`data.0 <- read.csv("${fsPath}")`);

            let dplyrPipeline = `data.1 <- data.0 %>% \n`;
            
            pipeline.forEach((op, opIdx) => {
              const p = config[op.id];
              let opCode = "";
              switch (op.type) {
                case 'Filtering':
                  const rCond = p.cond === 'greater than' ? '>' : p.cond === 'less than' ? '<' : '==';
                  opCode = `  filter(${p.col} ${rCond} ${p.val})`;
                  break;
                case 'Subsetting':
                  opCode = `  select(${p.cols.join(', ')}) %>% \n  slice(${p.start + 1}:${p.end})`;
                  break;
                case 'Mutation':
                  const rFormula = p.formula.replace(/IF\(/g, 'ifelse(').replace(/;/g, ',\n    ');
                  opCode = `  mutate(\n    ${rFormula}\n  )`;
                  break;
                case 'Aggregation':
                  const summary = p.valueCols.map((c: string) => `${c}_${p.method} = ${p.method}(${c}, na.rm = TRUE)`).join(', ');
                  opCode = `  group_by(${p.groupBy}) %>% \n  summarise(${summary})`;
                  break;
                case 'Transformation':
                  const transExpr = p.cols.map((c: string) => {
                    let func = "";
                    switch(p.type) {
                      case 'log10': func = `log10(${c})`; break;
                      case 'log2': func = `log2(${c})`; break;
                      case 'exp': func = `exp(${c})`; break;
                      case 'sqrt': func = `sqrt(${c})`; break;
                      case 'inverse': func = `1/(${c})`; break;
                      case 'abs': func = `abs(${c})`; break;
                      case 'pow': func = `(${c})^(${p.exponent || 2})`; break;
                      case 'sin': func = `sin(${c})`; break;
                      case 'cos': func = `cos(${c})`; break;
                      case 'tan': func = `tan(${c})`; break;
                      case 'normalize': func = `scale(${c})`; break;
                      default: func = `scale(${c})`;
                    }
                    return `${c}_${p.type} = ${func}`;
                  }).join(',\n    ');
                  opCode = `  mutate(\n    ${transExpr}\n  )`;
                  break;
                case 'Sampling':
                  opCode = p.mode === 'percent' ? `  sample_frac(${p.value / 100})` : `  sample_n(${p.value})`;
                  break;
              }
              dplyrPipeline += opCode + (opIdx < pipeline.length - 1 ? " %>% \n" : "");
            });
            codeParts.push(dplyrPipeline);

            const finalCode = `library(dplyr)\nlibrary(jsonlite)\n\n${codeParts.join('\n\n')}\n\njsonlite::toJSON(data.1)`;
            
            try {
              const result = await webR.evalR(finalCode);
              const jsonData = await result.toString();
              const newData: DataRecord[] = JSON.parse(jsonData);
              
              const newDs: DatasetConfig = {
                id: `ds-${Date.now()}`,
                name,
                description: `Derived from ${parentDataset.name} on ${new Date().toLocaleDateString()}`,
                rowCount: newData.length,
                columns: newData.length > 0 ? Object.keys(newData[0]) : [],
                data: newData,
                createdAt: new Date().toISOString(),
                parentDatasetId: parentDataset.id,
                pipeline: pipeline.map(op => ({ ...op, params: config[op.id] })),
              };

              await db.datasets.add(newDs);
              updateSetting('selectedDatasetId', newDs.id);
              updateSetting('viewMode', 'table');
              updateSetting('activeInstanceId', null);
            } catch (e) {
              console.error("Failed to create derived dataset:", e);
              eventBus.dispatch('show-error', { message: 'Failed to execute R pipeline for new dataset.' });
            }
          }}
          onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
          onExportClick={() => setIsExportModalOpen(true)}
        />
        
        <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-row rounded-none gap-4">
          <MainContentArea
            viewMode={appSettings.viewMode}
            activeInstance={activeInstance}
            selectedDataset={selectedDataset}
            activePlotUrl={localSettings.activePlotUrl}
            onRunRCode={handleRunRCode}
            onSetViewMode={(mode) => updateSetting('viewMode', mode)}
            isAiPanelOpen={isAiPanelOpen}
            onToggleAiPanel={() => setIsAiPanelOpen(!isAiPanelOpen)}
          />
          {isAiPanelOpen && activeInstance && appSettings.viewMode === 'code' && <AiPanel currentCode={activeInstance.code || ''} onClose={() => setIsAiPanelOpen(false)} width={aiPanelWidth} />}
        </main>
      </div>

      {isWorkflowModalOpen && (
        <WorkflowView 
          workflows={workflows || []} 
          onClose={() => setIsWorkflowModalOpen(false)}
          onCreateWorkflow={(name, items) => {
            const newWf: Workflow = { id: Math.random().toString(36).substr(2, 9), name, items, createdAt: Date.now() };
            db.workflows.add(newWf);
          }}
          onDeleteWorkflow={(id) => db.workflows.delete(id)}
          onRunWorkflow={handleRunWorkflow}
          isExecuting={isExecutingWorkflow}
          executingWorkflowId={executingWorkflowId}
        />
      )}

      {instanceToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-5 w-full max-w-[300px] border-t-4 border-red-600 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 mb-1 uppercase tracking-tighter">Purge Confirmation</h3>
            <p className="text-[11px] text-gray-600 mb-5 leading-relaxed">Remove this analysis collection from the workspace?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setInstanceToDelete(null)} className="px-3 py-1.5 text-[9px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
              <button onClick={() => {
                db.instances.delete(instanceToDelete);
                if (appSettings.activeInstanceId === instanceToDelete) {
                  updateSetting('activeInstanceId', null);
                }
                setInstanceToDelete(null);
              }} className="px-4 py-1.5 text-[9px] font-black uppercase text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all">Purge</button>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && <ExportModal instances={instances || []} onClose={() => setIsExportModalOpen(false)} datasetName={selectedDataset.name} />}
    </div>
  );
};

export default App;