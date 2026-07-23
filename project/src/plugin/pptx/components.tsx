
import React, { useState, useEffect, useRef } from 'react';
import {
  X, Trash2, CheckCircle2,
  ChevronDown,
  BookOpen, Monitor, Minus, Plus,
  Indent, Outdent, ArrowUpFromLine, ArrowDownFromLine,
  HelpCircle,
  FileText, FileDigit, FileCode,
  PanelLeftClose, PanelLeftOpen,
  Save, Check,
} from 'lucide-react';
import type { 
    ToolbarButtonType, 
    ToolbarColorPickerType, 
    ToolbarSymbolsDropdownType, 
    ToolbarParagraphDropdownType,
    OutlineItem, 
    CommentType,
    ReplyType
} from '../docx/types';
import { FONT_FAMILIES, FONT_SIZES, SYMBOLS, TOOLBAR_CONFIG } from './constants';
import {
  Paintbrush, Bold, Italic, Underline, Strikethrough, Superscript, Subscript,
  RemoveFormatting, Image, Palette, Highlighter, MessageSquarePlus, AlignLeft,
  AlignCenter, AlignRight, AlignJustify, List, ListOrdered, PanelLeft, RectangleHorizontal,
  Sigma, Pilcrow, Search, Undo, Redo, Printer
} from 'lucide-react';

export const ToolbarSeparator: React.FC = () => <div className="h-5 w-px bg-gray-300 mx-1"></div>;

export const ToolbarButton: React.FC<{ item: ToolbarButtonType; onClick: () => void; disabled?: boolean }> = ({ item, onClick, disabled }) => {
  const Icon = item.icon;
  return (
    <button title={item.tooltip} onClick={onClick} disabled={disabled} className="p-2 rounded hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed">
      <Icon className="w-4 h-4 text-gray-700" />
    </button>
  );
};

