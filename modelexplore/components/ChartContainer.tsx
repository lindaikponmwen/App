
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Zap, ZoomIn, ZoomOut, Maximize, Download, RefreshCw } from 'lucide-react';
import { ChartType, DataRecord } from '../types';
import { UI_ICONS } from '../constants';

interface ChartContainerProps {
  type: ChartType;
  data: DataRecord[];
  rPlotUrl?: string | null;
  onRefresh?: () => void;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ type, rPlotUrl, onRefresh }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [rPlotUrl]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(prev => Math.min(Math.max(prev + delta, 0.5), 5));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    if (!rPlotUrl) return;
    const link = document.createElement('a');
    link.href = rPlotUrl;
    link.download = `r_analysis_${type.toLowerCase()}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (rPlotUrl) {
      return (
        <div 
          className={`w-full h-full flex items-center justify-center overflow-hidden bg-white select-none ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
            }}
            className="w-full h-full flex items-center justify-center pointer-events-none"
          >
            <img 
              src={rPlotUrl} 
              alt="R Graphical Output" 
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/30">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-40 animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative z-10" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-blue-500 fill-blue-500" />
            <span className="text-[10px] font-black text-[#1a1f24] uppercase tracking-[0.3em]">
              R-Engine Executing
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Generating high-fidelity visualization for {type} analysis...
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-4 md:p-8 relative group rounded-none" ref={containerRef}>
      <div className="w-full h-full max-w-5xl bg-white overflow-hidden p-2 md:p-6 rounded-none relative">
        {renderContent()}
      </div>
      
      {rPlotUrl && (
        <>
          <div className="absolute bottom-8 right-8 flex items-center gap-1 bg-gray-50/95 backdrop-blur-md p-1.5 border border-gray-200 shadow-2xl z-20 transition-all opacity-0 group-hover:opacity-100 rounded-full">
            <button 
              onClick={handleZoomOut} 
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white transition-colors rounded-full" 
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <div className="px-3 py-1 text-[10px] font-black text-gray-600 tabular-nums border-x border-gray-200 min-w-[52px] text-center">
              {Math.round(scale * 100)}%
            </div>
            <button 
              onClick={handleZoomIn} 
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white transition-colors rounded-full" 
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            {scale !== 1 && (
              <button 
                onClick={handleReset} 
                className="p-2 ml-1 text-gray-700 bg-white hover:bg-blue-600 hover:text-white transition-all border border-gray-200 rounded-full shadow-sm" 
                title="Reset Zoom"
              >
                <Maximize size={16} />
              </button>
            )}
          </div>

          <div className="absolute top-6 md:top-12 right-6 md:right-12 flex flex-col items-center gap-1 md:gap-2 bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl p-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 rounded-none z-10">
            <button 
              onClick={onRefresh}
              className="p-2 md:p-2.5 hover:bg-white text-gray-400 hover:text-blue-600 transition-colors shadow-sm border border-transparent hover:border-gray-100 rounded-none"
              title="Refresh Plot"
            >
              <RefreshCw size={14} />
            </button>
            <button 
              onClick={handleDownload}
              className="p-2 md:p-2.5 hover:bg-white text-gray-400 hover:text-blue-600 transition-colors shadow-sm border border-transparent hover:border-gray-100 rounded-none"
              title="Download PNG"
            >
              <Download size={14} />
            </button>
            <button className="p-2 md:p-2.5 hover:bg-white text-gray-400 hover:text-gray-900 transition-colors shadow-sm border border-transparent hover:border-blue-100 rounded-none">
              {UI_ICONS.Edit}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChartContainer;
