import { Play, AlertCircle, BookOpen } from 'lucide-react';
import type { ChecklistItem } from '../lib/types';

interface HITLBannerProps {
  onContinue: () => void;
  checklist: ChecklistItem[];
}

export default function HITLBanner({ onContinue, checklist }: HITLBannerProps) {
  const pendingTasks = checklist.filter(i => i.item_type === 'task' && i.status === 'pending');
  const sections = [...new Set(pendingTasks.map(t => t.section_number).filter(Boolean))];

  return (
    <div className="border-t border-amber-300 bg-amber-50 px-5 py-4">
      <div className="flex items-start gap-3 mb-3">
        <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-amber-800 mb-0.5">Human in the Loop Pause</h3>
          <p className="text-xs text-amber-700 leading-relaxed">
            The checklist is ready. Review the planned analysis steps below before proceeding. You can ask Scientist II to modify any tasks.
          </p>
        </div>
      </div>

      {/* Checklist preview */}
      <div className="bg-white border border-amber-200 p-3 mb-3 max-h-48 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={12} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Analysis Checklist — {pendingTasks.length} tasks pending
          </span>
        </div>
        {sections.slice(0, 5).map(sectionNum => {
          const sectionTasks = pendingTasks.filter(t => t.section_number === sectionNum);
          const sectionTitle = sectionTasks[0]?.section_title || `Section ${sectionNum}`;
          return (
            <div key={sectionNum} className="mb-2">
              <div className="text-xs font-medium text-gray-700 mb-1">{sectionNum}. {sectionTitle}</div>
              {sectionTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-start gap-1.5 mb-0.5 ml-2">
                  <span className="text-gray-300 text-xs mt-0.5">□</span>
                  <span className="text-xs text-gray-400 font-mono mr-1">{task.item_ref}</span>
                  <span className="text-xs text-gray-500 leading-snug">{task.description}</span>
                </div>
              ))}
              {sectionTasks.length > 3 && (
                <div className="text-xs text-gray-400 ml-6">+{sectionTasks.length - 3} more tasks...</div>
              )}
            </div>
          );
        })}
        {sections.length > 5 && (
          <div className="text-xs text-gray-400 mt-1">...and {sections.length - 5} more sections</div>
        )}
      </div>

      <button
        onClick={onContinue}
        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-5 py-2 transition-colors"
      >
        <Play size={14} />
        Continue Analysis
      </button>
    </div>
  );
}
