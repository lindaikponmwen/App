import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ScatterChart, 
  Disc, 
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
  AreaChart,
  Grid3X3,
  TableProperties,
  ListOrdered,
  FileSpreadsheet,
  Calculator
} from 'lucide-react';
import { ChartType } from './types';

const STROKE_WIDTH = 1.5;

export const CHART_MENU_ITEMS = [
  { id: ChartType.SCATTER, label: 'Scatter', icon: <ScatterChart size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.LINE, label: 'Line', icon: <TrendingUp size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.SPAGHETTI, label: 'Spaghetti', icon: <Spline size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.COND_SCATTER, label: 'Conditional Scatter', icon: <LayoutGrid size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.HISTOGRAM, label: 'Histogram', icon: <Columns size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.DENSITY, label: 'Density', icon: <AreaChart size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.BOXPLOT, label: 'Boxplot', icon: <Box size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.PAIRS, label: 'Pairs Matrix', icon: <Grid3X3 size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.PIE, label: 'Pie', icon: <Disc size={20} strokeWidth={STROKE_WIDTH} /> },
  // Table Section
  { id: ChartType.SUMMARY_TABLE, label: 'Summary Stats', icon: <TableProperties size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.FREQ_TABLE, label: 'Frequency Table', icon: <FileSpreadsheet size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.LISTING_TABLE, label: 'Data Listing', icon: <ListOrdered size={20} strokeWidth={STROKE_WIDTH} /> },
  { id: ChartType.PK_PARAM_TABLE, label: 'PK Param Summary', icon: <Calculator size={20} strokeWidth={STROKE_WIDTH} /> },
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