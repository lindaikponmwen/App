import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ScatterChart, 
  Columns, 
  Box,
  Settings,
  Plus,
  LogOut,
  X,
  Maximize2,
  RefreshCw,
  Download,
  Edit2,
  Presentation,
  Terminal,
  Spline,
  LayoutGrid,
  Grid3X3,
  TableProperties,
  ListOrdered,
  Users,
  GitCompareArrows,
  Timer,
  Sigma,
  Baseline
} from 'lucide-react';
import { ChartType } from './types';

const STROKE_WIDTH = 1.5;

export const CHART_MENU_ITEMS = [
  // Model Diagnostics Section
  { id: 'gof', label: 'Goodness-of-Fit', isHeader: true },
  { id: ChartType.DV_VS_IPRED, label: 'Observed vs. Ind. Predicted', icon: <ScatterChart size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.DV_VS_PRED, label: 'Observed vs. Pop. Predicted', icon: <ScatterChart size={20} strokeWidth={STROKE_WIDTH} /> },

  { id: 'residuals', label: 'Residual Diagnostics', isHeader: true },
  { id: ChartType.CWRES_VS_PRED, label: 'CWRES vs. PRED', icon: <Baseline size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.CWRES_VS_TIME, label: 'CWRES vs. Time', icon: <Timer size={20} strokeWidth={STROKE_WIDTH} /> },

  { id: 'individuals', label: 'Individual Analysis', isHeader: true },
  { id: ChartType.INDIVIDUAL_PLOTS, label: 'Individual Fits', icon: <Users size={20} strokeWidth={STROKE_WIDTH} /> },
  
  { id: 'parameters', label: 'Parameter Analysis', isHeader: true },
  { id: ChartType.PARAMETER_TABLE, label: 'Parameter Summary', icon: <TableProperties size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.ETA_HISTOGRAM, label: 'ETA Distributions', icon: <BarChart3 size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.ETA_PAIRS, label: 'ETA Pairs Matrix', icon: <Grid3X3 size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.ETA_VS_COVARIATE, label: 'ETAs vs. Covariates', icon: <GitCompareArrows size={20} strokeWidth={STROKE_WIDTH} /> },

  // Generic Plots Section
  { id: 'generic', label: 'Generic Plots', isHeader: true },
  { id: ChartType.SCATTER, label: 'Generic Scatter', icon: <ScatterChart size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.BOXPLOT, label: 'Generic Boxplot', icon: <Box size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.HISTOGRAM, label: 'Generic Histogram', icon: <Columns size={20} strokeWidth={STROKE_WIDTH} /> },
];

export const UI_ICONS = {
  Settings: <Settings size={20} strokeWidth={STROKE_WIDTH} />,
  Plus: <Plus size={24} strokeWidth={STROKE_WIDTH} />,
  Export: <LogOut size={16} strokeWidth={STROKE_WIDTH} className="rotate-90" />,
  Close: <X size={20} strokeWidth={STROKE_WIDTH} />,
  Sidebar: <Maximize2 size={20} strokeWidth={STROKE_WIDTH} />,
  Refresh: <RefreshCw size={14} strokeWidth={STROKE_WIDTH} />,
  Download: <Download size={14} strokeWidth={STROKE_WIDTH} />,
  Edit: <Edit2 size={14} strokeWidth={STROKE_WIDTH} />,
  Presentation: <Presentation size={20} strokeWidth={STROKE_WIDTH} />,
  Terminal: <Terminal size={20} strokeWidth={STROKE_WIDTH} />,
};