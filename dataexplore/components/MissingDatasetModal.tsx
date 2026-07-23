import React from 'react';
import { AlertTriangle, Database, ArrowRight, RefreshCw, X } from 'lucide-react';

interface MissingDatasetModalProps {
  projectId: string;
  onContinue: () => void;
  onRetry: () => void;
}

const MissingDatasetModal: React.FC<MissingDatasetModalProps> = ({ projectId, onContinue, onRetry }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1a1f24]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md shadow-2xl border-t-4 border-amber-500 rounded-none overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-50 text-amber-600">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                Cloud Sync Error
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Project ID: {projectId}</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 p-4 mb-8">
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              The analytical dataset associated with this project could not be found in the remote cloud repository or S3 bucket.
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={onRetry}
              className="w-full py-4 bg-[#1a1f24] text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group shadow-lg"
            >
              <RefreshCw size={14} className="group-hover:animate-spin" />
              Attempt Re-connection
            </button>
            
            <button 
              onClick={onContinue}
              className="w-full py-4 bg-white border border-gray-200 text-gray-500 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <Database size={14} />
              Use Mock Sample Data
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Awaiting Operator Command</span>
        </div>
      </div>
    </div>
  );
};

export default MissingDatasetModal;