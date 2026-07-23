import { useState, useRef, useEffect } from 'react';
import {
  Plus, ChartNetwork, Clock, ChevronRight,
  ToggleLeft, ToggleRight, Pencil, Copy, Trash2,
  MoreHorizontal, Check, X, FlaskConical, Lock,
  ChevronDown, ChevronUp, Upload, FileText, Info,
  Users, Cpu, Database, FileBarChart2, ShieldCheck, Sparkles,
} from 'lucide-react';
import type { Session } from '../lib/types';
import { DEMO_SESSION_ID } from '../lib/config';

const DEFAULT_SOFTWARE_STACK = 'R 4.4.0, NONMEM 7.5.1, PHIKL';

const AGENT_ROSTER = [
  {
    role: 'scientist_ii',
    label: 'Scientist II',
    initials: 'SII',
    discipline: 'Orchestrator',
    avatarBg: 'bg-green-700',
    roleColor: 'text-green-700',
    Icon: Cpu,
    description: 'Central orchestrator that interprets user intent, decomposes analysis goals into checklist tasks, dispatches sub-agents in the correct sequence, and synthesises all results into a coherent response.',
    capabilities: ['Task planning', 'Agent dispatch', 'Result synthesis', 'HITL coordination'],
  },
  {
    role: 'project_manager',
    label: 'Project Manager',
    initials: 'PM',
    discipline: 'Planning & Documentation',
    avatarBg: 'bg-blue-700',
    roleColor: 'text-blue-700',
    Icon: FileBarChart2,
    description: 'Sets up the session workspace, drafts the Data Analysis Plan, defines analysis objectives, specifies software versions, and maintains project-level documentation throughout the engagement.',
    capabilities: ['Analysis planning', 'Folder setup', 'DAP authoring', 'Software specification'],
  },
  {
    role: 'pharmacometrician',
    label: 'Pharmacometrician',
    initials: 'PMx',
    discipline: 'Modelling & Simulation',
    avatarBg: 'bg-emerald-700',
    roleColor: 'text-emerald-700',
    Icon: ChartNetwork,
    description: 'Develops and evaluates population PK/PD models using NONMEM, nlmixr2, and Monolix. Performs structural model selection, random-effects development, covariate analysis, VPC generation, and model qualification.',
    capabilities: ['PopPK/PD modelling', 'NONMEM / nlmixr2', 'Covariate analysis', 'VPC & NPC'],
  },
  {
    role: 'data_manager',
    label: 'Data Manager',
    initials: 'DM',
    discipline: 'Data & EDA',
    avatarBg: 'bg-violet-700',
    roleColor: 'text-violet-700',
    Icon: Database,
    description: 'Ingests source datasets, performs integrity checks, maps data to CDISC standards, builds analysis-ready NONMEM datasets, and conducts exploratory data analysis including dose-proportionality and covariate screening.',
    capabilities: ['Dataset assembly', 'CDISC mapping', 'EDA plots', 'BQL handling'],
  },
  {
    role: 'medical_writer',
    label: 'Medical Writer',
    initials: 'MW',
    discipline: 'Reporting',
    avatarBg: 'bg-amber-700',
    roleColor: 'text-amber-700',
    Icon: FileText,
    description: 'Produces publication-quality pharmacometrics reports and PowerPoint presentations. Translates modelling outputs into clear clinical narratives, populates parameter tables, and compiles appendices with all figures.',
    capabilities: ['Final report', 'Slide decks', 'Parameter tables', 'Clinical interpretation'],
  },
  {
    role: 'qc_manager',
    label: 'QC Manager',
    initials: 'QC',
    discipline: 'Quality Control',
    avatarBg: 'bg-rose-700',
    roleColor: 'text-rose-700',
    Icon: ShieldCheck,
    description: 'Reviews all deliverables — scripts, datasets, reports, and presentations — against pre-specified acceptance criteria. Flags findings by severity, tracks resolution, and signs off on the final analysis package.',
    capabilities: ['Script QC', 'Report review', 'Finding triage', 'Sign-off'],
  },
] as const;

