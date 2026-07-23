
import React, { useState } from 'react';
import { X, Check, Download, FileJson, FileCode, ImageIcon, Loader2, Table } from 'lucide-react';
import { ChartInstance } from '../types';
import JSZip from 'jszip';

interface ExportModalProps {
  instances: ChartInstance[];
  onClose: () => void;
  datasetName: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ instances, onClose, datasetName }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(instances.map(i => i.id));
  const [isExporting, setIsExporting] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === instances.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(instances.map(i => i.id));
    }
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);

    try {
      const zip = new JSZip();
      const exportFolder = zip.folder(`export_${datasetName.replace('.csv', '')}_${Date.now()}`);
      
      const selectedInstances = instances.filter(i => selectedIds.includes(i.id));

      for (const inst of selectedInstances) {
        const instanceFolder = exportFolder?.folder(inst.name.replace(/\s+/g, '_'));
        
        // Add R Code
        if (inst.code) {
          instanceFolder?.file(`${inst.name.replace(/\s+/g, '_')}.R`, inst.code);
        }

        // Add Plot if available
        if (inst.lastPlotUrl) {
          const base64Data = inst.lastPlotUrl.split(',')[1];
          instanceFolder?.file(`${inst.name.replace(/\s+/g, '_')}.png`, base64Data, { base64: true });
        }

        // Add Table Output as Word (.doc) if available
        if (inst.lastHtmlOutput) {
          const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Export Table</title>
            <style>
              table { border-collapse: collapse; width: 100%; font-family: 'Times New Roman', Times, serif; }
              th, td { border: 1px solid black; padding: 5pt; text-align: left; }
              .Rtable1 { border-top: 2pt solid black; border-bottom: 2pt solid black; }
            </style>
            </head><body>`;
          const footer = "</body></html>";
          const docContent = header + inst.lastHtmlOutput + footer;
          instanceFolder?.file(`${inst.name.replace(/\s+/g, '_')}_table.doc`, docContent);
        }

        // Add Metadata
        const metadata = {
          name: inst.name,
          type: inst.type,
          config: inst.config,
          exportedAt: new Date().toISOString()
        };
        instanceFolder?.file('config.json', JSON.stringify(metadata, null, 2));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `data_explorer_export_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to generate export file.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl shadow-2xl border-t-4 border-blue-600 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Export Workspace</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Select analytical bundles to package</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={toggleAll}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              {selectedIds.length === instances.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {selectedIds.length} of {instances.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {instances.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No instances available to export</p>
              </div>
            ) : (
              instances.map((inst) => (
                <div 
                  key={inst.id}
                  onClick={() => toggleSelection(inst.id)}
                  className={`flex items-center gap-4 p-4 border transition-all cursor-pointer ${
                    selectedIds.includes(inst.id) 
                    ? 'border-blue-500 bg-blue-50/30' 
                    : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 flex items-center justify-center border-2 transition-colors ${
                    selectedIds.includes(inst.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 bg-white'
                  }`}>
                    {selectedIds.includes(inst.id) && <Check size={14} strokeWidth={4} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-800 truncate">{inst.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><FileCode size={10} /> R Code</span>
                      {inst.lastPlotUrl && <span className="flex items-center gap-1 text-green-600"><ImageIcon size={10} /> Graphics Ready</span>}
                      {inst.lastHtmlOutput && <span className="flex items-center gap-1 text-blue-600"><Table size={10} /> Table Ready</span>}
                      <span className="flex items-center gap-1"><FileJson size={10} /> Metadata</span>
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-1">
                    {inst.type}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 border border-gray-200 hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedIds.length === 0 || isExporting}
            className="flex-[2] py-3 bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 disabled:opacity-30 transition-colors flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Packaging Workspace...
              </>
            ) : (
              <>
                <Download size={16} />
                Generate ZIP Bundle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
