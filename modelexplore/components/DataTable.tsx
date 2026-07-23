
import React from 'react';
import { DataRecord } from '../types';
import { Download, ChevronUp, ChevronDown } from 'lucide-react';

interface DataTableProps {
  name: string;
  data: DataRecord[];
}

const DataTable: React.FC<DataTableProps> = ({ name, data }) => {
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc] p-4 md:p-6 overflow-hidden animate-in fade-in duration-300">
      {/* Table Header / Info Bar */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-bold text-gray-700">{name}</h2>
          <span className="text-xs text-gray-400">({data.length} rows)</span>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors rounded-none shadow-sm">
          <Download size={12} />
          Export CSV
        </button>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 bg-white border border-gray-200 shadow-sm overflow-auto rounded-none relative">
        <table className="w-full text-left border-collapse table-auto">
          <thead className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 w-12 text-center">#</th>
              {columns.map(col => (
                <th key={col} className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-r border-gray-100 group cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span>{col}</span>
                    <div className="flex flex-col opacity-30 group-hover:opacity-100 transition-opacity">
                      <ChevronUp size={8} className="-mb-0.5" />
                      <ChevronDown size={8} />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-4 py-2.5 text-[10px] font-bold text-gray-300 border-r border-gray-50 text-center bg-gray-50/30">
                  {idx + 1}
                </td>
                {columns.map(col => (
                  <td key={col} className="px-4 py-2.5 text-xs text-gray-700 border-r border-gray-50 font-medium tabular-nums">
                    {(row as any)[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer Info */}
      <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
        <div>Showing 1 to {data.length} of {data.length} records</div>
        <div className="flex items-center gap-4">
          <span>Processed via PMAI Engine v2.4</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
