import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from './hooks';
import { SAMPLE_DOCUMENT_CONTENT } from './constants';
import { CommentType, OutlineItem, ReplyType } from './types';
import { 
    Header, 
    Toolbar, 
    OutlineSidebar, 
    WorkArea, 
    CommentsSidebar, 
    StatusBar, 
    HelpModal, 
    FindReplaceModal,
    FindState
} from './components';
import { FileNode } from '../../contexts/FileContext';

declare global {
  interface Window {
    htmlToDocx: any;
    html2pdf: any;
    TurndownService: any;
    saveAs: (blob: Blob, filename: string) => void;
  }
}

// NOTE: The provided content for .docx files is a placeholder string.
// This component will use its own sample content as a starting point,
// as it operates on HTML content, not by parsing .docx files.
// All changes will be managed within this component's state.

const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || isNaN(bytes)) return '0 Bytes';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface DocxEditorProps {
  isFilePanelVisible: boolean;
  onToggleFilePanel: () => void;
  file: FileNode;
  onContentChange: (content: string) => void;
}

const DocxEditor: React.FC<DocxEditorProps> = ({ isFilePanelVisible, onToggleFilePanel, file, onContentChange }) => {
  const getInitialPages = useCallback(() => {
    if (file.content && file.content !== 'DOCX file content cannot be displayed in the editor.') {
        return file.content.split('<!-- pagebreak -->');
    }
    return SAMPLE_DOCUMENT_CONTENT;
  }, [file.content]);
  
  const [pages, setPages, undo, redo, canUndo, canRedo, resetPages] = useHistory<string[]>(getInitialPages());
  const [wordCount, setWordCount] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageView, setPageView] = useState<'single' | 'double'>('single');
  const [docInfo, setDocInfo] = useState({
    name: file.name,
    size: formatFileSize(file.size),
    lastEdited: new Date(file.lastModified || Date.now()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
  });
  const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(false);
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [selectionInfo, setSelectionInfo] = useState<{ page: number | null; words: number | null }>({ page: null, words: null });
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState<boolean>(false);
  const [findState, setFindState] = useState<FindState>({
    term: '', replaceTerm: '', matchCase: false, wholeWord: false, resultsCount: 0, currentIndex: -1,
  });
  const workAreaRef = useRef<HTMLDivElement>(null);
  const findMatchRefs = useRef<HTMLElement[]>([]);
  const lastSearchTerm = useRef('');
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = useCallback(() => {
    onContentChange(pages.present.join('<!-- pagebreak -->'));
    setDocInfo(prev => ({ ...prev, lastEdited: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }));
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, [pages.present, onContentChange]);

  useEffect(() => {
    resetPages(getInitialPages());
  }, [file.id, getInitialPages, resetPages]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  useEffect(() => {
    const totalWords = pages.present.reduce((count, currentPage) => {
      const text = new DOMParser().parseFromString(currentPage, 'text/html').body.textContent || "";
      return count + (text.trim().split(/\s+/).filter(Boolean).length);
    }, 0);
    setWordCount(totalWords);
  }, [pages.present]);

  useEffect(() => {
    const generateOutline = () => {
      if (!workAreaRef.current) return;
      const headings = workAreaRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const items = Array.from(headings).map((h, i) => {
        const headingElement = h as HTMLElement;
        if (!headingElement.id) headingElement.id = `h-${i}`;
        return { id: headingElement.id, text: headingElement.textContent || '', level: parseInt(headingElement.tagName.substring(1), 10) };
      });
      setOutlineItems(items);
    };
    const timeoutId = setTimeout(generateOutline, 300);
    return () => clearTimeout(timeoutId);
  }, [pages.present]);

  useEffect(() => {
    if (!workAreaRef.current) return;
    const prevSelected = workAreaRef.current.querySelector('mark.selected-comment') as HTMLElement | null;
    prevSelected?.classList.remove('selected-comment');
    
    if (selectedCommentId) {
// FIX: Cast querySelector result to HTMLElement to ensure classList and scrollIntoView are available.
      const mark = workAreaRef.current.querySelector(`mark[data-comment-id="${selectedCommentId}"]`) as HTMLElement | null;
      mark?.classList.add('selected-comment');
      mark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedCommentId]);

  useEffect(() => {
    const handler = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) { setSelectionInfo({ page: null, words: null }); return; }
      const range = selection.getRangeAt(0);
      const getPageElement = (node: Node) => (node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement)?.closest('[data-page-index]');
      const pageElement = getPageElement(range.commonAncestorContainer) || getPageElement(range.startContainer);
      const words = selection.isCollapsed ? null : selection.toString().trim().split(/\s+/).filter(Boolean).length;
      setSelectionInfo({ page: pageElement ? parseInt(pageElement.getAttribute('data-page-index')!, 10) + 1 : null, words });
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  const handleContentChange = useCallback((index: number, newContent: string) => {
    setPages(currentPages => {
      const newPages = [...currentPages];
      if (newPages[index] !== newContent) {
          newPages[index] = newContent;
          return newPages;
      }
      return currentPages;
    });
  }, [setPages]);

  const handleNavigateOutline = (id: string) => workAreaRef.current?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  const handleSelectComment = (id: string | null) => setSelectedCommentId(id);
  
  const handleUpdateComment = (id: string, text: string) => setComments(p => p.map(c => c.id === id ? { ...c, text } : c));

  const handleReplyToComment = (cId: string, text: string) => setComments(p => p.map(c => c.id === cId ? { ...c, replies: [...c.replies, { id: `r-${Date.now()}`, author: 'User', text, timestamp: new Date().toISOString() }] } : c));
  
  const handleResolveComment = (id: string) => setComments(p => p.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  
  const handleDeleteComment = (id: string) => {
    setComments(p => p.filter(c => c.id !== id));
    if (selectedCommentId === id) setSelectedCommentId(null);
    if (workAreaRef.current) {
      const mark = workAreaRef.current.querySelector(`mark[data-comment-id="${id}"]`);
      if (mark) {
        const parent = mark.parentNode;
        const pageEl = mark.closest('[data-page-index]');
        while (mark.firstChild) parent?.insertBefore(mark.firstChild, mark);
        parent?.removeChild(mark);
        if (pageEl) handleContentChange(parseInt(pageEl.getAttribute('data-page-index')!, 10), (pageEl.firstElementChild as HTMLElement).innerHTML);
      }
    }
  };

  const handleDeleteReply = (cId: string, rId: string) => setComments(p => p.map(c => c.id === cId ? { ...c, replies: c.replies.filter(r => r.id !== rId) } : c));

  const clearFindHighlights = useCallback(() => {
    const newPages = pages.present.map(p => p.replace(/<mark class="find-match[^"]*">([^<]+)<\/mark>/g, '$1'));
    if (JSON.stringify(newPages) !== JSON.stringify(pages.present)) setPages(newPages, true);
    findMatchRefs.current = [];
    setFindState(s => ({ ...s, resultsCount: 0, currentIndex: -1 }));
    return newPages;
  }, [pages.present, setPages]);
  
  const handleCloseFindReplace = () => { clearFindHighlights(); setIsFindReplaceOpen(false); };
  
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const findAndHighlight = useCallback(() => {
    const { term, matchCase, wholeWord } = findState;
    if (!term) { clearFindHighlights(); return; }
    lastSearchTerm.current = term;
    let cleanedPages = clearFindHighlights();
    const regex = new RegExp(wholeWord ? `\\b${escapeRegExp(term)}\\b` : escapeRegExp(term), `g${matchCase ? '' : 'i'}`);
    let totalMatches = 0;
    const highlightedPages = cleanedPages.map(page => {
      const parts = page.split(/(<[^>]+>)/);
      return parts.map((part, i) => i % 2 === 0 ? part.replace(regex, m => { totalMatches++; return `<mark class="find-match">${m}</mark>`; }) : part).join('');
    });
    setPages(highlightedPages, true);

    setTimeout(() => {
      if (workAreaRef.current) {
        const matches = Array.from(workAreaRef.current.querySelectorAll('.find-match')) as HTMLElement[];
        findMatchRefs.current = matches;
        setFindState(s => ({ ...s, resultsCount: matches.length, currentIndex: -1 }));
        if (matches.length > 0) {
          setFindState(s => ({ ...s, currentIndex: 0 }));
          matches[0].classList.add('active');
          matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  }, [findState.term, findState.matchCase, findState.wholeWord, setPages, clearFindHighlights]);

  const handleFindNext = () => {
    if (findState.term !== lastSearchTerm.current) { findAndHighlight(); return; }
    if (findMatchRefs.current.length === 0) return;
    setFindState(s => {
      findMatchRefs.current[s.currentIndex]?.classList.remove('active');
      const nextIndex = (s.currentIndex + 1) % findMatchRefs.current.length;
      const nextMatch = findMatchRefs.current[nextIndex];
      if (nextMatch) { nextMatch.classList.add('active'); nextMatch.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      return { ...s, currentIndex: nextIndex };
    });
  };
  
  const handleReplace = () => {
    if (findState.currentIndex === -1 || findMatchRefs.current.length === 0) return;
    const match = findMatchRefs.current[findState.currentIndex];
    const pageEl = match.closest('[data-page-index]');
    if (!pageEl) return;
    match.replaceWith(document.createTextNode(findState.replaceTerm));
    const newPages = [...pages.present];
    newPages[parseInt(pageEl.getAttribute('data-page-index')!, 10)] = (pageEl.firstElementChild as HTMLElement).innerHTML;
    setPages(newPages);
    setTimeout(() => findAndHighlight(), 100);
  };

  const handleReplaceAll = () => {
    const { term, replaceTerm, matchCase, wholeWord } = findState;
    if (!term) return;
    const regex = new RegExp(wholeWord ? `\\b${escapeRegExp(term)}\\b` : escapeRegExp(term), `g${matchCase ? '' : 'i'}`);
    const newPages = pages.present.map(page => page.split(/(<[^>]+>)/).map((part, i) => i % 2 === 0 ? part.replace(regex, replaceTerm) : part).join(''));
    setPages(newPages);
    handleCloseFindReplace();
  };

  const handleCommand = useCallback(async (action: string, value?: string) => {
    const mapSize = (s: number) => { if (s <= 8) return 1; if (s <= 10) return 2; if (s <= 12) return 3; if (s <= 14) return 4; if (s <= 18) return 5; if (s <= 24) return 6; return 7; }
    switch (action) {
      case 'zoom_in': setZoomLevel(p => Math.min(p + 10, 200)); break;
      case 'zoom_out': setZoomLevel(p => Math.max(p - 10, 50)); break;
      case 'zoom_100': setZoomLevel(100); break;
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'print': window.print(); break;
      case 'toggleOrientation': setOrientation(o => o === 'portrait' ? 'landscape' : 'portrait'); break;
      case 'toggleOutline': setIsOutlineOpen(p => !p); break;
      case 'findAndReplace': setIsFindReplaceOpen(true); break;
      case 'addComment': {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) { setIsCommentsOpen(p => !p); return; }
        const range = selection.getRangeAt(0);
        const pageEl = range.startContainer.parentElement?.closest('[data-page-index]');
        if (!pageEl) return;
        const pageIndex = parseInt(pageEl.getAttribute('data-page-index')!, 10);
        const commentId = `c-${Date.now()}`;
        const newComment: CommentType = { id: commentId, pageIndex, author: 'User', text: '', timestamp: new Date().toISOString(), replies: [], resolved: false };
        const mark = document.createElement('mark');
        mark.dataset.commentId = commentId;
        try {
          range.surroundContents(mark);
          handleContentChange(pageIndex, (pageEl.firstElementChild as HTMLElement).innerHTML);
          setComments(p => [...p, newComment]);
          setIsCommentsOpen(true);
          setSelectedCommentId(commentId);
        } catch (e) { console.error("Failed to wrap selection:", e); } 
        finally { selection.removeAllRanges(); }
        break;
      }
      case 'insertImage': {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = () => {
          if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = e => { if (e.target?.result) document.execCommand('insertImage', false, e.target.result as string); };
            reader.readAsDataURL(input.files[0]);
          }
        };
        input.click();
        break;
      }
      case 'foreColor': case 'backColor': document.execCommand('styleWithCSS', false, 'true'); document.execCommand(action, false, value); break;
      case 'fontSize': if(value) document.execCommand(action, false, mapSize(parseInt(value, 10)).toString()); break;
      case 'lineHeight': case 'addSpaceBefore': case 'addSpaceAfter': {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) break;
        let node = sel.getRangeAt(0).startContainer;
        while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode!;
        let block = node as HTMLElement;
        while (block && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(block.tagName)) block = block.parentElement!;
        if (block) {
          if (action === 'lineHeight' && value) block.style.lineHeight = value;
          else if (action === 'addSpaceBefore') block.style.marginTop = '12pt';
          else if (action === 'addSpaceAfter') block.style.marginBottom = '12pt';
          const pageEl = block.closest('[data-page-index]');
          if (pageEl) handleContentChange(parseInt(pageEl.getAttribute('data-page-index')!, 10), (pageEl.firstElementChild as HTMLElement).innerHTML);
        }
        break;
      }
      default: document.execCommand(action, false, value); break;
    }
  }, [undo, redo, handleContentChange]);

  const handleExport = useCallback(async (format: 'docx' | 'pdf' | 'md') => {
    const filename = file.name.replace(/\.docx$/, `.${format}`);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pages.present.join('<div style="page-break-after: always;"></div>');
    if (format === 'docx') {
      comments.forEach(c => {
        const mark = tempDiv.querySelector(`mark[data-comment-id="${c.id}"]`);
        if (mark) {
          const container = document.createElement('span');
          container.style.cssText = 'color:#595959; font-size:9pt; margin-left:4px;';
          let html = ` <strong>[Comment by ${c.author}]:</strong> ${c.text}${c.resolved ? ' (Resolved)' : ''}`;
          c.replies.forEach((r: ReplyType) => { html += `<br><span style="margin-left: 15px;"><strong>[Reply by ${r.author}]:</strong> ${r.text}</span>`; });
          container.innerHTML = html;
          mark.parentNode?.insertBefore(container, mark.nextSibling);
        }
      });
    }
    const contentHtml = tempDiv.innerHTML;
    switch (format) {
      case 'docx': 
        if(window.htmlToDocx) {
            window.saveAs(await window.htmlToDocx(contentHtml, null, { table: { row: { cantSplit: true } }, footer: true, pageNumber: true, orientation }) as Blob, filename); 
        }
        break;
      case 'pdf':
        if (window.html2pdf) {
            const el = document.createElement('div');
            const pageStyle = orientation === 'portrait' ? `width: 8.5in; min-height: 11in;` : `width: 11in; min-height: 8.5in;`;
            el.innerHTML = pages.present.map(p => `<div style="${pageStyle} padding: 1in; background: white; page-break-after: always;">${p}</div>`).join('');
            window.html2pdf().from(el).set({ margin: 0, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation } }).save();
        }
        break;
      case 'md':
        if (window.TurndownService) {
            const markdown = new window.TurndownService().turndown(contentHtml);
            window.saveAs(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), filename);
        }
        break;
    }
  }, [pages.present, file.name, orientation, comments]);

  return (
    <div className="flex flex-col h-full font-sans text-sm antialiased bg-gray-200">
      <div className="bg-gray-50 shadow-sm">
        <Header 
            fileName={docInfo.name} 
            fileSize={docInfo.size} 
            lastEdited={docInfo.lastEdited} 
            onExport={handleExport} 
            onHelp={() => setIsHelpModalOpen(true)}
            onSave={handleSave}
            showSaved={showSaved}
            isFilePanelVisible={isFilePanelVisible}
            onToggleFilePanel={onToggleFilePanel}
        />
        <Toolbar onCommand={handleCommand} canUndo={canUndo} canRedo={canRedo} />
      </div>
      <div className="flex-grow flex overflow-hidden">
        <OutlineSidebar isOpen={isOutlineOpen} items={outlineItems} onNavigate={handleNavigateOutline} onClose={() => setIsOutlineOpen(false)} />
        <WorkArea ref={workAreaRef} pages={pages.present} onContentChange={handleContentChange} zoom={zoomLevel} orientation={orientation} pageView={pageView} />
        <CommentsSidebar isOpen={isCommentsOpen} comments={comments} selectedCommentId={selectedCommentId} onClose={() => setIsCommentsOpen(false)} onSelectComment={handleSelectComment} onUpdateComment={handleUpdateComment} onDeleteComment={handleDeleteComment} onReplyToComment={handleReplyToComment} onResolveComment={handleResolveComment} onDeleteReply={handleDeleteReply} />
      </div>
      <StatusBar pageCount={pages.present.length} wordCount={wordCount} selectionInfo={selectionInfo} zoom={zoomLevel} setZoom={setZoomLevel} pageView={pageView} setPageView={setPageView} />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      <FindReplaceModal isOpen={isFindReplaceOpen} onClose={handleCloseFindReplace} findState={findState} onStateChange={(newState) => setFindState(s => ({ ...s, ...newState }))} onFindNext={handleFindNext} onReplace={handleReplace} onReplaceAll={handleReplaceAll} />
    </div>
  );
};

export default DocxEditor;