export const FontFamilyDropdown: React.FC<{ onCommand: (a: string, v: string) => void }> = ({ onCommand }) => (
  <select title="Font Family" onChange={(e) => onCommand('fontName', e.target.value)} className="text-sm border border-gray-300 rounded-sm px-1 py-0.5 mx-1 h-7 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent" defaultValue="Arial">
    {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
  </select>
);

export const FontSizeDropdown: React.FC<{ onCommand: (a: string, v: string) => void }> = ({ onCommand }) => (
  <select title="Font Size" onChange={(e) => onCommand('fontSize', e.target.value)} className="text-sm border border-gray-300 rounded-sm px-1 py-0.5 mx-1 h-7 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent" defaultValue="11">
    {FONT_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
  </select>
);

export const ToolbarColorPicker: React.FC<{ item: ToolbarColorPickerType; onCommand: (a: string, v: string) => void; disabled?: boolean }> = ({ item, onCommand, disabled }) => {
  const Icon = item.icon;
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative inline-flex items-center">
      <button title={item.tooltip} onClick={() => ref.current?.click()} disabled={disabled} className="p-2 rounded hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed">
        <Icon className="w-4 h-4 text-gray-700" />
      </button>
      <input type="color" ref={ref} onChange={(e) => onCommand(item.action, e.target.value)} disabled={disabled} className="absolute top-0 left-0 w-0 h-0 opacity-0" />
    </div>
  );
};

const HEADING_OPTIONS = [
  { value: 'p', label: 'Normal Text' }, { value: 'h1', label: 'Heading 1' }, { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' }, { value: 'h4', label: 'Heading 4' }, { value: 'h5', label: 'Heading 5' }, { value: 'h6', label: 'Heading 6' },
];

export const HeadingDropdown: React.FC<{ onCommand: (a: string, v: string) => void }> = ({ onCommand }) => {
  const [tag, setTag] = useState('p');
  useEffect(() => {
    const handler = () => setTimeout(() => {
      const current = document.queryCommandValue('formatBlock');
      setTag(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(current) ? current : 'p');
    }, 10);
    document.addEventListener('selectionchange', handler);
    document.addEventListener('mouseup', handler);
    return () => {
      document.removeEventListener('selectionchange', handler);
      document.removeEventListener('mouseup', handler);
    };
  }, []);
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCommand('formatBlock', `<${e.target.value}>`);
    setTag(e.target.value);
  };
  return (
    <select title="Styles" onChange={handleChange} value={tag} className="text-sm border border-gray-300 rounded-sm px-1 py-0.5 mx-1 h-7 w-32 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent">
      {HEADING_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
};

export const SymbolsDropdown: React.FC<{ item: ToolbarSymbolsDropdownType, onCommand: (a: string, v: string) => void; disabled?: boolean }> = ({ item, onCommand, disabled }) => {
  const Icon = item.icon;
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const handleClick = (symbol: string) => { onCommand(item.action, symbol); setIsOpen(false); };
  return (
    <div className="relative" ref={ref}>
      <button title={item.tooltip} onClick={() => setIsOpen(!isOpen)} disabled={disabled} className="p-2 rounded hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed">
        <Icon className="w-4 h-4 text-gray-700" />
      </button>
      {isOpen && <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-300 rounded-md shadow-lg z-20 p-2">
        <div className="grid grid-cols-10 gap-1">
          {SYMBOLS.map((s) => <button key={s} onClick={() => handleClick(s)} title={`Insert symbol: ${s}`} className="flex items-center justify-center w-full h-8 text-lg rounded hover:bg-gray-200 focus:outline-none focus:bg-blue-100">{s}</button>)}
        </div>
      </div>}
    </div>
  );
};

const LINE_SPACING_OPTIONS = [{ label: 'Single', value: '1' }, { label: '1.15', value: '1.15' }, { label: '1.5', value: '1.5' }, { label: 'Double', value: '2' }, { label: '2.5', value: '2.5' }, { label: '3.0', value: '3.0' }];
export const ParagraphDropdown: React.FC<{ item: ToolbarParagraphDropdownType; onCommand: (a: string, v?: string) => void; disabled?: boolean }> = ({ item, onCommand, disabled }) => {
  const Icon = item.icon;
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const handleCommand = (action: string, value?: string) => {
    onCommand(action, value);
    if (!['indent', 'outdent', 'addSpaceBefore', 'addSpaceAfter'].includes(action)) setIsOpen(false);
  };
  return (
    <div className="relative" ref={ref}>
      <button title={item.tooltip} onClick={() => setIsOpen(!isOpen)} disabled={disabled} className="p-2 rounded hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed">
        <Icon className="w-4 h-4 text-gray-700" />
      </button>
      {isOpen && <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-20 p-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Indentation</span>
          <div className="flex items-center space-x-1">
            <button onClick={() => handleCommand('outdent')} title="Decrease Indent" className="p-1.5 rounded hover:bg-gray-200"><Outdent size={16} className="text-gray-700" /></button>
            <button onClick={() => handleCommand('indent')} title="Increase Indent" className="p-1.5 rounded hover:bg-gray-200"><Indent size={16} className="text-gray-700" /></button>
          </div>
        </div>
        <div className="border-t border-gray-200 -mx-2"></div>
        <div>
          <span className="text-sm text-gray-700 block mb-1">Line Spacing</span>
          {LINE_SPACING_OPTIONS.map(opt => <button key={opt.value} onClick={() => handleCommand('lineHeight', opt.value)} className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-gray-100">{opt.label}</button>)}
        </div>
        <div className="border-t border-gray-200 -mx-2"></div>
        <div>
          <span className="text-sm text-gray-700 block mb-1">Paragraph Spacing</span>
          <button onClick={() => handleCommand('addSpaceBefore')} className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-gray-100 flex items-center space-x-2"><ArrowUpFromLine size={16} className="text-gray-600" /><span>Add Space Before Paragraph</span></button>
          <button onClick={() => handleCommand('addSpaceAfter')} className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-gray-100 flex items-center space-x-2"><ArrowDownFromLine size={16} className="text-gray-600" /><span>Add Space After Paragraph</span></button>
        </div>
      </div>}
    </div>
  );
};

export const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-semibold text-gray-800">Application Help</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button></div>
        <div className="p-6 overflow-y-auto space-y-6 text-gray-700">
          <section><h3 className="text-lg font-semibold mb-2">Getting Started</h3><p>Welcome to the React Word Processor! This application provides a rich text editing experience with modern features. Simply click on the document page and start typing to edit the content.</p></section>
          <section><h3 className="text-lg font-semibold mb-2">The Toolbar</h3><p>The toolbar located below the header contains all the essential formatting tools:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Undo/Redo & Print:</strong> Standard document actions.</li>
              <li><strong>Document Outline & Orientation:</strong> Toggle the navigation outline or switch between Portrait and Landscape page layouts.</li>
              <li><strong>Font & Size:</strong> Change the font family and size using the dropdowns.</li>
              <li><strong>Headings:</strong> Apply heading styles (Heading 1, 2, etc.) to structure your document.</li>
              <li><strong>Text Formatting:</strong> Apply <strong>Bold</strong>, <em>Italic</em>, <u>Underline</u>, and other text styles. You can also change text and highlight colors.</li>
              <li><strong>Comments & Images:</strong> Select text to add a comment or click to insert an image from your computer.</li>
              <li><strong>Alignment & Paragraph:</strong> Align your text and access paragraph settings like line spacing and indentation.</li>
              <li><strong>Lists:</strong> Create bulleted or numbered lists.</li>
            </ul>
          </section>
          <section><h3 className="text-lg font-semibold mb-2">Commenting</h3><p>Collaborate using comments:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Select a piece of text in the document.</li><li>Click the "Add Comment" icon in the toolbar.</li>
              <li>The comments sidebar will open, allowing you to write your comment.</li><li>You can reply to, resolve, or delete comment threads from the sidebar.</li>
            </ol>
          </section>
          <section><h3 className="text-lg font-semibold mb-2">Exporting Your Document</h3><p>You can export your document in various formats using the icons in the top-right corner of the header:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>DOCX:</strong> For Microsoft Word compatibility.</li><li><strong>PDF:</strong> For easy sharing and printing.</li><li><strong>MD:</strong> For a plain text Markdown version.</li>
            </ul>
          </section>
          <section><h3 className="text-lg font-semibold mb-2">Status Bar</h3><p>The status bar at the bottom provides useful information and controls:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Page & Word Count:</strong> Keep track of your document's length. Shows selection info when text is selected.</li>
              <li><strong>Page View:</strong> Switch between a single page or a two-page spread layout.</li>
              <li><strong>Zoom Controls:</strong> Use the slider or buttons to zoom in and out of the document.</li>
            </ul>
          </section>
        </div>
        <div className="p-4 border-t bg-gray-50 text-right"><button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Close</button></div>
      </div>
    </div>
  );
};

export type FindState = { term: string; replaceTerm: string; matchCase: boolean; wholeWord: boolean; resultsCount: number; currentIndex: number };
interface FindReplaceModalProps { isOpen: boolean; onClose: () => void; findState: FindState; onStateChange: (s: Partial<FindState>) => void; onFindNext: () => void; onReplace: () => void; onReplaceAll: () => void; }
export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({ isOpen, onClose, findState, onStateChange, onFindNext, onReplace, onReplaceAll }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (isOpen) { if (e.key === 'Escape') onClose(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onFindNext(); } } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, onFindNext]);
  if (!isOpen) return null;
  return (
    <div className="fixed top-20 right-4 bg-white rounded-lg shadow-2xl w-96 z-40 border border-gray-300" aria-modal="true" role="dialog">
      <div className="flex justify-between items-center p-3 border-b border-gray-200"><h2 className="text-md font-semibold text-gray-800">Find and Replace</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={18} /></button></div>
      <div className="p-4 space-y-4">
        <input type="text" placeholder="Find" value={findState.term} onChange={(e) => onStateChange({ term: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
        <input type="text" placeholder="Replace with" value={findState.replaceTerm} onChange={(e) => onStateChange({ replaceTerm: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer"><input type="checkbox" checked={findState.matchCase} onChange={(e) => onStateChange({ matchCase: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span>Match case</span></label>
            <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer"><input type="checkbox" checked={findState.wholeWord} onChange={(e) => onStateChange({ wholeWord: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span>Whole word</span></label>
          </div>
          <div className="text-sm text-gray-500">{findState.resultsCount > 0 ? `${findState.currentIndex + 1} of ${findState.resultsCount}` : 'No results'}</div>
        </div>
      </div>
      <div className="flex justify-end items-center p-3 border-t border-gray-200 bg-gray-50 space-x-2">
        <button onClick={onReplaceAll} disabled={!findState.term} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Replace All</button>
        <button onClick={onReplace} disabled={findState.currentIndex === -1} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Replace</button>
        <button onClick={onFindNext} disabled={!findState.term} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">Find Next</button>
      </div>
    </div>
  );
};

export const OutlineSidebar: React.FC<{ isOpen: boolean; items: OutlineItem[]; onClose: () => void; onNavigate: (id: string) => void }> = ({ isOpen, items, onClose, onNavigate }) => (
  <aside className={`flex flex-col bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0'}`} style={{ transitionProperty: 'width' }}>
    <div className={`flex-shrink-0 flex items-center justify-between p-2 border-b border-gray-200 ${!isOpen && 'hidden'}`}>
      <h2 className="font-semibold text-gray-800">Document Outline</h2>
      <button onClick={onClose} title="Close Outline" className="p-1 rounded-full hover:bg-gray-200"><X size={18} className="text-gray-600" /></button>
    </div>
    <nav className={`flex-grow overflow-y-auto overflow-x-hidden ${!isOpen && 'hidden'}`}>
      {items.length > 0 ? <ul>{items.map(item => <li key={item.id}><button onClick={() => onNavigate(item.id)} title={item.text} className={`w-full text-left py-2 pr-2 truncate text-gray-700 hover:bg-gray-200 focus:outline-none focus:bg-blue-100 pl-${item.level * 4 - 2}`}>{item.text}</button></li>)}</ul>
        : <div className="p-4 text-center text-gray-500">No headings found.</div>}
    </nav>
  </aside>
);

interface CommentsSidebarProps { isOpen: boolean; comments: CommentType[]; selectedCommentId: string | null; onClose: () => void; onSelectComment: (id: string | null) => void; onUpdateComment: (id: string, t: string) => void; onDeleteComment: (id: string) => void; onReplyToComment: (id: string, t: string) => void; onResolveComment: (id: string) => void; onDeleteReply: (cId: string, rId: string) => void; }
export const CommentsSidebar: React.FC<CommentsSidebarProps> = ({ isOpen, comments, selectedCommentId, onClose, onSelectComment, onUpdateComment, onDeleteComment, onReplyToComment, onResolveComment, onDeleteReply }) => {
  const [replyText, setReplyText] = useState('');
  const timeAgo = (ts: string) => { const s = Math.floor((new Date().getTime() - new Date(ts).getTime()) / 1000); if (s < 60) return "just now"; const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; };
  const handleReplySubmit = (id: string) => { if (replyText.trim()) { onReplyToComment(id, replyText); setReplyText(''); } };
  const sortedComments = [...comments].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return (
    <aside className={`flex flex-col bg-gray-50 border-l border-gray-200 transition-all duration-300 ease-in-out ${isOpen ? 'w-80' : 'w-0'}`} style={{ transitionProperty: 'width' }}>
      <div className={`flex-shrink-0 flex items-center justify-between p-2 border-b border-gray-200 ${!isOpen && 'hidden'}`}><h2 className="font-semibold text-gray-800">Comments</h2><button onClick={onClose} title="Close Comments" className="p-1 rounded-full hover:bg-gray-200"><X size={18} className="text-gray-600" /></button></div>
      <div className={`flex-grow overflow-y-auto overflow-x-hidden p-2 space-y-3 ${!isOpen && 'hidden'}`}>
        {sortedComments.length > 0 ? sortedComments.map(c => <div key={c.id} onClick={() => onSelectComment(c.id)} className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${selectedCommentId === c.id ? 'border-blue-400 bg-white' : 'border-gray-200 bg-white hover:border-gray-300'} ${c.resolved ? 'opacity-60 bg-gray-100' : ''}`}>
          <div className="flex justify-between items-start">
            <div className="flex-grow"><span className="font-semibold text-gray-800 text-xs">{c.author}</span><span className="text-gray-500 text-xs ml-2">{timeAgo(c.timestamp)}</span></div>
            <div className="flex items-center space-x-1">
              <button onClick={(e) => { e.stopPropagation(); onResolveComment(c.id); }} title={c.resolved ? 'Reopen' : 'Resolve'} className="p-1 text-gray-400 hover:text-green-500 rounded-full hover:bg-green-100"><CheckCircle2 size={16} className={c.resolved ? 'text-green-600' : ''} /></button>
              <button onClick={(e) => { e.stopPropagation(); onDeleteComment(c.id); }} title="Delete thread" className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100"><Trash2 size={14} /></button>
            </div>
          </div>
          <textarea value={c.text} onChange={(e) => onUpdateComment(c.id, e.target.value)} placeholder="Add a comment..." className="w-full mt-1 p-1.5 text-sm text-gray-800 bg-transparent border border-transparent rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-400 focus:bg-white resize-none" />
          <div className="mt-2 space-y-2">{c.replies.map((r: ReplyType) => <div key={r.id} className="pl-4 border-l-2 border-gray-200">
            <div className="flex justify-between items-start"><div className="flex-grow"><span className="font-semibold text-gray-800 text-xs">{r.author}</span><span className="text-gray-500 text-xs ml-2">{timeAgo(r.timestamp)}</span></div><button onClick={(e) => { e.stopPropagation(); onDeleteReply(c.id, r.id); }} title="Delete reply" className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100"><Trash2 size={12} /></button></div>
            <p className="text-sm text-gray-700 mt-1">{r.text}</p>
          </div>)}</div>
          <div className="mt-3"><div className="flex items-start space-x-2">
            <textarea value={selectedCommentId === c.id ? replyText : ''} onChange={(e) => setReplyText(e.target.value)} onFocus={() => onSelectComment(c.id)} placeholder="Reply..." rows={1} className="flex-grow p-1.5 text-sm text-gray-700 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
            <button onClick={(e) => { e.stopPropagation(); handleReplySubmit(c.id); }} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300" disabled={!replyText.trim()}>Reply</button>
          </div></div>
        </div>) : <div className="p-4 text-center text-gray-500">Select text and click the comment icon to start a conversation.</div>}
      </div>
    </aside>
  );
};

interface StatusBarProps { wordCount: number; pageCount: number; zoom: number; setZoom: (z: number) => void; pageView: 'single' | 'double'; setPageView: (v: 'single' | 'double') => void; selectionInfo: { page: number | null; words: number | null }; }
export const StatusBar: React.FC<StatusBarProps> = ({ wordCount, pageCount, zoom, setZoom, pageView, setPageView, selectionInfo }) => (
  <div className="h-6 bg-gray-100 border-t border-gray-300 flex items-center justify-between px-4 py-4 text-xs text-gray-700 select-none">
    <div className="flex items-center space-x-4">
      <span>{selectionInfo.page !== null ? `Page ${selectionInfo.page} of ${pageCount}` : `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`}</span>
      <span>{selectionInfo.words !== null ? `${selectionInfo.words} of ${wordCount} words` : `${wordCount} words`}</span>
    </div>
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Monitor size={16} className={`cursor-pointer ${pageView === 'single' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => setPageView('single')}><title>Single Page View</title></Monitor>
        <BookOpen size={16} className={`cursor-pointer ${pageView === 'double' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => setPageView('double')}><title>Two Page View</title></BookOpen>
      </div>
      <div className="flex items-center space-x-2">
        <Minus size={16} className="cursor-pointer" onClick={() => setZoom(Math.max(50, zoom - 10))} />
        <input type="range" min="50" max="200" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
        <Plus size={16} className="cursor-pointer" onClick={() => setZoom(Math.min(200, zoom + 10))} />
        <span className="w-10 text-center">{zoom}%</span>
      </div>
    </div>
  </div>
);

export const Header: React.FC<{
  fileName: string;
  fileSize: string;
  lastEdited: string;
  onExport: (f: 'docx' | 'pdf' | 'md') => void;
  onHelp: () => void;
  onSave: () => void;
  showSaved: boolean;
  isFilePanelVisible: boolean;
  onToggleFilePanel: () => void;
}> = ({ fileName, fileSize, lastEdited, onExport, onHelp, onSave, showSaved, isFilePanelVisible, onToggleFilePanel }) => (
  <div className="h-10 px-4 flex justify-between items-center bg-[#2a579a] text-white">
    <div className="flex items-center space-x-3 text-sm">
      <button
        onClick={onToggleFilePanel}
        className="p-1.5 rounded-full text-gray-200 hover:bg-white/20 transition-colors"
        title={isFilePanelVisible ? 'Hide File Explorer' : 'Show File Explorer'}
      >
        {isFilePanelVisible ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
      </button>
      <span className="font-semibold text-lg text-white">{fileName}</span>
      <span className="text-gray-300">{fileSize}</span>
      <span className="text-gray-300">|</span>
      <span className="text-gray-300">Last edited: {lastEdited}</span>
    </div>
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        {showSaved && (
          <div className="text-sm font-medium text-white flex items-center space-x-1 pr-2 animate-fade-in">
            <Check size={16} />
            <span>Saved</span>
          </div>
        )}
        <button onClick={onSave} title="Save (Ctrl+S)" className="p-2 rounded-full hover:bg-white/20 transition-colors">
          <Save size={18} />
        </button>
      </div>
      <div className="h-5 w-px bg-white/30 mx-1"></div>
      <button onClick={onHelp} title="Help" className="p-2 rounded-full hover:bg-white/20 transition-colors"><HelpCircle size={18} /></button>
      <div className="h-5 w-px bg-white/30 mx-1"></div>
      <button onClick={() => onExport('docx')} title="Download as .docx" className="p-2 rounded-full hover:bg-white/20 transition-colors"><FileText size={18} /></button>
      <button onClick={() => onExport('pdf')} title="Download as .pdf" className="p-2 rounded-full hover:bg-white/20 transition-colors"><FileDigit size={18} /></button>
      <button onClick={() => onExport('md')} title="Download as .md" className="p-2 rounded-full hover:bg-white/20 transition-colors"><FileCode size={18} /></button>
    </div>
  </div>
);

export const Toolbar: React.FC<{ onCommand: (a: string, v?: string) => void; canUndo: boolean; canRedo: boolean }> = ({ onCommand, canUndo, canRedo }) => (
  <div className="h-10 px-2 flex items-center space-x-1 border-t border-b border-gray-200 bg-gray-50 overflow-x-auto">
    {TOOLBAR_CONFIG.map((item, index) => {
      switch (item.type) {
        case 'separator': return <ToolbarSeparator key={index} />;
        case 'font-family-dropdown': return <FontFamilyDropdown key={index} onCommand={onCommand} />;
        case 'font-size-dropdown': return <FontSizeDropdown key={index} onCommand={onCommand} />;
        case 'heading-dropdown': return <HeadingDropdown key={index} onCommand={onCommand} />;
        case 'color-picker': return <ToolbarColorPicker key={index} item={item} onCommand={onCommand} />;
        case 'symbols-dropdown': return <SymbolsDropdown key={index} item={item} onCommand={onCommand} />;
        case 'paragraph-dropdown': return <ParagraphDropdown key={index} item={item} onCommand={onCommand} />;
        case 'button':
          const isDisabled = (item.action === 'undo' && !canUndo) || (item.action === 'redo' && !canRedo) || (item.action === 'formatPainter');
          return <ToolbarButton key={index} item={item} onClick={() => onCommand(item.action)} disabled={isDisabled} />;
        default: return null;
      }
    })}
  </div>
);

export const EditablePage = React.memo<{ index: number; content: string; onContentChange: (i: number, c: string) => void; orientation: 'portrait' | 'landscape'; pageCount: number }>(
  ({ index, content, onContentChange, orientation, pageCount }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { if (ref.current && ref.current.innerHTML !== content) ref.current.innerHTML = content; }, [content]);
    const handleInput = (e: React.FormEvent<HTMLDivElement>) => onContentChange(index, e.currentTarget.innerHTML);
    return (
      <div className="bg-white shadow-lg relative" style={{ width: orientation === 'portrait' ? '8.5in' : '11in', minHeight: orientation === 'portrait' ? '11in' : '8.5in' }}>
        <div ref={ref} contentEditable onInput={handleInput} className="outline-none" data-page-index={index} style={{ padding: '1in', paddingBottom: '0.5in', boxSizing: 'border-box', minHeight: orientation === 'portrait' ? '11in' : '8.5in' }} dangerouslySetInnerHTML={{ __html: content }} />
        <div contentEditable={false} className="absolute bottom-0 left-0 right-0 flex justify-center items-center text-gray-500 text-xs" style={{ height: '0.5in' }}>{index + 1}</div>
      </div>
    );
  },
  (prev, next) => prev.orientation === next.orientation && prev.index === next.index && prev.pageCount === next.pageCount && prev.content === next.content
);

export const WorkArea = React.memo(React.forwardRef<HTMLDivElement, { pages: string[]; onContentChange: (i: number, c: string) => void; zoom: number; orientation: 'portrait' | 'landscape'; pageView: 'single' | 'double' }>(
  ({ pages, onContentChange, zoom, orientation, pageView }, ref) => {
    useEffect(() => {
      const area = (ref as React.RefObject<HTMLDivElement>)?.current;
      if (!area) return;
      const handler = (e: MouseEvent) => {
        area.querySelectorAll('img.selected').forEach(img => img.classList.remove('selected'));
        if ((e.target as HTMLElement).tagName === 'IMG') (e.target as HTMLElement).classList.add('selected');
      };
      area.addEventListener('click', handler);
      return () => { if (area) area.removeEventListener('click', handler); };
    }, [ref]);
    
    const pageCount = pages.length;
    const renderPage = (index: number) => <EditablePage key={index} index={index} content={pages[index]} onContentChange={onContentChange} orientation={orientation} pageCount={pageCount} />;
    
    const renderPages = () => {
      if (pageView === 'single' || pages.length < 2) {
        return pages.map((_, i) => <div key={`p-${i}`} className="mb-8 border border-gray-300">{renderPage(i)}</div>);
      }
      const pairs = [];
      for (let i = 0; i < pages.length; i += 2) {
        pairs.push(<div key={`row-${i}`} className="flex justify-center items-start space-x-8 w-full mb-8">
          <div className="border border-gray-300">{renderPage(i)}</div>
          {i + 1 < pages.length && <div className="border border-gray-300">{renderPage(i + 1)}</div>}
        </div>);
      }
      return pairs;
    };

    return (
      <div className="flex-grow p-8 overflow-auto bg-gray-200">
        <div ref={ref} className="flex flex-col items-center" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-in-out' }}>
          {renderPages()}
        </div>
      </div>
    );
  }
));
