import { useEffect, useRef, useState } from 'react';
import { Loader2, User, ChevronRight, Trash2, ChevronDown, Copy, Check, Save, X, FolderOpen } from 'lucide-react';
import katex from 'katex';
import type { Message, AgentRole } from '../lib/types';
import { AGENT_LABELS, AGENT_AVATAR_COLORS, AGENT_INITIALS, ANALYSIS_SUGGESTIONS, PROJECT_FOLDERS, detectFolder } from '../lib/config';

interface ChatPanelProps {
  messages: Message[];
  loading: boolean;
  activeAgent: AgentRole | null;
  activeAgentTask?: string;
  onSendMessage: (text: string) => void;
  onClearChat?: () => Promise<void>;
  sessionName?: string;
  onSaveArtifact?: (path: string, content: string) => Promise<void>;
}

export default function ChatPanel({
  messages,
  loading,
  activeAgent,
  activeAgentTask,
  onSendMessage,
  onClearChat,
  onSaveArtifact,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [saveTarget, setSaveTarget] = useState<Message | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const val = textareaRef.current?.value.trim() || '';
      if (val && !loading) {
        onSendMessage(val);
        if (textareaRef.current) textareaRef.current.value = '';
        autoResize();
      }
    }
  };

  const autoResize = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  };

  const handleSend = () => {
    const val = textareaRef.current?.value.trim() || '';
    if (val && !loading) {
      onSendMessage(val);
      if (textareaRef.current) textareaRef.current.value = '';
      autoResize();
    }
  };

  const handleClearClick = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setClearing(true);
    setConfirmClear(false);
    try { await onClearChat?.(); } finally { setClearing(false); }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Clear bar — only shown when there are messages */}
      {messages.length > 0 && onClearChat && (
        <div className="flex items-center justify-end px-4 py-1.5 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Clear all messages and agent context?</span>
              <button
                onClick={handleClearClick}
                disabled={clearing}
                className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                {clearing ? 'Clearing...' : 'Yes, clear'}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleClearClick}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
              title="Clear chat history and agent context"
            >
              <Trash2 size={11} />
              Clear chat
            </button>
          )}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestion={onSendMessage} />
        ) : (
          <>
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onSaveRequest={onSaveArtifact ? setSaveTarget : undefined}
              />
            ))}
            {loading && <TypingIndicator agent={activeAgent} label={activeAgentTask} />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Active agent banner */}
      {loading && activeAgent && (
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex items-center gap-2">
          <div className={`w-5 h-5 text-xs font-bold flex items-center justify-center text-white flex-shrink-0 ${AGENT_AVATAR_COLORS[activeAgent]}`}>
            {AGENT_INITIALS[activeAgent]}
          </div>
          <span className="text-xs text-gray-500">{AGENT_LABELS[activeAgent]}</span>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="text-xs text-gray-400">{activeAgentTask || 'Working...'}</span>
          <Loader2 size={12} className="text-green-600 animate-spin ml-auto" />
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-white border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 resize-none transition-colors rounded-xl"
            placeholder="Ask Scientist II anything about pharmacometrics analysis... (Enter to send)"
            rows={1}
            onChange={autoResize}
            onKeyDown={handleKey}
            disabled={loading}
            style={{ minHeight: 44, maxHeight: 160 }}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="w-10 h-10 flex-shrink-0 bg-green-700 hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors rounded-xl"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">Shift+Enter for new line · Scientist II routes all requests through specialized agents</p>
      </div>

      {/* Save-to-files modal */}
      {saveTarget && onSaveArtifact && (
        <SaveFileModal
          message={saveTarget}
          onSave={async (path, content) => {
            await onSaveArtifact(path, content);
            setSaveTarget(null);
          }}
          onClose={() => setSaveTarget(null)}
        />
      )}
    </div>
  );
}

