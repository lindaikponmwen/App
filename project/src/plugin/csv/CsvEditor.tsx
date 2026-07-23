import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown, ZoomIn, ZoomOut } from 'lucide-react';
import { FormulaEvaluator } from './csvFormulaProcessor';

interface CsvEditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  theme: 'light' | 'dark';
  readOnly?: boolean;
}

const MAX_CSV_COLUMNS = 1000;

const parseCsv = (csv: string): string[][] => {
  if (!csv || !csv.trim()) return [['']];
  const rows = csv.split('\n');
  return rows.map(row => {
    const regex = /(?:"([^"]*(?:""[^"]*)*)"|([^,]*))(?:,|$)/g;
    let match;
    const cells = [];
    while ((match = regex.exec(row)) !== null) {
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      if (match[1] !== undefined) {
        cells.push(match[1].replace(/""/g, '"'));
      } else {
        cells.push(match[2] || '');
      }
    }
    return cells;
  });
};

const serializeCsv = (data: (string|number)[][]): string => {
  return data.map(row => 
    row.map(cell => {
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  ).join('\n');
};

const CsvEditor: React.FC<CsvEditorProps> = ({ content, onContentChange, theme, readOnly = false }) => {
  const [data, setData] = useState<string[][]>([[]]);
  const [computedData, setComputedData] = useState<(string | number)[][]>([[]]);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(90);
  const internalUpdate = useRef(false);

  useEffect(() => {
    if (internalUpdate.current) {
        internalUpdate.current = false;
        return;
    }
    setData(parseCsv(content));
    setSortConfig(null);
  }, [content]);

  const maxColumns = useMemo(() => {
    if (!data || data.length === 0) return 10;
    const max = Math.max(...data.map(row => (row ? row.length : 0)), 10);
    return Math.min(max, MAX_CSV_COLUMNS);
  }, [data]);

  useEffect(() => {
    if (!data || data.length === 0) {
        setComputedData([[]]);
        return;
    }

    const maxIterations = 10;
    
    // Initialize with non-formula values, parsing numbers
    let newComputedData = data.map(row => 
      (row || []).map(cell => {
        if (typeof cell === 'string' && !cell.startsWith('=')) {
          const num = Number(cell);
          return (cell.trim() !== '' && !isNaN(num)) ? num : cell;
        }
        return cell;
      })
    );
    // Pad rows to ensure a uniform grid
    newComputedData.forEach(row => {
        while (row.length < maxColumns) { row.push(''); }
    });
    if(newComputedData.length === 0) {
        newComputedData.push(new Array(maxColumns).fill(''));
    }

    const formulaCells: { row: number; col: number }[] = [];
    data.forEach((row, r) => {
        if (row) {
            row.forEach((cell, c) => {
                if (typeof cell === 'string' && cell.startsWith('=')) {
                    formulaCells.push({ row: r, col: c });
                }
            });
        }
    });

    if (formulaCells.length > 0) {
        for (let i = 0; i < maxIterations; i++) {
            let changedInIteration = false;
            formulaCells.forEach(({ row, col }) => {
                const formula = (data[row][col] as string).substring(1);
                
                const getCellValue = (r: number, c: number) => newComputedData[r]?.[c] ?? 0;
                const evaluator = new FormulaEvaluator(getCellValue);
                const currentCellKey = `${row},${col}`;
                const newValue = evaluator.evaluate(formula, currentCellKey);

                if (newComputedData[row][col] !== newValue) {
                    newComputedData[row][col] = newValue;
                    changedInIteration = true;
                }
            });
            if (!changedInIteration) break;
        }
    }
    setComputedData(newComputedData);
  }, [data, maxColumns]);
  
  const handleSort = (colIndex: number) => {
    if (readOnly) return;
    const isNewColumn = !sortConfig || sortConfig.key !== colIndex;
    const direction = isNewColumn ? 'asc' : sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key: colIndex, direction });

    const headerRow = data[0];
    const bodyRows = [...data.slice(1)];

    bodyRows.sort((a, b) => {
      const aVal = computedData[data.indexOf(a)]?.[colIndex] || a[colIndex] || '';
      const bVal = computedData[data.indexOf(b)]?.[colIndex] || b[colIndex] || '';
      
      const aIsNum = typeof aVal === 'number';
      const bIsNum = typeof bVal === 'number';

      let comparison = 0;
      if (aIsNum && bIsNum) {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });

    const sortedData = [headerRow, ...bodyRows];
    internalUpdate.current = true;
    onContentChange(serializeCsv(sortedData));
    setData(sortedData);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (readOnly) return;
    const newData = data.map((row, rIdx) => {
        if (rIdx === rowIndex) {
            const newRow = [...(row || [])];
            while (newRow.length <= colIndex) newRow.push('');
            newRow[colIndex] = value;
            return newRow;
        }
        return row;
    });
    internalUpdate.current = true;
    onContentChange(serializeCsv(newData));
    setData(newData);
  };
  
  const getColumnLetter = (index: number) => {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode(index % 26 + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoomLevel(100);

  const themeClasses = theme === 'dark'
    ? {
        container: 'bg-gray-800 text-gray-300',
        table: 'border-gray-700',
        headerCell: 'bg-gray-900 border-gray-700 text-gray-600',
        rowNumberCell: 'bg-gray-900 border-gray-700 text-gray-600',
        cell: 'border-gray-700',
        input: `bg-transparent focus:bg-gray-700 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 ${readOnly ? 'cursor-default' : ''}`,
        evenRow: 'bg-gray-800/50',
      }
    : {
        container: 'bg-white text-gray-800',
        table: 'border-gray-200',
        headerCell: 'bg-gray-100 border-gray-200',
        rowNumberCell: 'bg-gray-100 border-gray-200',
        cell: 'border-gray-200',
        input: `bg-transparent focus:bg-blue-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 ${readOnly ? 'cursor-default' : ''}`,
        evenRow: 'bg-gray-50',
      };
    
    const formatDisplayValue = (value: string | number) => {
        if (typeof value === 'number') {
            return parseFloat(value.toPrecision(15)); // Avoid floating point noise
        }
        return value;
    }

  return (
    <div className={`w-full h-full overflow-auto relative ${themeClasses.container}`}>
      <table 
        className={`w-full border-collapse table-fixed ${themeClasses.table}`}
        style={{ zoom: `${zoomLevel}%` }}
      >
        <thead className="select-none">
          <tr>
            <th className={`${themeClasses.headerCell} w-16 min-w-16 sticky top-0 left-0 z-20 border-b border-r h-10`}></th>
            {Array.from({ length: maxColumns }).map((_, colIndex) => (
              <th key={colIndex} className={`${themeClasses.headerCell} w-40 min-w-40 border-b border-r p-0 font-semibold sticky top-0 z-10 h-10 group`}>
                <button
                  onClick={() => handleSort(colIndex)}
                  disabled={readOnly}
                  className={`flex items-center justify-between w-full h-full px-2 ${readOnly ? 'cursor-default' : ''}`}
                  title={`Sort by column ${getColumnLetter(colIndex)}`}
                >
                  <span>{getColumnLetter(colIndex)}</span>
                  {!readOnly && (
                    <span className="w-4 h-4">
                      {sortConfig && sortConfig.key === colIndex ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ChevronsUpDown className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => {
            const rowNumber = rowIndex + 1;
            return (
                <tr key={rowIndex} className={rowIndex % 2 !== 0 ? themeClasses.evenRow : ''}>
                    <td className={`${themeClasses.rowNumberCell} border-b border-r p-2 text-center font-semibold select-none sticky left-0 z-10`}>
                        {rowNumber}
                    </td>
                    {Array.from({ length: maxColumns }).map((_, colIndex) => {
                        const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                        const rawValue = row?.[colIndex] || '';
                        const computedValue = computedData[rowIndex]?.[colIndex];
                        const displayValue = formatDisplayValue(computedValue as string | number);
                        return (
                            <td key={colIndex} className={`${themeClasses.cell} border-b border-r`}>
                            <input
                                type="text"
                                value={isEditing ? rawValue : (displayValue ?? '')}
                                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                onFocus={() => setEditingCell({ row: rowIndex, col: colIndex })}
                                onBlur={() => setEditingCell(null)}
                                readOnly={readOnly}
                                className={`w-full h-full p-2 ${themeClasses.input} ${rowIndex === 0 ? 'font-semibold' : ''}`}
                            />
                            </td>
                        )
                    })}
                </tr>
            );
          })}
        </tbody>
      </table>

      {/* Zoom Controls */}
      <div className={`absolute bottom-4 right-4 z-30 flex items-center space-x-1 p-1 rounded-full shadow-lg ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <button 
            onClick={handleZoomOut} 
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Zoom Out"
        >
            <ZoomOut className="w-4 h-4" />
        </button>
        <span 
            className="text-xs font-semibold w-12 text-center select-none cursor-pointer"
            onClick={handleResetZoom}
            title="Reset Zoom"
        >
            {zoomLevel}%
        </span>
        <button 
            onClick={handleZoomIn} 
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-600'}`}
            title="Zoom In"
        >
            <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CsvEditor;