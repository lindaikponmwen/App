
import React, { useMemo, useState, useRef } from 'react';
import { Download, ChevronUp, ChevronDown, Table as TableIcon, FileText, Search, Info, FileDigit, FileType } from 'lucide-react';
import { arrayToCsv, downloadFile } from '../../utils/csvUtils';

interface ResultTableViewProps {
  tableData: {
    name: string;
    columns: string[];
    data: any[];
  } | null;
  htmlOutput?: string;
}

const ResultTableView: React.FC<ResultTableViewProps> = ({ tableData, htmlOutput }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    if (!tableData) return [];
    let data = [...tableData.data];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(row => 
        Object.values(row).some(val => String(val).toLowerCase().includes(lowerSearch))
      );
    }

    if (sortConfig) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [tableData, searchTerm, sortConfig]);

  const exportToWord = () => {
    if (!htmlOutput) return;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Export Table</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: 'Times New Roman', Times, serif; }
        th, td { border: 1px solid black; padding: 5pt; text-align: left; }
        .Rtable1 { border-top: 2pt solid black; border-bottom: 2pt solid black; }
      </style>
      </head><body>`;
    const footer = "</body></html>";
    const sourceHTML = header + htmlOutput + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Analysis_Report.doc';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    if (!htmlOutput) return;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Clinical Table Export</title>
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; }
            .Rtable1 { border-collapse: collapse; border-top: 2px solid black; border-bottom: 2px solid black; margin-bottom: 1em; font-size: 11pt; width: 100%; }
            .Rtable1 td, .Rtable1 th { padding: 0.5ex 1.5ex; border: none; }
            .Rtable1 th { text-align: center; border-bottom: 1px solid black; }
            .Rtable1 td { text-align: center; }
            .Rtable1 .rowlabel { text-align: left; font-weight: bold; }
            
            table:not(.Rtable1) { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 10pt; border-top: 2px solid black; border-bottom: 2px solid black; }
            table:not(.Rtable1) th { border-bottom: 1px solid black; padding: 8px; text-align: left; font-weight: bold; }
            table:not(.Rtable1) td { padding: 8px; }
          </style>
        </head>
        <body>
          ${htmlOutput}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!tableData && !htmlOutput) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/30 p-12">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-40"></div>
          <TableIcon size={48} className="text-gray-200 relative z-10" />
        </div>
        <h3 className="text-gray-600 font-bold uppercase tracking-widest mb-2">No Table Output</h3>
        <p className="text-xs max-w-xs text-center opacity-60">Run a table analysis script to generate results here.</p>
      </div>
    );
  }

  if (htmlOutput) {
    return (
      <div className="w-full h-full flex flex-col bg-white p-2 md:p-4 overflow-hidden animate-in fade-in duration-300">
        <div className="flex items-center justify-end mb-4 gap-2 shrink-0 border-b border-gray-100 pb-3">
          <button 
            onClick={exportToPdf}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] text-gray-600 border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all rounded-none"
          >
            <FileType size={12} />
            Export PDF
          </button>
          <button 
            onClick={exportToWord}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] text-gray-600 border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all rounded-none"
          >
            <FileDigit size={12} />
            Export Word
          </button>
          <button 
            onClick={() => {
              const blob = new Blob([htmlOutput], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'Analysis_Report.html';
              link.click();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1f24] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-sm rounded-none"
          >
            <Download size={12} />
            Download HTML
          </button>
        </div>

        <div className="flex-1 bg-white overflow-auto custom-scrollbar p-2 md:p-8" ref={printRef}>
          <style dangerouslySetInnerHTML={{ __html: `
            /* Professional Medical/Scientific Paper Styling for table1 */
            .Rtable1 { 
              border-collapse: collapse; 
              border-top: 2.5px solid #1a1f24; 
              border-bottom: 2.5px solid #1a1f24; 
              margin: 2em auto; 
              font-family: "Times New Roman", Times, serif; 
              font-size: 14px; 
              width: 95%;
              color: #1a1f24;
            }
            .Rtable1 td, .Rtable1 th { padding: 8px 12px; line-height: 1.4; border: none; }
            .Rtable1 th { text-align: center; border-bottom: 1.25px solid #1a1f24; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
            .Rtable1 .firstrow th { border-bottom: 0; }
            .Rtable1 tr:first-child th { border-top: 0; }
            .Rtable1 td { text-align: center; border-bottom: 0.5px solid #f1f5f9; }
            .Rtable1 .rowlabel { text-align: left; font-weight: 700; font-family: sans-serif; font-size: 12px; color: #475569; }
            .Rtable1 caption { margin-bottom: 1.5em; font-weight: 800; font-size: 18px; text-transform: uppercase; tracking: 0.05em; color: #1a1f24; }
            
            /* Enhanced Styling for kable (Standard HTML Tables) */
            table:not(.Rtable1) { 
              border-collapse: collapse; 
              width: 100%; 
              margin: 2em 0; 
              font-family: 'Inter', -apple-system, sans-serif; 
              font-size: 13px; 
              color: #1a1f24;
              border-top: 2px solid #1a1f24;
              border-bottom: 2px solid #1a1f24;
            }
            table:not(.Rtable1) caption {
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding: 10px;
              color: #1a1f24;
              font-size: 14px;
              border-bottom: 1px solid #e2e8f0;
              margin-bottom: 8px;
            }
            table:not(.Rtable1) thead tr {
              border-bottom: 1.5px solid #1a1f24;
            }
            table:not(.Rtable1) th { 
              padding: 12px 16px; 
              text-align: left; 
              font-weight: 800; 
              text-transform: uppercase; 
              letter-spacing: 0.05em;
              background-color: #f8fafc;
            }
            table:not(.Rtable1) td { 
              padding: 10px 16px; 
              border-bottom: 1px solid #f1f5f9;
              vertical-align: middle;
            }
            /* Right align numeric values in kable output if possible, 
               otherwise Inter's tabular-nums handles it well */
            table:not(.Rtable1) td:not(:first-child) {
              font-variant-numeric: tabular-nums;
            }
            table:not(.Rtable1) tbody tr:hover {
              background-color: #f1f5f9;
            }
          `}} />
          <div dangerouslySetInnerHTML={{ __html: htmlOutput }} />
        </div>

        <div className="mt-4 flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2">
          <div className="flex items-center gap-2">
             <Info size={10} className="text-blue-400" />
             R-Engine Dynamic Visualization Bundle
          </div>
          <span>Report Timestamp: {new Date().toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white p-4 md:p-6 overflow-hidden animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#1a1f24] text-white shadow-sm">
            <TableIcon size={16} />
          </div>
          <div>
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest">{tableData?.name || 'Raw Table Data'}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Filter result..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 text-xs text-gray-700 w-48 focus:border-blue-500 outline-none rounded-none font-medium"
            />
          </div>
          <button 
            onClick={() => tableData && downloadFile(arrayToCsv(tableData.data), `analysis_${tableData.name}.csv`)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1f24] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-sm rounded-none"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white overflow-auto custom-scrollbar relative border border-gray-100">
        <table className="w-full text-left border-collapse table-fixed min-w-full">
          <thead className="sticky top-0 z-30 bg-gray-50 border-b border-gray-200">
            <tr>
              {tableData?.columns.map(col => {
                const isSorted = sortConfig?.key === col;
                return (
                  <th 
                    key={col} 
                    onClick={() => handleSort(col)}
                    className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest border-r border-gray-200 group cursor-pointer transition-colors ${
                      isSorted ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{col}</span>
                      <div className={`flex flex-col transition-opacity ${isSorted ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`}>
                        <ChevronUp size={8} className={isSorted && sortConfig?.direction === 'asc' ? 'text-blue-600' : ''} />
                        <ChevronDown size={8} className={isSorted && sortConfig?.direction === 'desc' ? 'text-blue-600' : ''} />
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                {tableData?.columns.map(col => (
                  <td key={col} className="px-4 py-2.5 text-xs text-gray-600 border-r border-gray-50 font-medium tabular-nums truncate">
                    {String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
        <span>Total Count: {processedData.length}</span>
      </div>
    </div>
  );
};

export default ResultTableView;
