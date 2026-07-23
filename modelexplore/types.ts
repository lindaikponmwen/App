// Re-export DatasetConfig from the datasets module to centralize type access
import { DatasetConfig } from './data/datasets';
export type { DatasetConfig };

export enum ChartType {
  // Goodness-of-Fit Plots
  DV_VS_PRED = 'Observed vs. Population Predicted',
  DV_VS_IPRED = 'Observed vs. Individual Predicted',
  
  // Residual Diagnostics
  CWRES_VS_TIME = 'CWRES vs. Time',
  CWRES_VS_PRED = 'CWRES vs. PRED',
  
  // Individual & Parameter Analysis
  INDIVIDUAL_PLOTS = 'Individual Fits',
  ETA_HISTOGRAM = 'ETA Distribution Histogram',
  ETA_PAIRS = 'ETA Pairs Matrix',
  ETA_VS_COVARIATE = 'ETA vs. Covariates',
  
  // Tables
  PARAMETER_TABLE = 'Parameter Estimates Summary',

  // General Plots (kept for flexibility)
  SCATTER = 'Generic Scatter',
  BOXPLOT = 'Generic Boxplot',
  HISTOGRAM = 'Generic Histogram',
}

export type ViewMode = 'plot' | 'code' | 'table' | 'result';

export interface DataRecord {
  ID: number;
  TIME: number;
  DV: number;
  GROUP: string;
  DOSE: number;
  AGE?: number;
  WT?: number;
  SEX?: 'Male' | 'Female';
  SEXC?: number;
  [key: string]: any;
}
export type FacetMode = 'none' | 'wrap' | 'grid';

export interface PlotConfig {
  xAxis: string;
  yAxis: string;
  title: string;
  xLabel: string;
  yLabel: string;
  colorLabel: string;
  theme: 'minimal' | 'classic' | 'light' | 'dark' | 'gray' | 'bw' | 'void';
  colorPalette: string;
  legendPosition: 'bottom' | 'top' | 'left' | 'right' | 'none';
  facetBy: string;
  facetMode: FacetMode;
  facetWrapVar: string;
  facetGridRow: string;
  facetGridCol: string;
  colorBy: string;
  pointSize: number;
  alpha: number;
  axisTitleSize: number;
  axisTextSize: number;
  // Boxplot specific
  boxplotNotch: boolean;
  boxplotOverlayPoints: boolean;
  // Scatter specific
  scatterShowLine: boolean;
  // Pairs specific
  pairsVariables: string[];
  // Line specific
  lineShowPoints: boolean;
  // Histogram specific
  histogramBins: number;
  histogramFill: string;
  histogramOutline: string;
  histogramShowDensity: boolean;
  histogramShowMeanLine: boolean;
  // Advanced R specific
  customRMutation: string;
}

export interface ChartInstance {
  id: string;
  type: ChartType;
  name: string;
  createdAt: number;
  code?: string;
  lastPlotUrl?: string;
  lastHtmlOutput?: string;
  lastTableData?: { name: string; columns: string[]; data: any[] };
  config: PlotConfig;
}

export interface WorkflowItem {
  type: ChartType;
  name: string;
}

export interface Workflow {
  id: string;
  name: string;
  items: WorkflowItem[];
  createdAt: number;
}

export interface AppState {
  selectedDatasetId: string;
  datasets: DatasetConfig[];
  activeCategory: ChartType | null;
  activeInstanceId: string | null;
  viewMode: ViewMode;
  isAddMenuOpen: boolean;
  isInstancesPanelOpen: boolean;
  isTerminalOpen: boolean;
  activePlotUrl: null | string;
  instances: ChartInstance[];
  workflows: Workflow[];
}