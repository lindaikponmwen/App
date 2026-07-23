import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { X, FileText, FileCode, BarChart2 } from 'lucide-react';
import type { Artifact } from '../lib/types';

interface FileViewerModalProps {
  artifact: Artifact;
  onClose: () => void;
}

function getLanguage(path: string): string {
  if (path.endsWith('.R') || path.endsWith('.r')) return 'r';
  if (path.endsWith('.py')) return 'python';
  if (path.endsWith('.ctl') || path.endsWith('.mod') || path.endsWith('.lst')) return 'plaintext';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.yaml') || path.endsWith('.yml')) return 'yaml';
  if (path.endsWith('.md')) return 'markdown';
  if (path.endsWith('.csv')) return 'plaintext';
  if (path.endsWith('.html')) return 'html';
  return 'plaintext';
}

function getFileIcon(name: string) {
  if (name.endsWith('.R') || name.endsWith('.py') || name.endsWith('.ctl') || name.endsWith('.mod')) return FileCode;
  if (name.endsWith('.png') || name.endsWith('.pdf') || name.endsWith('.svg')) return BarChart2;
  return FileText;
}

function getFileIconColor(name: string): string {
  if (name.endsWith('.R') || name.endsWith('.py')) return 'text-emerald-600';
  if (name.endsWith('.ctl') || name.endsWith('.mod')) return 'text-green-700';
  if (name.endsWith('.md')) return 'text-gray-500';
  return 'text-gray-400';
}

export default function FileViewerModal({ artifact, onClose }: FileViewerModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const filename = artifact.path.split('/').pop() || artifact.path;
  const FileIcon = getFileIcon(filename);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white border border-gray-200 shadow-2xl flex flex-col"
        style={{ width: 'min(90vw, 1000px)', height: 'min(85vh, 720px)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-gray-50">
          <FileIcon size={15} className={getFileIconColor(filename)} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{filename}</div>
            <div className="text-xs text-gray-400 truncate font-mono">{artifact.path}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 font-mono">
              {getLanguage(artifact.path)}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800"
              title="Close (Esc)"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Monaco editor */}
        <div className="flex-1 overflow-hidden">
          {artifact.content ? (
            <Editor
              height="100%"
              language={getLanguage(artifact.path)}
              value={artifact.content}
              theme="light"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineHeight: 20,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                renderLineHighlight: 'line',
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                padding: { top: 12, bottom: 12 },
                fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
              }}
              loading={
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Loading editor...
                </div>
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No content available for this file.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <span className="text-xs text-gray-400">
            {artifact.content ? `${artifact.content.split('\n').length} lines` : '0 lines'}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(artifact.created_at).toLocaleString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
