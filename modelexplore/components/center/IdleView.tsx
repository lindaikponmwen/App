
import React from 'react';
import { Database } from 'lucide-react';

const IdleView: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6 md:p-12 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gray-100 rounded-full blur-2xl opacity-40 animate-pulse"></div>
        <Database size={48} className="text-gray-200 relative z-10" strokeWidth={1.5} />
      </div>
      <h3 className="text-gray-600 font-bold uppercase tracking-widest mb-2">Workspace Idle</h3>
      <p className="text-xs max-w-xs opacity-60">Add a chart analysis or view a dataset to start exploration.</p>
    </div>
  );
};

export default IdleView;
