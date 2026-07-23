import { Clock, CheckCircle, XCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Invocation } from '../lib/types';
import { AGENT_LABELS, AGENT_AVATAR_COLORS, AGENT_INITIALS } from '../lib/config';
import type { AgentRole } from '../lib/types';

interface AgentActivityProps {
  invocations: Invocation[];
  activeAgent: AgentRole | null;
  activeAgentTask?: string;
}

export default function AgentActivity({ invocations, activeAgent, activeAgentTask }: AgentActivityProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Live indicator */}
      {activeAgent && (
        <div className={`m-3 p-3 border ${getAgentBorderColor(activeAgent)} bg-white`}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-6 h-6 text-xs font-bold flex items-center justify-center text-white ${AGENT_AVATAR_COLORS[activeAgent]}`}>
              {AGENT_INITIALS[activeAgent]}
            </div>
            <span className="text-xs font-medium text-gray-700">{AGENT_LABELS[activeAgent]}</span>
            <Loader2 size={12} className="ml-auto text-green-600 animate-spin" />
          </div>
          {activeAgentTask && (
            <p className="text-xs text-gray-500 leading-snug">{activeAgentTask}</p>
          )}
        </div>
      )}

      {invocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-10 px-4 text-center">
          <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
            <Clock size={16} className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-400">Agent activity log will appear here as tasks are executed</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {invocations.map(inv => (
            <InvocationCard
              key={inv.id}
              invocation={inv}
              expanded={expandedId === inv.id}
              onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvocationCard({
  invocation,
  expanded,
  onToggle,
}: {
  invocation: Invocation;
  expanded: boolean;
  onToggle: () => void;
}) {
  const role = invocation.agent_role as AgentRole;
  const response = invocation.response_payload;

  const statusIcon = {
    pending: <Loader2 size={12} className="text-gray-400 animate-spin" />,
    running: <Loader2 size={12} className="text-green-600 animate-spin" />,
    success: <CheckCircle size={12} className="text-emerald-500" />,
    partial_success: <CheckCircle size={12} className="text-amber-500" />,
    failure: <XCircle size={12} className="text-red-500" />,
  }[invocation.status] ?? null;

  const elapsed = invocation.completed_at
    ? Math.round((new Date(invocation.completed_at).getTime() - new Date(invocation.created_at).getTime()) / 1000)
    : null;

  return (
    <div className="px-3 py-2.5">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-2.5 text-left"
      >
        <div className={`w-6 h-6 text-xs font-bold flex items-center justify-center text-white flex-shrink-0 mt-0.5 ${AGENT_AVATAR_COLORS[role]}`}>
          {AGENT_INITIALS[role]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-medium text-gray-700">{AGENT_LABELS[role]}</span>
            {invocation.checklist_ref && (
              <span className="text-xs font-mono text-gray-400">[{invocation.checklist_ref}]</span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              {elapsed !== null && (
                <span className="text-xs text-gray-400">{elapsed}s</span>
              )}
              {statusIcon}
              {expanded ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-snug truncate">
            {invocation.task_summary || invocation.request_payload?.task.description || 'Processing...'}
          </p>
        </div>
      </button>

      {expanded && response && (
        <div className="mt-2 ml-8 space-y-2">
          {response.findings?.map((f, i) => (
            <div key={i} className={`text-xs px-2.5 py-2 border ${
              f.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-700' :
              f.severity === 'major' ? 'bg-amber-50 border-amber-200 text-amber-700' :
              f.severity === 'minor' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
              'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <span className="font-medium capitalize">{f.severity}</span> — {f.message}
              {f.suggested_action && (
                <div className="mt-1 text-gray-500">{f.suggested_action}</div>
              )}
            </div>
          ))}
          {response.artifacts_produced?.map((a, i) => (
            <div key={i} className="text-xs bg-gray-50 border border-gray-200 px-2.5 py-1.5 font-mono text-gray-500">
              {a.path}
            </div>
          ))}
        </div>
      )}

      {expanded && !response && invocation.status === 'running' && (
        <div className="mt-2 ml-8 flex items-center gap-2 text-xs text-gray-400">
          <Loader2 size={11} className="animate-spin" />
          Processing...
        </div>
      )}
    </div>
  );
}

function getAgentBorderColor(role: AgentRole): string {
  const map: Record<AgentRole, string> = {
    scientist_ii: 'border-green-400',
    project_manager: 'border-blue-300',
    pharmacometrician: 'border-emerald-300',
    data_manager: 'border-violet-300',
    medical_writer: 'border-amber-300',
    qc_manager: 'border-rose-300',
  };
  return map[role] || 'border-gray-200';
}