function WelcomeScreen({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
      <div className="w-16 h-16 bg-green-700 flex items-center justify-center mb-5 rounded-2xl">
        <span className="text-2xl font-bold text-white">Px</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Scientist II</h2>
      <p className="text-gray-500 text-sm mb-1 max-w-sm">Multi-Agent Pharmacometrics Orchestrator</p>
      <p className="text-gray-400 text-xs mb-6 max-w-xs">
        All requests route through me. I delegate to specialized agents: Data Manager, Pharmacometrician, Medical Writer, and QC Manager.
      </p>
      <div className="grid grid-cols-1 gap-2 w-full max-w-md">
        {ANALYSIS_SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="text-left text-xs bg-gray-50 hover:bg-gray-100 px-4 py-2.5 text-gray-600 transition-all rounded-lg"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onSaveRequest,
}: {
  message: Message;
  onSaveRequest?: (msg: Message) => void;
}) {
  const isUser = message.role === 'user';
  const agent = message.agent as AgentRole | undefined;
  const isDispatch = message.metadata?.type === 'dispatch';
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const avatarBg = agent ? AGENT_AVATAR_COLORS[agent] : 'bg-green-700';
  const initials = agent ? AGENT_INITIALS[agent] : 'SII';
  const label = agent ? AGENT_LABELS[agent] : 'Scientist II';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
        isUser ? 'bg-gray-400' : avatarBg
      }`}>
        {isUser ? <User size={14} /> : initials}
      </div>

      {/* Content */}
      <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end flex flex-col' : 'flex-1 min-w-0'}`}>
        {!isUser && (
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs text-gray-400">{label}</span>
            {/* Action buttons — visible on hover for non-dispatch assistant messages */}
            {!isDispatch && hovered && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  title="Copy to clipboard"
                  className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all rounded"
                >
                  {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {onSaveRequest && (
                  <button
                    onClick={() => onSaveRequest(message)}
                    title="Save to Files"
                    className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 hover:text-green-700 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all rounded"
                  >
                    <Save size={11} />
                    <span>Save to Files</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {isDispatch ? (
          <DispatchCard message={message} />
        ) : (
          <div className={`px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-green-700 text-white rounded-2xl rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
          }`}>
            <MarkdownContent content={message.content} isUser={isUser} />
          </div>
        )}
        <div className={`text-xs text-gray-400 px-1 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40);
}

function SaveFileModal({
  message,
  onSave,
  onClose,
}: {
  message: Message;
  onSave: (path: string, content: string) => Promise<void>;
  onClose: () => void;
}) {
  const agent = message.agent as AgentRole | undefined;
  const defaultName = slugify(message.content.replace(/#+\s+/, '').slice(0, 60)) || 'response';
  const [fileName, setFileName] = useState(defaultName);
  const [ext, setExt] = useState('.md');
  const [folder, setFolder] = useState(() => detectFolder('.md'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleExtChange = (newExt: string) => {
    setExt(newExt);
    setFolder(detectFolder(newExt));
  };

  const fullPath = `${folder}/${fileName}${ext}`;

  const handleSave = async () => {
    const name = fileName.trim();
    if (!name) { setError('File name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(fullPath, message.content);
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  };

  const extensions = ['.md', '.txt', '.docx', '.R', '.py', '.jl', '.cpp', '.ctl', '.csv', '.xls', '.xlsx', '.json', '.yaml'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white shadow-xl w-full max-w-md mx-4 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FolderOpen size={15} className="text-green-700" />
            <span className="text-sm font-semibold text-gray-900">Save to Files</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Source info */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            Saving response from <span className="font-medium text-gray-700">{agent ? AGENT_LABELS[agent] : 'Scientist II'}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate italic">
            "{message.content.replace(/\n/g, ' ').slice(0, 80)}..."
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Folder selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Destination folder</label>
            <div className="relative">
              <select
                value={folder}
                onChange={e => setFolder(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 px-3 py-2 pr-8 text-sm text-gray-800 focus:outline-none focus:border-green-600 transition-colors rounded-lg"
              >
                {PROJECT_FOLDERS.map(f => (
                  <option key={f} value={f}>{f}/</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* File name + extension */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">File name</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                className="flex-1 bg-white border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-green-600 transition-colors font-mono rounded-lg"
                placeholder="file_name"
                autoFocus
              />
              <div className="relative">
                <select
                  value={ext}
                  onChange={e => handleExtChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 px-3 py-2 pr-6 text-sm text-gray-600 focus:outline-none focus:border-green-600 transition-colors font-mono rounded-lg"
                >
                  {extensions.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Full path preview */}
          <div className="bg-gray-50 border border-gray-200 px-3 py-2">
            <p className="text-xs text-gray-400 mb-0.5">Full path</p>
            <p className="text-xs font-mono text-gray-700 break-all">{fullPath}</p>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-colors bg-white rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !fileName.trim()}
            className="px-4 py-2 text-xs font-medium bg-green-700 hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1.5 rounded-lg"
          >
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
            {saving ? 'Saving...' : 'Save file'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DispatchCard({ message }: { message: Message }) {
  const [showSystem, setShowSystem] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const systemPrompt = message.metadata?.systemPrompt as string | undefined;
  const userPrompt = message.metadata?.userPrompt as string | undefined;

  return (
    <div className="bg-gray-50 text-sm leading-relaxed overflow-hidden rounded-xl" style={{ minWidth: 280 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <MarkdownContent content={message.content} isUser={false} />
      </div>

      {/* Collapsible prompt sections */}
      {(systemPrompt || userPrompt) && (
        <div className="divide-y divide-gray-200">
          {systemPrompt && (
            <CollapsiblePrompt
              label="System Prompt"
              content={systemPrompt}
              open={showSystem}
              onToggle={() => setShowSystem(v => !v)}
            />
          )}
          {userPrompt && (
            <CollapsiblePrompt
              label="User Prompt"
              content={userPrompt}
              open={showUser}
              onToggle={() => setShowUser(v => !v)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CollapsiblePrompt({
  label, content, open, onToggle,
}: { label: string; content: string; open: boolean; onToggle: () => void }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          {label}
        </span>
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-3 pt-0.5 bg-white border-t border-gray-100">
          <pre className="text-xs font-mono text-gray-600 leading-relaxed whitespace-pre-wrap break-words overflow-x-auto max-h-64 bg-gray-50 border border-gray-200 rounded p-3">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}

function TypingIndicator({ agent, label }: { agent: AgentRole | null; label?: string }) {
  const avatarBg = agent ? AGENT_AVATAR_COLORS[agent] : 'bg-green-700';
  const initials = agent ? AGENT_INITIALS[agent] : 'SII';

  return (
    <div className="flex gap-3">
      <div className={`w-8 h-8 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarBg}`}>
        {initials}
      </div>
      <div className="space-y-1">
        {label && <div className="text-xs text-gray-400 px-1">{label}</div>}
        <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
          <span className="w-2 h-2 bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function renderLatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, { displayMode, throwOnError: false, output: 'html' });
  } catch {
    return latex;
  }
}

function isTableLine(line: string) {
  return line.trim().startsWith('|') && line.trim().endsWith('|');
}

function isSeparatorLine(line: string) {
  return /^\|[\s|:-]+\|$/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  return line.trim().slice(1, -1).split('|').map(c => c.trim());
}

function MarkdownContent({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={key++} className={`my-3 rounded-lg overflow-hidden border ${isUser ? 'border-green-600/40' : 'border-gray-200'}`}>
          {lang && (
            <div className={`px-3 py-1.5 text-xs font-mono font-medium ${isUser ? 'bg-green-800/60 text-green-200' : 'bg-gray-100 text-gray-500'}`}>
              {lang}
            </div>
          )}
          <pre className={`p-3 overflow-x-auto ${isUser ? 'bg-green-900/30' : 'bg-gray-50'}`}>
            <code className={`text-xs font-mono leading-relaxed ${isUser ? 'text-green-100' : 'text-gray-700'}`}>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // Display math block $$...$$
    if (line.trim() === '$$') {
      const mathLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '$$') {
        mathLines.push(lines[i]);
        i++;
      }
      const html = renderLatex(mathLines.join('\n'), true);
      elements.push(
        <div key={key++} className="my-3 overflow-x-auto text-center py-2" dangerouslySetInnerHTML={{ __html: html }} />
      );
      i++;
      continue;
    }

    // Inline display math $$ on a single line: $$...$$
    if (line.trim().startsWith('$$') && line.trim().endsWith('$$') && line.trim().length > 4) {
      const math = line.trim().slice(2, -2);
      const html = renderLatex(math, true);
      elements.push(
        <div key={key++} className="my-3 overflow-x-auto text-center py-2" dangerouslySetInnerHTML={{ __html: html }} />
      );
      i++;
      continue;
    }

    // Table detection
    if (isTableLine(line)) {
      const tableRows: string[][] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        if (!isSeparatorLine(lines[i])) {
          tableRows.push(parseTableRow(lines[i]));
        }
        i++;
      }
      if (tableRows.length > 0) {
        const [headers, ...rows] = tableRows;
        elements.push(
          <div key={key++} className="my-3 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {headers.map((h, hi) => (
                    <th key={hi} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                      {inlineFormat(h, false)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-gray-700 border-b border-gray-100 last:border-b-0">
                        {inlineFormat(cell, false)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Headings (#### down to #)
    const headingMatch = line.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const headingStyles: Record<number, string> = {
        1: `text-base font-bold mt-4 mb-2 pb-1 border-b ${isUser ? 'text-white border-green-500/30' : 'text-gray-900 border-gray-200'}`,
        2: `text-sm font-bold mt-3 mb-1.5 ${isUser ? 'text-white' : 'text-green-800'}`,
        3: `text-sm font-semibold mt-3 mb-1 ${isUser ? 'text-green-100' : 'text-gray-800'}`,
        4: `text-xs font-semibold uppercase tracking-wide mt-2.5 mb-1 ${isUser ? 'text-green-200' : 'text-gray-500'}`,
      };
      elements.push(
        <div key={key++} className={headingStyles[level]}>
          {inlineFormat(text, isUser)}
        </div>
      );
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        listItems.push(lines[i].replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={key++} className="my-1.5 space-y-0.5 pl-1">
          {listItems.map((item, li) => (
            <li key={li} className="flex gap-2">
              <span className={`flex-shrink-0 mt-1.5 w-1 h-1 rounded-full ${isUser ? 'bg-green-300' : 'bg-green-600'}`} />
              <span className="leading-relaxed">{inlineFormat(item, isUser)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s/)) {
      const listItems: Array<{ n: string; text: string }> = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        const m = lines[i].match(/^(\d+)\.\s(.*)/);
        if (m) listItems.push({ n: m[1], text: m[2] });
        i++;
      }
      elements.push(
        <ol key={key++} className="my-1.5 space-y-0.5 pl-1">
          {listItems.map((item, li) => (
            <li key={li} className="flex gap-2">
              <span className={`flex-shrink-0 font-mono text-xs pt-0.5 min-w-[1.25rem] ${isUser ? 'text-green-200' : 'text-green-700'}`}>{item.n}.</span>
              <span className="leading-relaxed">{inlineFormat(item.text, isUser)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={key++} className={`border-l-2 pl-3 my-1.5 text-xs italic ${isUser ? 'border-green-400 text-green-100' : 'border-green-500 text-gray-500 bg-gray-50 py-1 pr-2 rounded-r'}`}>
          {inlineFormat(line.slice(2), isUser)}
        </blockquote>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={key++} className={`my-3 ${isUser ? 'border-green-500/30' : 'border-gray-200'}`} />);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1.5" />);
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={key++} className="my-0.5 leading-relaxed">
        {inlineFormat(line, isUser)}
      </p>
    );
    i++;
  }

  return <div className="text-sm">{elements}</div>;
}

function inlineFormat(text: string, isUser: boolean): React.ReactNode {
  // Split on bold, italic, inline-code, strikethrough, and inline math $...$
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\$[^$\n]+\$)/g);
  return parts.map((part, i) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className={`font-mono text-xs px-1.5 py-0.5 rounded ${isUser ? 'bg-green-800 text-green-100' : 'bg-slate-100 text-green-700 border border-slate-200'}`}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if ((part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) ||
        (part.startsWith('_') && part.endsWith('_') && !part.startsWith('__'))) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <s key={i} className="line-through opacity-60">{part.slice(2, -2)}</s>;
    }
    // Inline math $...$
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const math = part.slice(1, -1);
      const html = renderLatex(math, false);
      return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return part;
  });
}