interface SessionListProps {
  sessions: Session[];
  onSelect: (session: Session) => void;
  onCreate: (params: {
    name: string;
    compound?: string;
    software_stack?: string;
    analysis_type?: string;
    hitl_enabled: boolean;
    datasetFile?: File;
  }) => void;
  onRename: (id: string, name: string) => Promise<void>;
  onDuplicate: (session: Session) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

const ANALYSIS_TYPES = ['PopPK', 'PKPD', 'NCA', 'Covariate Analysis', 'VPC', 'PBPK', 'QSP', 'Other'];

function CollapsibleSection({
  title, subtitle, icon: Icon, children, defaultOpen = false,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-50 border border-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon size={15} className="text-green-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {open
          ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
          : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

export default function SessionList({
  sessions, onSelect, onCreate, onRename, onDuplicate, onDelete, loading,
}: SessionListProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    compound: '',
    analysis_type: 'PopPK',
    hitl_enabled: true,
  });
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  const handleCreate = () => {
    if (!form.name.trim()) return;
    onCreate({
      name: form.name,
      compound: form.compound || undefined,
      software_stack: DEFAULT_SOFTWARE_STACK,
      analysis_type: form.analysis_type || undefined,
      hitl_enabled: form.hitl_enabled,
      datasetFile: datasetFile ?? undefined,
    });
    setForm({ name: '', compound: '', analysis_type: 'PopPK', hitl_enabled: true });
    setDatasetFile(null);
    setShowForm(false);
  };

  const startRename = (session: Session) => {
    if (session.id === DEMO_SESSION_ID) return;
    setMenuOpen(null);
    setRenamingId(session.id);
    setRenameValue(session.name);
  };

  const commitRename = async () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return; }
    setActionLoading(true);
    try { await onRename(renamingId, renameValue.trim()); } finally {
      setActionLoading(false);
      setRenamingId(null);
    }
  };

  const handleDuplicate = async (session: Session) => {
    setMenuOpen(null);
    setActionLoading(true);
    try { await onDuplicate(session); } finally { setActionLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteTarget.id === DEMO_SESSION_ID) return;
    setActionLoading(true);
    try { await onDelete(deleteTarget.id); } finally {
      setActionLoading(false);
      setDeleteTarget(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-green-700 flex items-center justify-center flex-shrink-0 rounded-lg">
          <ChartNetwork size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900">PMx Autonomous Co-pilot</h1>
          <p className="text-xs text-gray-500">Multi-Agent Pharmacometrics Analysis System</p>
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        {/* Page title + New Session button */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pharmacometrics Analysis Sessions</h2>
            <p className="text-sm text-gray-500 mt-0.5">Select an existing session or start a new analysis</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 transition-colors rounded-lg"
          >
            <Plus size={14} />
            New Session
          </button>
        </div>

        {/* ── Create form ────────────────────────────────────────────────── */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5 space-y-4">
            <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider">New Analysis Session</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Session name */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Session Name *</label>
                <input
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 transition-colors rounded-lg"
                  placeholder="e.g., ABBV-400 Phase 1 PopPK Analysis"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>

              {/* Compound */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Compound</label>
                <input
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 transition-colors rounded-lg"
                  placeholder="e.g., ABBV-400"
                  value={form.compound}
                  onChange={e => setForm(f => ({ ...f, compound: e.target.value }))}
                />
              </div>

              {/* Analysis type */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Analysis Type</label>
                <select
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-green-600 transition-colors rounded-lg"
                  value={form.analysis_type}
                  onChange={e => setForm(f => ({ ...f, analysis_type: e.target.value }))}
                >
                  {ANALYSIS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Software stack — fixed, read-only */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Software Stack</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
                  {['R 4.4.0', 'NONMEM 7.5.1', 'PHIKL'].map(pkg => (
                    <span key={pkg} className="text-xs bg-white border border-gray-300 text-gray-700 px-2 py-0.5 rounded font-mono">
                      {pkg}
                    </span>
                  ))}
                  <span className="ml-auto text-xs text-gray-400 italic">fixed</span>
                </div>
              </div>

              {/* Dataset upload */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Dataset <span className="normal-case font-normal text-gray-400">(optional — CSV / tab-delimited)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tab,.txt,.xls,.xlsx"
                  className="hidden"
                  onChange={e => setDatasetFile(e.target.files?.[0] ?? null)}
                />
                {datasetFile ? (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <FileText size={15} className="text-green-700 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium truncate">{datasetFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(datasetFile.size / 1024).toFixed(1)} KB &mdash; will be saved to <span className="font-mono">Data/{datasetFile.name}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => { setDatasetFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-lg px-3 py-3 text-sm text-gray-500 hover:text-green-700 transition-colors"
                  >
                    <Upload size={15} />
                    Click to upload dataset
                  </button>
                )}
              </div>

              {/* HITL toggle */}
              <div className="col-span-2 flex items-center gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, hitl_enabled: !f.hitl_enabled }))}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  {form.hitl_enabled
                    ? <ToggleRight size={22} className="text-green-700" />
                    : <ToggleLeft size={22} className="text-gray-400" />}
                  Human in the Loop
                </button>
                <span className="text-xs text-gray-400">Pause for review before executing each phase</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={!form.name.trim() || loading}
                className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 transition-colors rounded-lg"
              >
                Create Session
              </button>
              <button
                onClick={() => { setShowForm(false); setDatasetFile(null); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 transition-colors rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Session list ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading sessions...</div>
        ) : sessions.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <ChartNetwork size={22} className="text-gray-400" />
            </div>
            <h3 className="text-gray-800 font-semibold mb-2">No analysis sessions yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first pharmacometrics analysis session to get started.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-6 py-2.5 transition-colors rounded-lg"
            >
              Create First Session
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(session => {
              const isDemo = session.id === DEMO_SESSION_ID;
              return (
                <div key={session.id} className={['relative group bg-white hover:bg-gray-50 transition-all rounded-xl shadow-sm hover:shadow-md', isDemo ? 'ring-1 ring-green-200' : ''].join(' ')}>
                  {renamingId === session.id ? (
                    <div className="flex items-center gap-3 px-5 py-4">
                      <div className="w-8 h-8 bg-green-700 flex items-center justify-center flex-shrink-0 rounded-lg">
                        <ChartNetwork size={14} className="text-white" />
                      </div>
                      <input
                        ref={renameInputRef}
                        className="flex-1 border border-green-500 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 rounded-lg"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                      />
                      <button onClick={commitRename} disabled={actionLoading} className="p-1.5 text-green-700 hover:text-green-800 disabled:opacity-40" title="Save">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setRenamingId(null)} className="p-1.5 text-gray-400 hover:text-gray-700" title="Cancel">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <button onClick={() => onSelect(session)} className="flex-1 text-left p-5 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className={['w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5 rounded-lg', isDemo ? 'bg-green-700' : 'bg-cyan-600'].join(' ')}>
                            {isDemo ? <FlaskConical size={14} className="text-white" /> : <ChartNetwork size={14} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-gray-900 text-sm">{session.name}</h3>
                              {isDemo && (
                                <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-medium">
                                  <FlaskConical size={10} />
                                  Demo
                                </span>
                              )}
                              {session.hitl_enabled && (
                                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">Human in the Loop</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {session.compound && <span className="text-xs text-gray-500 font-medium">{session.compound}</span>}
                              {session.analysis_type && (
                                <span className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5">{session.analysis_type}</span>
                              )}
                              {session.software_stack && (
                                <span className="text-xs text-gray-400 font-mono truncate max-w-[200px]">{session.software_stack}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 pr-4 pt-5 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock size={11} />
                          {formatDate(session.created_at)}
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-green-600 transition-colors mr-1" />

                        {isDemo ? (
                          <div className="p-1.5 text-gray-300" title="Demo session — read-only">
                            <Lock size={14} />
                          </div>
                        ) : (
                          <div className="relative" onMouseDown={e => e.stopPropagation()}>
                            <button
                              onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === session.id ? null : session.id); }}
                              className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                              title="More actions"
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {menuOpen === session.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 shadow-lg z-20 py-1 rounded-lg">
                                <button onClick={() => startRename(session)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                  <Pencil size={13} className="text-gray-400" />
                                  Rename
                                </button>
                                <button onClick={() => handleDuplicate(session)} disabled={actionLoading} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40">
                                  <Copy size={13} className="text-gray-400" />
                                  Duplicate
                                </button>
                                <div className="border-t border-gray-100 my-1" />
                                <button onClick={() => { setMenuOpen(null); setDeleteTarget(session); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                  <Trash2 size={13} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Collapsible panels ─────────────────────────────────────────── */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Agents &amp; Platform Info</h2>
              <p className="text-sm text-gray-500 mt-0.5">Learn about the AI agents and the platform capabilities</p>
            </div>
          </div>
          <div className="space-y-3">

          {/* Multi-Agent Team */}
          <CollapsibleSection
            title="Multi-Agent Team"
            subtitle="Six specialised AI agents collaborate autonomously to complete each analysis"
            icon={Users}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
              {AGENT_ROSTER.map(agent => (
                <div key={agent.role} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${agent.avatarBg}`}>
                      <span className="text-white text-xs font-bold tracking-tight">{agent.initials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{agent.label}</p>
                      <p className={`text-xs font-medium mt-0.5 ${agent.roleColor}`}>{agent.discipline}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{agent.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {agent.capabilities.map(cap => (
                      <span key={cap} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* About this App */}
          <CollapsibleSection
            title="About PMx Autonomous Co-pilot"
            subtitle="Fully autonomous, multi-agent pharmacometrics analysis platform"
            icon={Info}
          >
            <div className="p-5 space-y-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900">PMx Autonomous Co-pilot</span> is a production-grade, fully autonomous AI platform purpose-built for end-to-end PK/PD and pharmacometrics analysis. Powered by a coordinated team of six specialised AI agents, it can take a raw dataset and a brief analysis objective and deliver a complete, publication-ready pharmacometrics package — without manual intervention.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    Icon: Sparkles,
                    title: 'End-to-End Autonomous Execution',
                    body: 'The platform autonomously plans, executes, and QCs all analysis phases — from dataset assembly and EDA through modelling, simulation, reporting, and final sign-off. Each step is tracked on a live checklist with full audit trail.',
                  },
                  {
                    Icon: ChartNetwork,
                    title: 'Full PK/PD Modelling Suite',
                    body: 'Supports population PK, PKPD, non-compartmental analysis (NCA), covariate modelling, VPC/NPC diagnostics, PBPK, and QSP workflows. Models are developed in NONMEM, nlmixr2, and PHIKL using industry-standard best practices.',
                  },
                  {
                    Icon: Database,
                    title: 'CDISC-Ready Data Pipeline',
                    body: 'Automatically ingests raw clinical or pre-clinical datasets, runs integrity checks, maps variables to CDISC SDTM/ADaM conventions, flags BQL records, handles missing covariates, and produces clean NONMEM-ready datasets.',
                  },
                  {
                    Icon: ShieldCheck,
                    title: 'Built-In QC & Human Oversight',
                    body: 'Every deliverable is reviewed by the QC Manager agent before acceptance. Human-in-the-Loop (HITL) mode lets you review and approve the analysis plan before each phase executes, giving full control without sacrificing autonomy.',
                  },
                  {
                    Icon: FileBarChart2,
                    title: 'Publication-Quality Outputs',
                    body: 'Produces structured final reports, executive slide decks, parameter estimate tables, diagnostic plots (GOF, VPC, covariate forest plots), and fully annotated R and NONMEM scripts — all stored in an organised project folder structure.',
                  },
                  {
                    Icon: Cpu,
                    title: 'Context-Aware Agent Orchestration',
                    body: 'The Scientist II orchestrator dynamically re-routes tasks between agents based on findings, escalates warnings, resolves inter-agent dependencies, and synthesises all outputs into a unified clinical narrative in real time.',
                  },
                ].map(({ Icon, title, body }) => (
                  <div key={title} className="flex gap-3 bg-white border border-gray-200 rounded-lg p-4">
                    <div className="w-8 h-8 bg-green-50 border border-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={14} className="text-green-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 mb-1">{title}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-xs text-green-800 leading-relaxed">
                  <span className="font-semibold">Get started:</span> Create a new session, provide a compound name and analysis type, optionally upload your dataset, and let the agents do the rest. Use the Demo session to explore a complete, pre-populated analysis example.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          </div>
        </div>

      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !actionLoading && setDeleteTarget(null)} />
          <div className="relative bg-white border border-gray-200 shadow-xl w-full max-w-sm mx-4 p-6 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 bg-red-100 flex items-center justify-center flex-shrink-0 rounded-lg">
                <Trash2 size={16} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Delete Analysis Session</h3>
                <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-5">
              Are you sure you want to delete <span className="font-medium text-gray-900">"{deleteTarget.name}"</span>? All messages, checklist items, and artifacts will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 transition-colors rounded-lg"
              >
                {actionLoading ? 'Deleting...' : 'Delete Session'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 transition-colors rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
