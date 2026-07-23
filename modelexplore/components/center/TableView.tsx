import React, { useState, useMemo } from 'react';
import { DataRecord } from '../../types';
import { Download, ChevronUp, ChevronDown, Search, Info } from 'lucide-react';
import { arrayToCsv, downloadFile } from '../../utils/csvUtils';

interface TableViewProps {
  name: string;
  data: DataRecord[];
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

const TableView: React.FC<TableViewProps> = ({ name, data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 1. Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(lowerSearch)
      )
    );
  }, [data, searchTerm]);

  // 2. Sort the filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];

      if (aVal === bVal) return 0;
      
      const comparison = aVal > bVal ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // 3. Limit to first 100 records for display
  const displayedData = useMemo(() => sortedData.slice(0, 100), [sortedData]);

  const handleExport = () => {
    // Export the filtered and sorted data, but often users expect the full original or just filtered
    // We'll export the filtered/sorted data as it's the current "view"
    if (!sortedData || sortedData.length === 0) return;
    const csvContent = arrayToCsv(sortedData);
    const fileName = name.toLowerCase().endsWith('.csv') ? name : `${name}.csv`;
    downloadFile(csvContent, fileName);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc] p-4 md:p-6 overflow-hidden animate-in fade-in duration-300">
      {/* Table Header / Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 shrink-0">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-bold text-gray-700">{name}</h2>
          <span className="text-xs text-gray-400">({data.length} total rows)</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 text-xs text-gray-700 w-64 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all rounded-none"
            />
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-300 transition-all rounded-none shadow-sm shrink-0"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 bg-white border border-gray-200 shadow-sm overflow-auto rounded-none relative custom-scrollbar">
        <table className="w-full text-left border-collapse table-auto">
          <thead className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 w-12 text-center">#</th>
              {columns.map(col => {
                const isSorted = sortConfig?.key === col;
                return (
                  <th 
                    key={col} 
                    onClick={() => handleSort(col)}
                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r border-gray-100 group cursor-pointer transition-colors ${
                      isSorted ? 'text-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{col}</span>
                      <div className={`flex flex-col transition-opacity ${isSorted ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`}>
                        <ChevronUp 
                          size={8} 
                          className={`-mb-0.5 ${isSorted && sortConfig?.direction === 'asc' ? 'text-blue-600' : ''}`} 
                        />
                        <ChevronDown 
                          size={8} 
                          className={`${isSorted && sortConfig?.direction === 'desc' ? 'text-blue-600' : ''}`}
                        />
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedData.length > 0 ? (
              displayedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50/10 transition-colors group">
                  <td className="px-4 py-2 text-[10px] font-bold text-gray-300 border-r border-gray-50 text-center bg-gray-50/30">
                    {idx + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col} className={`px-4 py-2 text-xs border-r border-gray-50 font-medium tabular-nums ${
                      sortConfig?.key === col ? 'bg-blue-50/5 text-blue-900' : 'text-gray-700'
                    }`}>
                      {(row as any)[col]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <Search size={32} />
                    <span className="text-xs font-bold uppercase tracking-widest">No matching records found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer Info */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0 gap-2">
        <div className="flex items-center gap-2">
          {filteredData.length > 100 ? (
            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 border border-amber-100">
              <Info size={10} />
              Showing first 100 of {filteredData.length} matches (Limited for performance)
            </div>
          ) : (
            <span>Showing {displayedData.length} of {filteredData.length} records</span>
          )}
          {searchTerm && <span className="text-blue-600"> (Filtered by "{searchTerm}")</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>PMAI Engine v2.4</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
        </div>
      </div>
    </div>
  );
};

export default TableView;