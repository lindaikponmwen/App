import { Folder, FileText, FileCode, BarChart2, ChevronRight, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Artifact } from '../lib/types';

interface FileTreeProps {
  artifacts: Artifact[];
  onFileClick: (artifact: Artifact) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children: TreeNode[];
  artifact?: Artifact;
}

export default function FileTree({ artifacts, onFileClick }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Session', 'Data', 'Scripts', 'Results', 'Plots', 'Reports']));

  const tree = useMemo(() => buildTree(artifacts), [artifacts]);

  const toggle = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
          <Folder size={16} className="text-gray-400" />
        </div>
        <p className="text-xs text-gray-400">Workspace files will appear here as agents produce artifacts</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto p-2">
      {tree.children.map(node => (
        <TreeNodeView
          key={node.path}
          node={node}
          expanded={expanded}
          onToggle={toggle}
          onFileClick={onFileClick}
          depth={0}
        />
      ))}
    </div>
  );
}

function TreeNodeView({
  node,
  expanded,
  onToggle,
  onFileClick,
  depth,
}: {
  node: TreeNode;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onFileClick: (artifact: Artifact) => void;
  depth: number;
}) {
  const isOpen = expanded.has(node.path);

  if (node.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => onToggle(node.path)}
          className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 text-left transition-colors"
          style={{ paddingLeft: depth * 12 + 8 }}
        >
          {isOpen ? <ChevronDown size={12} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />}
          <Folder size={13} className="text-amber-500 flex-shrink-0" />
          <span className="text-xs text-gray-600 truncate">{node.name}</span>
          {node.children.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{node.children.length}</span>
          )}
        </button>
        {isOpen && node.children.map(child => (
          <TreeNodeView
            key={child.path}
            node={child}
            expanded={expanded}
            onToggle={onToggle}
            onFileClick={onFileClick}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  const FileIcon = getFileIcon(node.name);

  return (
    <button
      className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-green-50 text-left transition-colors group"
      style={{ paddingLeft: depth * 12 + 8 }}
      title={`Click to open ${node.path}`}
      onClick={() => node.artifact && onFileClick(node.artifact)}
    >
      <FileIcon size={13} className={getFileColor(node.name)} />
      <span className="text-xs text-gray-500 group-hover:text-gray-800 truncate transition-colors">{node.name}</span>
    </button>
  );
}

function buildTree(artifacts: Artifact[]): TreeNode {
  const root: TreeNode = { name: 'workspace', path: '', type: 'dir', children: [] };

  for (const artifact of artifacts) {
    const parts = artifact.path.split('/').filter(Boolean);

    // Skip any path that contains a dot-file or dot-folder segment
    if (parts.some(p => p.startsWith('.'))) continue;

    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join('/');

      let existing = current.children.find(c => c.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: fullPath,
          type: isLast ? 'file' : 'dir',
          children: [],
          artifact: isLast ? artifact : undefined,
        };
        current.children.push(existing);
      }
      current = existing;
    }
  }

  return root;
}

function getFileIcon(name: string): typeof FileText {
  if (name.endsWith('.R') || name.endsWith('.py') || name.endsWith('.ctl') || name.endsWith('.mod')) return FileCode;
  if (name.endsWith('.png') || name.endsWith('.pdf') || name.endsWith('.svg')) return BarChart2;
  return FileText;
}

function getFileColor(name: string): string {
  if (name.endsWith('.R') || name.endsWith('.py')) return 'text-emerald-600';
  if (name.endsWith('.ctl') || name.endsWith('.mod') || name.endsWith('.lst')) return 'text-green-700';
  if (name.endsWith('.csv') || name.endsWith('.xpt')) return 'text-violet-600';
  if (name.endsWith('.docx') || name.endsWith('.pptx') || name.endsWith('.pdf')) return 'text-amber-600';
  if (name.endsWith('.png') || name.endsWith('.svg')) return 'text-rose-500';
  if (name.endsWith('.md') || name.endsWith('.json') || name.endsWith('.yaml')) return 'text-gray-500';
  return 'text-gray-400';
}
