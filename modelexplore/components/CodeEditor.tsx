
import React from 'react';

interface CodeEditorProps {
  code: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code }) => {
  const lines = code.split('\n');

  return (
    <div className="w-full h-full bg-white overflow-auto flex flex-col code-font text-sm rounded-none">
      <div className="flex-1 flex rounded-none">
        {/* Line Numbers */}
        <div className="w-12 bg-gray-50 border-r border-gray-100 text-right pr-3 py-4 text-gray-300 select-none rounded-none">
          {lines.map((_, i) => (
            <div key={i} className="leading-6 h-6">{i + 1}</div>
          ))}
        </div>
        
        {/* Code Area */}
        <div className="flex-1 py-4 px-6 text-gray-700 rounded-none">
          {lines.map((line, i) => {
            // Simple pseudo-syntax highlighting
            let className = "leading-6 h-6 whitespace-pre";
            if (line.trim().startsWith('#')) className += " text-green-600 italic";
            if (line.includes('(')) className += " text-blue-800";
            
            return (
              <div key={i} className={className}>
                {line || ' '}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
