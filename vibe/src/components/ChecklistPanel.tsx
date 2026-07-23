import { useState } from 'react';
import { CheckSquare, Square, BookOpen, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import type { ChecklistItem } from '../lib/types';
import {
  updateChecklistItem,
  deleteChecklistItem,
  deleteChecklistSection,
} from '../services/sessionService';

interface ChecklistPanelProps {
  items: ChecklistItem[];
  sessionId: string;
  onToggle?: (item: ChecklistItem) => void;
  onRefresh: () => Promise<void>;
}

interface DeleteTarget {
  type: 'task' | 'section';
  item: ChecklistItem;
  childCount?: number;
}

export default function ChecklistPanel({ items, sessionId, onToggle, onRefresh }: ChecklistPanelProps) {
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sections = groupBySections(items);
  const completedTasks = items.filter(i => i.item_type === 'task' && i.status === 'complete').length;
  const totalTasks = items.filter(i => i.item_type === 'task').length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'section' && deleteTarget.item.section_number) {
        await deleteChecklistSection(sessionId, deleteTarget.item.section_number);
      } else {
        await deleteChecklistItem(deleteTarget.item.id);
      }
      await onRefresh();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const requestDelete = (item: ChecklistItem) => {
    if (item.item_type === 'section') {
      const childCount = items.filter(
        i => i.item_type === 'task' && i.section_number === item.section_number
      ).length;
      setDeleteTarget({ type: 'section', item, childCount });
    } else {
      setDeleteTarget({ type: 'task', item });
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
          <BookOpen size={16} className="text-gray-400" />
        </div>
        <p className="text-gray-400 text-sm">Checklist will appear when analysis begins</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Progress bar */}
        <div className="px-3 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs font-medium text-gray-700">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="h-1.5 bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">{progressPct}% complete</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sections.map(section => (
            <SectionGroup
              key={section.sectionItem.id}
              section={section}
              onToggle={onToggle}
              onDelete={requestDelete}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                <h3 className="text-sm font-semibold text-gray-900">Confirm Deletion</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="text-gray-400 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              {deleteTarget.type === 'section' ? (
                <p className="text-sm text-gray-700">
                  Delete section <strong>{deleteTarget.item.description}</strong>?
                  {deleteTarget.childCount !== undefined && deleteTarget.childCount > 0 && (
                    <span className="block mt-1 text-red-600 text-xs">
                      This will also delete {deleteTarget.childCount} task{deleteTarget.childCount !== 1 ? 's' : ''} in this section.
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-gray-700">
                  Delete task <span className="font-mono text-xs text-gray-500">[{deleteTarget.item.item_ref}]</span>{' '}
                  <strong>{deleteTarget.item.description}</strong>?
                </p>
              )}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-300 text-gray-600 text-sm py-2 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm py-2 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface SectionData {
  sectionItem: ChecklistItem;
  number: string;
  title: string;
  tasks: ChecklistItem[];
}

function groupBySections(items: ChecklistItem[]): SectionData[] {
  const sections: SectionData[] = [];
  let current: SectionData | null = null;

  for (const item of items) {
    if (item.item_type === 'section') {
      if (current) sections.push(current);
      current = {
        sectionItem: item,
        number: item.section_number || item.item_ref || '',
        title: item.description,
        tasks: [],
      };
    } else if (item.item_type === 'task' && current) {
      current.tasks.push(item);
    }
  }
  if (current) sections.push(current);
  return sections;
}

function SectionGroup({
  section,
  onToggle,
  onDelete,
  onRefresh,
}: {
  section: SectionData;
  onToggle?: (item: ChecklistItem) => void;
  onDelete: (item: ChecklistItem) => void;
  onRefresh: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const completed = section.tasks.filter(t => t.status === 'complete').length;
  const total = section.tasks.length;
  const allDone = completed === total && total > 0;

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditValue(item.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (item: ChecklistItem) => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === item.description) {
      cancelEdit();
      return;
    }
    setSavingId(item.id);
    try {
      await updateChecklistItem(item.id, { description: trimmed });
      await onRefresh();
    } finally {
      setSavingId(null);
      setEditingId(null);
      setEditValue('');
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* Section header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 group/section">
        <div className={`w-5 h-5 text-xs font-bold flex items-center justify-center flex-shrink-0 ${
          allDone ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {section.number}
        </div>

        {editingId === section.sectionItem.id ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <input
              autoFocus
              className="flex-1 text-xs border border-green-500 px-2 py-1 text-gray-800 focus:outline-none"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveEdit(section.sectionItem);
                if (e.key === 'Escape') cancelEdit();
              }}
            />
            <button
              onClick={() => saveEdit(section.sectionItem)}
              disabled={!!savingId}
              className="p-1 text-emerald-600 hover:text-emerald-800"
            >
              <Check size={13} />
            </button>
            <button onClick={cancelEdit} className="p-1 text-gray-400 hover:text-gray-700">
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <span className={`text-xs font-medium leading-tight flex-1 ${allDone ? 'text-emerald-600' : 'text-gray-700'}`}>
              {section.title}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">{completed}/{total}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(section.sectionItem)}
                className="p-1 text-gray-400 hover:text-green-700 transition-colors"
                title="Edit section"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={() => onDelete(section.sectionItem)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete section and all tasks"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Tasks */}
      <div className="pb-1">
        {section.tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
  onRefresh,
}: {
  task: ChecklistItem;
  onToggle?: (item: ChecklistItem) => void;
  onDelete: (item: ChecklistItem) => void;
  onRefresh: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setEditing(true);
    setEditValue(task.description);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditValue('');
  };

  const saveEdit = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === task.description) {
      cancelEdit();
      return;
    }
    setSaving(true);
    try {
      await updateChecklistItem(task.id, { description: trimmed });
      await onRefresh();
    } finally {
      setSaving(false);
      setEditing(false);
      setEditValue('');
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="flex-shrink-0">
          {task.status === 'complete'
            ? <CheckSquare size={13} className="text-emerald-500" />
            : <Square size={13} className="text-gray-300" />
          }
        </div>
        <span className="font-mono text-xs text-gray-400 flex-shrink-0">{task.item_ref}</span>
        <input
          autoFocus
          className="flex-1 text-xs border border-green-500 px-2 py-1 text-gray-800 focus:outline-none min-w-0"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
        />
        <button
          onClick={saveEdit}
          disabled={saving}
          className="flex-shrink-0 p-1 text-emerald-600 hover:text-emerald-800"
        >
          <Check size={12} />
        </button>
        <button onClick={cancelEdit} className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-700">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 px-3 py-1.5 hover:bg-gray-50 group/task transition-colors">
      <button
        onClick={() => onToggle?.(task)}
        className="flex-shrink-0 mt-0.5"
      >
        {task.status === 'complete'
          ? <CheckSquare size={13} className="text-emerald-500" />
          : <Square size={13} className="text-gray-300 group-hover/task:text-gray-500 transition-colors" />
        }
      </button>
      <button
        onClick={() => onToggle?.(task)}
        className="flex-1 min-w-0 text-left"
      >
        <span className={`text-xs leading-snug ${
          task.status === 'complete' ? 'text-gray-400 line-through' : 'text-gray-600'
        }`}>
          <span className="font-mono text-gray-400 mr-1">{task.item_ref}</span>
          {task.description}
        </span>
      </button>
      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover/task:opacity-100 transition-opacity">
        <button
          onClick={startEdit}
          className="p-1 text-gray-400 hover:text-green-700 transition-colors"
          title="Edit task"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={() => onDelete(task)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete task"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
