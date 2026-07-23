import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChartNetwork, List, Activity, FolderOpen, Settings, ChevronLeft, AlertCircle,
  ToggleLeft, ToggleRight, StopCircle, PanelRight, X,
} from 'lucide-react';
import type { Session, Message, ChecklistItem, Invocation, Artifact, AgentRole } from '../lib/types';
import ChatPanel from './ChatPanel';
import ChecklistPanel from './ChecklistPanel';
import AgentActivity from './AgentActivity';
import FileTree from './FileTree';
import FileViewerModal from './FileViewerModal';
import HITLBanner from './HITLBanner';
import SettingsPanel from './SettingsPanel';
import { getMessages, addMessage, clearMessages } from '../services/messageService';
import { getChecklist, getArtifacts, updateChecklistItem, updateSession, getNextPendingTask, addArtifact } from '../services/sessionService';
import { getInvocations, clearInvocations } from '../services/invocationService';
import { runOrchestrator, processOneTask, agentForSection } from '../services/orchestrator';
import { getCurrentModel } from '../lib/openrouter';
import { AGENT_LABELS, RIGHT_PANEL_DEFAULT_WIDTH, RIGHT_PANEL_MIN_WIDTH, RIGHT_PANEL_MAX_WIDTH, AUTONOMOUS_MAX_TASKS } from '../lib/config';

type RightPanelTab = 'checklist' | 'activity' | 'files' | 'settings';

interface AnalysisWorkspaceProps {
  session: Session;
  isNewSession?: boolean;
  onBack: () => void;
}

function buildDispatchContent(
  role: AgentRole,
  task: ChecklistItem,
): string {
  const label = AGENT_LABELS[role];
  return `**▶ ${label} dispatched** — Task \`[${task.item_ref}]\`\n\n**Executing:** ${task.description}`;
}

