
import React from 'react';
import PlotView from './PlotView';
import CodeView from './CodeView';
import TableView from './TableView';
import ResultTableView from './ResultTableView';
import IdleView from './IdleView';
import { ChartInstance, DatasetConfig, ViewMode, ChartType } from '../../types';
import { Sparkles } from 'lucide-react';

interface MainContentAreaProps {
  viewMode: ViewMode;
  activeInstance: ChartInstance | null;
  selectedDataset: DatasetConfig;
  activePlotUrl: string | null;
  onRunRCode: (code: string) => void;
  onSetViewMode: (mode: ViewMode) => void;
  isAiPanelOpen: boolean;
  onToggleAiPanel: () => void;
}

const MainContentArea: React.FC<MainContentAreaProps> = ({
  viewMode,
  activeInstance,
  selectedDataset,
  activePlotUrl,
  onRunRCode,
  onSetViewMode,
  isAiPanelOpen,
  onToggleAiPanel
}) => {
  const isTableAnalysis = activeInstance && [
    ChartType.SUMMARY_TABLE, 
    ChartType.FREQ_TABLE, 
    ChartType.LISTING_TABLE, 
    ChartType.PK_PARAM_TABLE
  ].includes(activeInstance.type);

  const renderContent = () => {
    if (viewMode === 'table') {
      return <TableView name={selectedDataset.name} data={selectedDataset.data} />;
    }

    if (!activeInstance) {
      return <IdleView />;
    }

    if (viewMode === 'plot') {
      if (isTableAnalysis) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/20 p-12 text-center">
            <h3 className="font-bold uppercase tracking-widest text-gray-400 mb-2">No Plot Logic</h3>
            <p className="text-xs opacity-60">This analysis type outputs structured table data. Switch to the "Table" tab to view.</p>
          </div>
        );
      }
      return (
        <PlotView
          type={activeInstance.type}
          data={selectedDataset.data}
          rPlotUrl={activePlotUrl}
          onRefresh={() => activeInstance.code && onRunRCode(activeInstance.code)}
        />
      );
    }

    if (viewMode === 'result') {
      return (
        <ResultTableView 
          tableData={activeInstance.lastTableData || null} 
          htmlOutput={activeInstance.lastHtmlOutput}
        />
      );
    }

    if (viewMode === 'code') {
      return <CodeView code={activeInstance.code || ""} />;
    }

    return <IdleView />;
  };

  const getTabLabel = (mode: ViewMode) => {
    switch (mode) {
      case 'table': return 'Data';
      case 'result': return 'Table';
      case 'plot': return 'Plot';
      case 'code': return 'Code';
      default: return mode;
    }
  };

  return (
    <div className="flex-1 bg-white border border-gray-200 shadow-xl flex flex-col overflow-hidden">
      <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4 bg-gray-50/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            {activeInstance ? `ANALYSIS: ${activeInstance.name}` : `DATA: ${selectedDataset.name}`}
          </span>
          {viewMode === 'code' && activeInstance && (
            <button
              onClick={onToggleAiPanel}
              className={`flex items-center gap-1.5 px-2 py-1 text-[9px] font-black uppercase tracking-tighter transition-all border ${
                isAiPanelOpen 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <Sparkles size={12} className={isAiPanelOpen ? 'animate-pulse' : ''} />
              AI Assistant
            </button>
          )}
        </div>
        <div className="flex items-center p-1 bg-gray-200/50">
          {(['plot', 'result', 'code', 'table'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              disabled={(mode === 'plot' || mode === 'code' || mode === 'result') && !activeInstance}
              onClick={() => onSetViewMode(mode)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${
                viewMode === mode 
                  ? 'bg-white shadow-sm text-gray-800' 
                  : 'text-gray-500 hover:text-gray-700'
              } disabled:opacity-30`}
            >
              {getTabLabel(mode)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-white">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainContentArea;
