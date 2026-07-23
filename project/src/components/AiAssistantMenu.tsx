
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Paperclip, X, GripVertical, ExternalLink, Bot, Sparkles, User,
  Copy, Download, Check, Folder, ChevronRight, ChevronDown, File as FileIcon, FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Chat } from "@google/genai";
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { agents } from '../data/agents';
import { useFiles, FileNode } from '../contexts/FileContext';
import { currentUser } from '../data/appConfig';
import StandardAccountLimits from './StandardAccountLimits';
import {_fetchRemoteHandshake} from '../data/appConfig';

interface AiAssistantMenuProps {
  onStartupModalClick: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  groundingSources?: Array<{ title: string; uri: string }>;
}

const FileTreeItem: React.FC<{ node: FileNode, level: number, onSelect: (node: FileNode) => void }> = ({ node, level, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === 'folder';

  if (isFolder) {
    return (
      <div>
        <div 
            className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 cursor-pointer rounded select-none"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => setIsOpen(!isOpen)}
        >
            {isOpen ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
            <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm truncate text-gray-700">{node.name}</span>
        </div>
        {isOpen && node.children && (
            <div>
                {node.children.map(child => (
                    <FileTreeItem key={child.id} node={child} level={level + 1} onSelect={onSelect} />
                ))}
            </div>
        )}
      </div>
    );
  }

  return (
    <div 
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-blue-50 cursor-pointer rounded group select-none"
        style={{ paddingLeft: `${level * 12 + 24}px` }}
        onClick={() => onSelect(node)}
    >
        <FileIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
        <span className="text-sm truncate text-gray-600 group-hover:text-blue-700">{node.name}</span>
    </div>
  );
};

export default function AiAssistantMenu({ onStartupModalClick }: AiAssistantMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(450);
  const isResizing = useRef(false);
  const sidebarWidth = 64; 

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  // Attachment State
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<FileNode | null>(null);
  
  // UI State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { fileTree } = useFiles();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [drLevy] = useState(() => agents.find(a => a.name === 'Dr. Levy') || agents[0]);
  const isFreeUser = currentUser.level === 'free';

  // Initialize Chat
 // Initialize Chat
useEffect(() => {
  if (!isOpen || chatSession) return;

  const initializeChat = async () => {
    try {
      const apiKey = await _fetchRemoteHandshake();

      const ai = new GoogleGenAI({ apiKey });

      const session = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: `You are Dr. Levy, a world-class expert in pharmacometrics, statistics, and drug development. 
You are helpful, precise, and professional. 
You answer questions and provide explanations.
You HAVE access to Google Search to provide up-to-date information and citations.
You DO NOT have access to the user's file system tools directly, but the user may paste file content into the chat.
If the user provides file content, analyze it as requested.
Always maintain a conversational and supportive tone.`,
          tools: [{ googleSearch: {} }],
        }
      });

      setChatSession(session);

      // Initial greeting
      setMessages([
        {
          id: 'init',
          sender: 'assistant',
          text: "Hello, I'm Dr. Levy. How can I assist you with your pharmacometrics research today?",
          timestamp: new Date(),
        },
      ]);
    } catch (e) {
      console.error("Failed to initialize AI", e);
    }
  };

  initializeChat();
}, [isOpen, chatSession]);


  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, attachedFile]);

  // Resize logic
  const startResizing = (e: React.MouseEvent) => {
    isResizing.current = true;
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing.current) {
        const newWidth = e.clientX - sidebarWidth;
        if (newWidth > 350 && newWidth < 800) {
            setWidth(newWidth);
        }
      }
    };
    const handleMouseUp = () => { isResizing.current = false; };
    if (isOpen) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !attachedFile) || !chatSession || isLoading) return;

    let fullMessage = inputValue;
    if (attachedFile) {
        fullMessage += `\n\n[Context from file: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content}\n\`\`\``;
    }

    const userMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'user',
        text: fullMessage,
        timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachedFile(null); // Clear attachment
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    try {
        const result = await chatSession.sendMessageStream({ message: userMsg.text });
        
        const responseId = crypto.randomUUID();
        let fullText = '';
        let sources: Array<{ title: string; uri: string }> = [];

        setMessages(prev => [...prev, {
            id: responseId,
            sender: 'assistant',
            text: '',
            timestamp: new Date(),
            isStreaming: true
        }]);

        for await (const chunk of result) {
            fullText += chunk.text;
            
            const grounding = (chunk as any).groundingMetadata;
            if (grounding?.groundingChunks) {
                const newSources = grounding.groundingChunks
                    .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
                    .filter(Boolean);
                if (newSources.length > 0) {
                    sources = newSources;
                }
            }

            setMessages(prev => prev.map(msg => 
                msg.id === responseId 
                ? { ...msg, text: fullText, groundingSources: sources.length > 0 ? sources : undefined } 
                : msg
            ));
        }

        setMessages(prev => prev.map(msg => 
            msg.id === responseId ? { ...msg, isStreaming: false } : msg
        ));

    } catch (error) {
        console.error(error);
        setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            sender: 'assistant',
            text: "I apologize, but I encountered an error while processing your request.",
            timestamp: new Date()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleExport = (text: string) => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dr-levy-response-${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  const renderMessageContent = (text: string) => {
    // If the message contains a file context block, hide the raw content in display if desired, 
    // or render it nicely. For user messages, we might want to just show "Attached: filename".
    // This simple logic just renders markdown.
    
    // Optional: Collapse large file contexts for display
    let displayText = text;
    const contextMatch = text.match(/\[Context from file: (.*?)\]\n```\n([\s\S]*?)\n```/);
    if (contextMatch) {
         const fileName = contextMatch[1];
         // We can replace the big block with a small indicator in the UI, 
         // but keeping it simple for now, just render as markdown.
         // Or purely for user message display:
    }

    const html = DOMPurify.sanitize(marked.parse(displayText) as string);
    return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="relative">
        <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-10 h-10 rounded-none flex items-center justify-center transition-all duration-200 group relative ${
                isOpen 
                ? 'bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            title="Dr. Levy AI Assistant"
            {...{ whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } as any}
        >
            <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 shadow-sm">
                <img src="https://drlevy.ai/drlevy2.jpg" alt="Dr. Levy" className="w-full h-full object-cover" />
            </div>
        </motion.button>

        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setIsOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{ width: `${width}px`, height: '95vh', bottom: '1rem' }}
                        className="absolute left-full ml-3 bg-white border border-gray-200 shadow-2xl flex flex-col z-40 origin-bottom-left overflow-hidden rounded-none"
                    >
                        {/* Header */}
                        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden border border-blue-50">
                                        <img src="https://drlevy.ai/drlevy2.jpg" alt="Dr. Levy" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">Dr. Levy</h3>
                                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-green-600"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 space-y-6">
                            {messages.map((msg, index) => (
                                <div 
                                    key={msg.id} 
                                    className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border border-gray-100 ${msg.sender === 'user' ? 'bg-gray-200' : 'bg-blue-100'}`}>
                                        {msg.sender === 'assistant' ? (
                                            <img src="https://drlevy.ai/drlevy2.jpg" alt="Dr. Levy" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                <User className="w-4 h-4 text-gray-500" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`
                                            px-4 py-3 rounded-2xl text-sm shadow-sm relative group
                                            ${msg.sender === 'user' 
                                                ? 'bg-blue-600 text-white rounded-br-none' 
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}
                                        `}>
                                            {renderMessageContent(msg.text)}
                                            {msg.isStreaming && (
                                                <span className="inline-flex gap-1 items-center mt-1">
                                                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                                                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                                </span>
                                            )}

                                            {/* Action Buttons for Assistant Messages */}
                                            {msg.sender === 'assistant' && !msg.isStreaming && (
                                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 rounded p-0.5 border border-gray-100 shadow-sm">
                                                    <button 
                                                        onClick={() => handleCopy(msg.text, msg.id)}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                                                        title="Copy"
                                                    >
                                                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleExport(msg.text)}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                                                        title="Download MD"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Grounding Sources */}
                                        {msg.sender === 'assistant' && msg.groundingSources && msg.groundingSources.length > 0 && (
                                            <div className="mt-2 bg-white border border-gray-200 rounded-lg p-3 text-xs w-full">
                                                <p className="font-semibold text-gray-500 mb-2 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> Sources
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {msg.groundingSources.map((source, idx) => (
                                                        <a 
                                                            key={idx} 
                                                            href={source.uri} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded border border-gray-100 transition-colors truncate max-w-full"
                                                        >
                                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">{source.title}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                                            {msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {isFreeUser ? (
                            <div className="border-t border-gray-100">
                                <StandardAccountLimits />
                            </div>
                        ) : (
                            <>
                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-gray-100 shrink-0 relative">
                                    {attachedFile && (
                                        <div className="absolute -top-10 left-4 bg-gray-100 border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm animate-fade-in">
                                            <FileCode className="w-3.5 h-3.5 text-blue-500" />
                                            <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                                            <button onClick={() => setAttachedFile(null)} className="hover:text-red-500">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="relative flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-blue-300 transition-all">
                                        <button 
                                            onClick={() => setIsAttachModalOpen(true)}
                                            className={`p-2 rounded-full transition-colors flex-shrink-0 ${isAttachModalOpen ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                                            title="Attach from Project"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <textarea
                                            ref={textareaRef}
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                            }}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Message Dr. Levy..."
                                            className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none text-sm py-2.5 max-h-[120px] min-h-[40px]"
                                            rows={1}
                                            disabled={isLoading}
                                        />
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={(!inputValue.trim() && !attachedFile) || isLoading}
                                            className={`
                                                p-2 rounded-full transition-all flex-shrink-0 mb-0.5
                                                ${(!inputValue.trim() && !attachedFile) || isLoading
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform active:scale-95'}
                                            `}
                                        >
                                            {isLoading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="text-center mt-2">
                                        <p className="text-[10px] text-gray-400">
                                            Dr. Levy can make mistakes. Consider checking important information.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {/* File Selection Modal Overlay */}
                        {isAttachModalOpen && (
                            <div className="absolute inset-0 z-50 bg-white/95 flex flex-col animate-fade-in">
                                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white">
                                    <h3 className="font-semibold text-gray-800 text-sm">Select File to Attach</h3>
                                    <button onClick={() => setIsAttachModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3">
                                    <div className="space-y-1">
                                        {fileTree.children?.map(child => (
                                            <FileTreeItem 
                                                key={child.id} 
                                                node={child} 
                                                level={0} 
                                                onSelect={(node) => {
                                                    setAttachedFile(node);
                                                    setIsAttachModalOpen(false);
                                                    textareaRef.current?.focus();
                                                }} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Resize Handle */}
                        <div
                            onMouseDown={startResizing}
                            className="absolute top-0 right-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-blue-400/20 bg-transparent z-50 transition-colors flex items-center justify-center group"
                            title="Drag to resize"
                        >
                            <div className="h-8 w-1 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors"></div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    </div>
  );
}