export default function AnalysisWorkspace({ session, isNewSession = false, onBack }: AnalysisWorkspaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [invocations, setInvocations] = useState<Invocation[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentRole | null>(null);
  const [activeAgentTask, setActiveAgentTask] = useState<string>('');
  const [error, setError] = useState('');
  const [rightTab, setRightTab] = useState<RightPanelTab>('checklist');
  const [hitlPaused, setHitlPaused] = useState(false);
  const [hitlChecklist, setHitlChecklist] = useState<ChecklistItem[]>([]);
  const [hitlEnabled, setHitlEnabled] = useState(session.hitl_enabled);
  const [viewingArtifact, setViewingArtifact] = useState<Artifact | null>(null);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  // ── Prevent navigation while AI is processing ─────────────────────────────
  useEffect(() => {
    if (!loading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [loading]);

  // ── Draggable right panel ─────────────────────────────────────────────
  const [rightPanelWidth, setRightPanelWidth] = useState(RIGHT_PANEL_DEFAULT_WIDTH);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const onDragStart = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = rightPanelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = dragStartX.current - e.clientX;
      setRightPanelWidth(Math.max(RIGHT_PANEL_MIN_WIDTH, Math.min(RIGHT_PANEL_MAX_WIDTH, dragStartWidth.current + delta)));
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  // ── Autonomous loop guards ────────────────────────────────────────────
  const isLoopRunning = useRef(false);
  const stopLoop = useRef(false);
  const abortController = useRef<AbortController | null>(null);
  // Keep fresh refs to avoid stale closures in the loop
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const hitlEnabledRef = useRef(hitlEnabled);
  hitlEnabledRef.current = hitlEnabled;

  // ── Data loading ──────────────────────────────────────────────────────
  const refreshAll = useCallback(async () => {
    const [msgs, cl, invs, arts] = await Promise.all([
      getMessages(session.id),
      getChecklist(session.id),
      getInvocations(session.id),
      getArtifacts(session.id),
    ]);
    setMessages(msgs);
    setChecklist(cl);
    setInvocations(invs);
    setArtifacts(arts);
  }, [session.id]);

  // ── Autonomous loop ───────────────────────────────────────────────────
  const runAutonomousLoop = useCallback(async () => {
    if (isLoopRunning.current) return;

    const firstPending = await getNextPendingTask(session.id);
    if (!firstPending) return;

    isLoopRunning.current = true;
    stopLoop.current = false;
    setLoading(true);
    setError('');

    const agentUpdate = (role: AgentRole | null, task?: string) => {
      setActiveAgent(role);
      setActiveAgentTask(task || '');
      if (role) setRightTab('activity');
    };

    // Post "autonomous mode starting" notification
    const startMsg = await addMessage(session.id, {
      role: 'assistant',
      agent: 'scientist_ii',
      content: `**Autonomous Mode Active**\n\nHuman-in-the-loop is off. Scientist II is now spinning up agents to work through the pending checklist automatically.\n\nStarting with **[${firstPending.item_ref}]:** ${firstPending.description}`,
    });
    setMessages(prev => [...prev, startMsg]);
    setRightTab('activity');

    const ctrl = new AbortController();
    abortController.current = ctrl;
    let processed = 0;

    try {
      for (let i = 0; i < AUTONOMOUS_MAX_TASKS; i++) {
        // Stop if HITL was turned back on or halt requested
        if (stopLoop.current || hitlEnabledRef.current || ctrl.signal.aborted) break;

        const pending = await getNextPendingTask(session.id);
        if (!pending) {
          const doneMsg = await addMessage(session.id, {
            role: 'assistant',
            agent: 'scientist_ii',
            content: `**Autonomous loop complete** — processed ${processed} task${processed !== 1 ? 's' : ''}.\n\nAll pending checklist items have been worked through. Review the Checklist and Files tabs for outputs.`,
          });
          setMessages(prev => [...prev, doneMsg]);
          break;
        }

        const agentRole = agentForSection(pending.section_number);

        const taskResult = await processOneTask(
          { ...sessionRef.current, hitl_enabled: false },
          pending,
          agentUpdate,
          async ({ systemPrompt, userPrompt }) => {
            const dispMsg = await addMessage(session.id, {
              role: 'assistant',
              agent: agentRole,
              content: buildDispatchContent(agentRole, pending),
              metadata: { type: 'dispatch', systemPrompt, userPrompt },
            });
            setMessages(prev => [...prev, dispMsg]);
          },
          ctrl.signal
        );

        processed++;

        const resultMsg = await addMessage(session.id, {
          role: 'assistant',
          agent: taskResult.agentRole,
          content: taskResult.message,
        });
        setMessages(prev => [...prev, resultMsg]);
        await refreshAll();
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(String(err));
      }
    } finally {
      abortController.current = null;
      isLoopRunning.current = false;
      setLoading(false);
      setActiveAgent(null);
      setActiveAgentTask('');
    }
  }, [session.id, refreshAll]);

  // Start loop on mount if HITL is already off
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  useEffect(() => {
    refreshAll().then(() => setInitialLoadDone(true));
  }, [refreshAll]);

  useEffect(() => {
    if (initialLoadDone && !hitlEnabled) {
      runAutonomousLoop();
    }
  // Only run once after initial load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoadDone]);

  // Auto-fire initial prompt for brand-new sessions
  const autoPromptFired = useRef(false);
  const sendMessageRef = useRef<((text: string) => void) | null>(null);
  useEffect(() => {
    if (!initialLoadDone || autoPromptFired.current || !isNewSession) return;
    autoPromptFired.current = true;
    sendMessageRef.current?.('Proceed with the analysis');
  }, [initialLoadDone, isNewSession]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleHalt = () => {
    stopLoop.current = true;
    abortController.current?.abort();
  };

  const handleToggleHITL = async () => {
    const next = !hitlEnabled;
    setHitlEnabled(next);
    hitlEnabledRef.current = next;
    await updateSession(session.id, { hitl_enabled: next });

    if (next) {
      // Turning HITL on — stop any running loop
      stopLoop.current = true;
    } else {
      // Turning HITL off — immediately start autonomous processing
      runAutonomousLoop();
    }
  };

  const handleClearChat = async () => {
    await Promise.all([clearMessages(session.id), clearInvocations(session.id)]);
    setMessages([]);
    setInvocations([]);
  };

  const handleSendMessage = async (text: string) => {
    if (loading) return;
    setError('');
    setHitlPaused(false);

    const userMsg = await addMessage(session.id, { role: 'user', content: text });
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const agentUpdate = (role: AgentRole | null, task?: string) => {
      setActiveAgent(role);
      setActiveAgentTask(task || '');
      if (role) setRightTab('activity');
    };

    try {
      const ctrl = new AbortController();
      abortController.current = ctrl;
      const currentMessages = [...messages, userMsg];
      const result = await runOrchestrator(
        text,
        { ...session, hitl_enabled: hitlEnabled },
        currentMessages,
        agentUpdate,
        ctrl.signal
      );

      const assistantMsg = await addMessage(session.id, {
        role: 'assistant',
        agent: result.agentRole || 'scientist_ii',
        content: result.message,
      });
      setMessages(prev => [...prev, assistantMsg]);

      if (result.hitlPause && hitlEnabled) {
        setHitlPaused(true);
        setHitlChecklist(result.hitlChecklistPreview || []);
        await refreshAll();
        return;
      }

      await refreshAll();
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(String(err));
      }
    } finally {
      abortController.current = null;
      setLoading(false);
      setActiveAgent(null);
      setActiveAgentTask('');
    }

    // After the orchestrator responds, kick off the loop if HITL is off
    if (!hitlEnabledRef.current) {
      runAutonomousLoop();
    }
  };

  const handleChecklistToggle = async (item: ChecklistItem) => {
    const newStatus = item.status === 'complete' ? 'pending' : 'complete';
    await updateChecklistItem(item.id, { status: newStatus });
    setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
  };

  // Keep ref fresh every render so the auto-prompt effect can call it
  sendMessageRef.current = handleSendMessage;

  const completedCount = checklist.filter(i => i.item_type === 'task' && i.status === 'complete').length;
  const totalCount = checklist.filter(i => i.item_type === 'task').length;

  const rightPanelTabs: { id: RightPanelTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'checklist', label: 'Checklist', icon: List, badge: totalCount > 0 ? totalCount - completedCount : undefined },
    { id: 'activity', label: 'Activity', icon: Activity, badge: invocations.filter(i => i.status === 'running').length || undefined },
    { id: 'files', label: 'Files', icon: FolderOpen, badge: artifacts.length || undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
        <button onClick={onBack} className="p-1.5 hover:bg-gray-100 transition-colors">
          <ChevronLeft size={16} className="text-gray-500" />
        </button>

        <div className="w-7 h-7 bg-green-700 flex items-center justify-center flex-shrink-0 rounded-lg">
          <ChartNetwork size={13} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h1 className="text-sm font-semibold text-gray-900 truncate max-w-[140px] sm:max-w-none">{session.name}</h1>
            {session.compound && (
              <span className="hidden sm:inline text-xs text-gray-500 border border-gray-200 px-1.5 py-0.5">{session.compound}</span>
            )}
            {session.analysis_type && (
              <span className="hidden sm:inline text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">{session.analysis_type}</span>
            )}
            {!hitlEnabled && loading && (
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 animate-pulse">
                Auto
              </span>
            )}
          </div>
        </div>

        {/* HITL toggle + Halt button */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {loading && (
            <button
              onClick={handleHalt}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2 sm:px-2.5 py-1 transition-colors"
              title="Halt processing"
            >
              <StopCircle size={13} />
              <span className="hidden sm:inline">Halt</span>
            </button>
          )}
          <span className="hidden md:inline text-xs text-gray-500">Human in the Loop</span>
          <button
            onClick={handleToggleHITL}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            title={hitlEnabled ? 'Disable Human in the Loop' : 'Enable Human in the Loop'}
          >
            {hitlEnabled
              ? <ToggleRight size={22} className="text-green-700" />
              : <ToggleLeft size={22} className="text-gray-400" />
            }
          </button>
          {totalCount > 0 && (
            <span className="hidden sm:inline text-xs text-gray-400 border-l border-gray-200 pl-2 ml-1">
              <span className="text-gray-700 font-medium">{completedCount}</span>/{totalCount}
            </span>
          )}
          {/* Mobile toggle for right panel */}
          <button
            onClick={() => setMobileRightOpen(v => !v)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors ml-1"
            title="Toggle panel"
          >
            <PanelRight size={16} className="text-gray-500" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Chat area */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              messages={messages}
              loading={loading}
              activeAgent={activeAgent}
              activeAgentTask={activeAgentTask}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              onSaveArtifact={async (path, content) => {
                await addArtifact(session.id, { path, artifact_type: 'document', content });
                await refreshAll();
              }}
            />
          </div>

          {error && (
            <div className="mx-4 mb-3 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {hitlPaused && (
            <HITLBanner
              checklist={hitlChecklist.length > 0 ? hitlChecklist : checklist}
              onContinue={() => setHitlPaused(false)}
            />
          )}
        </div>

        {/* Drag handle — desktop only */}
        <div
          onMouseDown={onDragStart}
          className="hidden lg:block w-1 flex-shrink-0 bg-gray-200 hover:bg-green-500 active:bg-green-600 cursor-col-resize transition-colors"
          title="Drag to resize panel"
        />

        {/* Right panel — desktop: fixed width sidebar; mobile: slide-over drawer */}
        {/* Mobile overlay backdrop */}
        {mobileRightOpen && (
          <div
            className="lg:hidden fixed inset-0 z-20 bg-black/30"
            onClick={() => setMobileRightOpen(false)}
          />
        )}

        <div
          className={[
            'flex flex-col bg-white border-l border-gray-200',
            // Desktop: always visible, dynamic width
            'hidden lg:flex flex-shrink-0',
          ].join(' ')}
          style={{ width: rightPanelWidth }}
        >
          <RightPanelContent
            rightTab={rightTab}
            setRightTab={setRightTab}
            rightPanelTabs={rightPanelTabs}
            checklist={checklist}
            session={session}
            invocations={invocations}
            activeAgent={activeAgent}
            activeAgentTask={activeAgentTask}
            artifacts={artifacts}
            handleChecklistToggle={handleChecklistToggle}
            refreshAll={refreshAll}
            setViewingArtifact={setViewingArtifact}
            onClose={undefined}
          />
        </div>

        {/* Mobile slide-over panel */}
        <div
          className={[
            'lg:hidden fixed right-0 top-0 bottom-0 z-30 flex flex-col bg-white border-l border-gray-200 shadow-xl transition-transform duration-300',
            mobileRightOpen ? 'translate-x-0' : 'translate-x-full',
          ].join(' ')}
          style={{ width: 'min(85vw, 360px)' }}
        >
          <RightPanelContent
            rightTab={rightTab}
            setRightTab={setRightTab}
            rightPanelTabs={rightPanelTabs}
            checklist={checklist}
            session={session}
            invocations={invocations}
            activeAgent={activeAgent}
            activeAgentTask={activeAgentTask}
            artifacts={artifacts}
            handleChecklistToggle={handleChecklistToggle}
            refreshAll={refreshAll}
            setViewingArtifact={setViewingArtifact}
            onClose={() => setMobileRightOpen(false)}
          />
        </div>
      </div>

      {viewingArtifact && (
        <FileViewerModal
          artifact={viewingArtifact}
          onClose={() => setViewingArtifact(null)}
        />
      )}
    </div>
  );
}

interface RightPanelContentProps {
  rightTab: RightPanelTab;
  setRightTab: (t: RightPanelTab) => void;
  rightPanelTabs: { id: RightPanelTab; label: string; icon: React.ElementType; badge?: number }[];
  checklist: ChecklistItem[];
  session: Session;
  invocations: Invocation[];
  activeAgent: AgentRole | null;
  activeAgentTask: string;
  artifacts: Artifact[];
  handleChecklistToggle: (item: ChecklistItem) => void;
  refreshAll: () => Promise<void>;
  setViewingArtifact: (a: Artifact | null) => void;
  onClose: (() => void) | undefined;
}

function RightPanelContent({
  rightTab, setRightTab, rightPanelTabs,
  checklist, session, invocations, activeAgent, activeAgentTask,
  artifacts, handleChecklistToggle, refreshAll, setViewingArtifact, onClose,
}: RightPanelContentProps) {
  const [currentModelId, setCurrentModelId] = useState(getCurrentModel().id);

  return (
    <>
      {/* Tabs row */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 flex-shrink-0 border-r border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            title="Close panel"
          >
            <X size={14} />
          </button>
        )}
        {rightPanelTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setRightTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors relative ${
              rightTab === tab.id
                ? 'text-green-700 border-b-2 border-green-600 bg-green-50/40'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={13} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`absolute top-1.5 right-2 w-4 h-4 text-xs flex items-center justify-center text-white ${
                tab.id === 'activity' ? 'bg-green-600' : 'bg-gray-400'
              }`}>
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {rightTab === 'checklist' && (
          <ChecklistPanel
            items={checklist}
            sessionId={session.id}
            onToggle={handleChecklistToggle}
            onRefresh={refreshAll}
          />
        )}
        {rightTab === 'activity' && (
          <AgentActivity
            invocations={invocations}
            activeAgent={activeAgent}
            activeAgentTask={activeAgentTask}
          />
        )}
        {rightTab === 'files' && (
          <FileTree
            artifacts={artifacts}
            onFileClick={artifact => { setViewingArtifact(artifact); }}
          />
        )}
        {rightTab === 'settings' && (
          <SettingsPanel currentModelId={currentModelId} onModelChange={setCurrentModelId} />
        )}
      </div>
    </>
  );
}
