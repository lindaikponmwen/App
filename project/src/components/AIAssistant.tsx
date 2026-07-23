
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { AiMessage, AppFile, Step } from '../types';
import { Send, Bot, User, Loader2, Clipboard, Check, FileDown, FileText, Paperclip, Eye, EyeOff, FileSpreadsheet, XCircle } from 'lucide-react';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { useFiles, FileNode, AIChange } from '../contexts/FileContext';
import { generateCode } from '../api/gemini';
import TaskProgress from './TaskProgress';
import { currentUser } from '../data/appConfig';
import StandardAccountLimits from './StandardAccountLimits';
import {_fetchRemoteHandshake} from '../data/appConfig';

// This is available globally from scripts loaded in index.html
declare global {
  interface Window {
    html2pdf: any;
  }
}

interface AIAssistantProps {
  systemInstruction: string;
  allowAttachments?: boolean;
  avatar?: string;
}

interface AttachedFile {
  name: string;
  preview: string;
  expanded: boolean;
}

// Keywords to identify agents that should modify files
const ACTION_AGENT_KEYWORDS = ['project manager', 'programmer'];

const AIAssistant: React.FC<AIAssistantProps> = ({ systemInstruction, allowAttachments = false, avatar }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fileTree, applyAiChanges } = useFiles();

  const isFreeUser = currentUser.level === 'free';
  const isActionAgent = ACTION_AGENT_KEYWORDS.some(keyword => systemInstruction.toLowerCase().includes(keyword));

 useEffect(() => {
  const initializeChat = async () => {
    try {
      const apiKey = await _fetchRemoteHandshake();
      const ai = new GoogleGenAI({ apiKey });

      const newChat = await ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: { systemInstruction },
      });

      setChat(newChat);
    } catch (e) {
      console.error("Failed to initialize AI Assistant", e);
      setError("API Key is missing or invalid.");
    }
  };

  // Call async initializer
  initializeChat();

  // Reset state when agent changes
  setMessages([{
    id: crypto.randomUUID(),
    sender: 'assistant',
    type: 'text',
    message: `Hello! I'm your ${
      systemInstruction.toLowerCase().includes('project manager')
        ? 'Project Setup assistant'
        : systemInstruction.toLowerCase().includes('programmer')
        ? 'Coding Co-pilot'
        : 'assistant'
    }. How can I help?`,
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }]);

  setAttachedFiles([]);
}, [systemInstruction]);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, attachedFiles]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // max height in pixels, approx 5 rows
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [newMessage]);

  const handleCopy = (message: AiMessage) => {
    navigator.clipboard.writeText(message.message).then(() => {
      setCopied(prev => ({ ...prev, [message.id]: true }));
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [message.id]: false }));
      }, 2000);
    });
  };

  const handleDownloadMD = (message: AiMessage) => {
    const blob = new Blob([message.message], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-response-${message.id.substring(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = (message: AiMessage) => {
    const html = DOMPurify.sanitize(marked.parse(message.message) as string);
    const element = document.createElement('div');
    element.className = 'markdown-body';
    element.style.padding = '1rem';
    element.style.width = '8.5in'; // Standard letter size width
    element.innerHTML = html;
    document.body.appendChild(element);

    if (window.html2pdf) {
        window.html2pdf()
        .from(element)
        .set({
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `ai-response-${message.id.substring(0, 8)}.pdf`,
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        })
        .save()
        .then(() => {
            document.body.removeChild(element);
        });
    } else {
        alert('PDF generation library is not loaded.');
        document.body.removeChild(element);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const file = e.target.files[0];
        const text = await file.text();
        const lines = text.split('\n').slice(0, 5).join('\n');
        setAttachedFiles(prev => [...prev, { name: file.name, preview: lines, expanded: false }]);
      } catch (error) {
        console.error("Failed to read file", error);
        setError("Failed to read the attached file. Please ensure it is a text-based file (e.g., CSV, TXT).");
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleFilePreview = (index: number) => {
    setAttachedFiles(prev => prev.map((f, i) => i === index ? { ...f, expanded: !f.expanded } : f));
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachedFiles.length === 0) || isLoading || isFreeUser) return;

    let messageContext = '';
    if (attachedFiles.length > 0) {
        messageContext = '\n\n' + attachedFiles.map(f => `[Dataset Preview: ${f.name}]\n${f.preview}`).join('\n\n');
    }
    const messageToSend = newMessage + messageContext;

    const userMessage: AiMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      message: newMessage + (attachedFiles.length > 0 ? `\n\n*Attached ${attachedFiles.length} dataset(s)*` : '') + (attachedFiles.length > 0 ? attachedFiles.map(f => `\n\n**${f.name} Preview:**\n\`\`\`\n${f.preview}\n\`\`\``).join('') : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setAttachedFiles([]); // Clear attachments after sending
    setIsLoading(true);
    setError(null);
    
    const assistantMessageId = crypto.randomUUID();

    if (isActionAgent) {
        const initialSteps: Step[] = [
            { label: 'Parsing your request', status: 'pending' },
            { label: 'Analyzing project files', status: 'pending' },
            { label: 'Planning required changes', status: 'pending' },
            { label: 'Generating new code and content', status: 'pending' },
            { label: 'Applying changes to project', status: 'pending' },
        ];
        
        setMessages(prev => [...prev, {
            id: assistantMessageId,
            sender: 'assistant',
            message: '',
            type: 'task_progress',
            progress: initialSteps,
            isStreaming: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);

        const updateProgress = (stepIndex: number, newStatus: Step['status']) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === assistantMessageId && msg.progress) {
                    const newProgress = [...msg.progress];
                    if (newStatus === 'in_progress') {
                        for (let i = 0; i < stepIndex; i++) {
                            if (newProgress[i].status !== 'failed') {
                                newProgress[i].status = 'completed';
                            }
                        }
                    }
                    newProgress[stepIndex] = { ...newProgress[stepIndex], status: newStatus };
                    return { ...msg, progress: newProgress };
                }
                return msg;
            }));
        };

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let responseText = '';

        try {
            updateProgress(0, 'in_progress');
            await sleep(500);
            updateProgress(0, 'completed');

            updateProgress(1, 'in_progress');
            const getProjectFiles = (rootNode: FileNode): AppFile[] => {
              const files: AppFile[] = [];
              const traverse = (nodes: FileNode[], path: string) => {
                  for (const node of nodes) {
                      const currentPath = path ? `${path}/${node.name}` : node.name;
                      if (node.type === 'file') {
                          files.push({ name: currentPath, content: node.content || '' });
                      } else if (node.type === 'folder' && node.children) {
                          traverse(node.children, currentPath);
                      }
                  }
              };
              if (rootNode.children) {
                  traverse(rootNode.children, '');
              }
              return files;
            };
            const projectFiles = getProjectFiles(fileTree);
            await sleep(800);
            updateProgress(1, 'completed');

            updateProgress(2, 'in_progress');
            await sleep(1200);
            updateProgress(2, 'completed');

            updateProgress(3, 'in_progress');
            responseText = await generateCode(messageToSend, projectFiles, systemInstruction);
            updateProgress(3, 'completed');
            
            updateProgress(4, 'in_progress');
            await sleep(500);

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(responseText, "application/xml");
            const errorNode = xmlDoc.querySelector("parsererror");
            if (errorNode) throw new Error(`Failed to parse AI response as XML. The response may not be in the correct format. Parser error: ${errorNode.textContent}`);

            const messageNode = xmlDoc.querySelector("message");
            if (messageNode) {
                 setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId ? {
                        ...msg,
                        type: 'text',
                        message: messageNode.textContent || 'I have a message for you.',
                        isStreaming: false,
                        progress: undefined,
                    } : msg
                ));
            } else {
                const changeNodes = xmlDoc.querySelectorAll("change");
                if (changeNodes.length === 0) throw new Error("AI response contained no valid actions or message.");

                const changes: AIChange[] = Array.from(changeNodes).map(node => {
                    const isDelete = node.getAttribute('delete') === 'true';
                    const file = node.querySelector("file")?.textContent || '';
                    const description = node.querySelector("description")?.textContent || 'No description provided.';
                    const content = node.querySelector("content")?.textContent || '';
                    return { file, content, description, delete: isDelete };
                });
                
                await applyAiChanges(changes);
                updateProgress(4, 'completed');

                const createdFiles = changes.filter(c => !c.delete && !projectFiles.some(f => f.name === c.file));
                const modifiedFiles = changes.filter(c => !c.delete && projectFiles.some(f => f.name === c.file));
                const deletedFiles = changes.filter(c => c.delete);
                
                let summaryParts: string[] = [];
                if(createdFiles.length > 0) summaryParts.push(`${createdFiles.length} file(s) created`);
                if(modifiedFiles.length > 0) summaryParts.push(`${modifiedFiles.length} file(s) modified`);
                if(deletedFiles.length > 0) summaryParts.push(`${deletedFiles.length} file(s) deleted`);

                const summaryIntro = summaryParts.length > 0 ? `I've successfully updated your project: ${summaryParts.join(', ')}.` : "I've applied the requested changes.";
                
                let fileListSummary = '';
                if (createdFiles.length > 0) {
                    fileListSummary += `\n\n**Created:**\n${createdFiles.map(f => `- \`${f.file}\``).join('\n')}`;
                }
                if (modifiedFiles.length > 0) {
                    fileListSummary += `\n\n**Modified:**\n${modifiedFiles.map(f => `- \`${f.file}\``).join('\n')}`;
                }
                if (deletedFiles.length > 0) {
                    fileListSummary += `\n\n**Deleted:**\n${deletedFiles.map(f => `- \`${f.file}\``).join('\n')}`;
                }

                const summaryMessage = `${summaryIntro}${fileListSummary}`;

                await sleep(500);
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId ? {
                      ...msg,
                      type: 'text',
                      message: summaryMessage,
                      isStreaming: false,
                      progress: undefined
                  } : msg
                ));
            }

        } catch (e) {
            console.error(e);
            const errorMessage = (e instanceof Error) ? e.message : 'An unexpected error occurred.';
            setError(errorMessage);

            setMessages(prev => prev.map(msg => {
                if (msg.id === assistantMessageId && msg.progress) {
                    const newProgress = msg.progress.map(step => 
                        step.status === 'in_progress' ? { ...step, status: 'failed' as Step['status'] } : step
                    );
                    return { ...msg, progress: newProgress, isStreaming: false };
                }
                return msg;
            }));

            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                sender: 'assistant',
                type: 'text',
                message: `An error occurred: ${errorMessage}\n\nRaw response:\n\`\`\`\n${responseText}\n\`\`\``,
                isStreaming: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
            
        } finally {
            setIsLoading(false);
        }
    } else {
      // Standard streaming chat agent
      if (!chat) return;
      try {
        const result = await chat.sendMessageStream({ message: messageToSend });
        let fullResponse = '';
        
        setMessages(prev => [...prev, {
          id: assistantMessageId,
          sender: 'assistant',
          message: '',
          isStreaming: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);

        for await (const chunk of result) {
          fullResponse += chunk.text;
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId ? { ...msg, message: fullResponse } : msg
          ));
        }

        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
        ));

      } catch (e) {
        console.error(e);
        const errorMessage = 'Sorry, I encountered an error. Please try again.';
        setError(errorMessage);
        setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId ? { ...msg, message: errorMessage, isStreaming: false } : msg
        ));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderMessage = (message: AiMessage) => {
    if (message.type === 'task_progress' && message.progress) {
        return <TaskProgress steps={message.progress} />;
    }

    const html = DOMPurify.sanitize(marked.parse(message.message) as string);
    return (
        <div className="prose prose-sm max-w-none text-inherit">
            <div dangerouslySetInnerHTML={{ __html: html }} />
            {message.isStreaming && !message.progress && (
                <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1" />
            )}
        </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
            {message.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                    {avatar ? (
                        <img src={avatar} alt="AI Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                            <Bot className="w-5 h-5" />
                        </div>
                    )}
                </div>
            )}
            <div className={`group relative max-w-md md:max-w-lg lg:max-w-xl p-3 rounded-lg ${
              message.sender === 'assistant'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-blue-600 text-white'
            }`}>
              {message.sender === 'assistant' && message.type !== 'task_progress' && !message.isStreaming && message.message && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5 bg-gray-200/80 backdrop-blur-sm p-1 rounded-md">
                  <button onClick={() => handleCopy(message)} title="Copy" className="p-1 text-gray-600 hover:bg-gray-300 rounded">
                    {copied[message.id] ? <Check className="w-4 h-4 text-green-600" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDownloadMD(message)} title="Download as Markdown" className="p-1 text-gray-600 hover:bg-gray-300 rounded">
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDownloadPDF(message)} title="Download as PDF" className="p-1 text-gray-600 hover:bg-gray-300 rounded">
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="text-sm">
                {renderMessage(message)}
              </div>
              <div className={`text-xs mt-1 ${message.sender === 'assistant' ? 'text-gray-500' : 'text-blue-200'}`}>{message.timestamp}</div>
            </div>
            {message.sender === 'user' && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-semibold flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.sender === 'user' && !isActionAgent && (
           <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                    {avatar ? (
                        <img src={avatar} alt="AI Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                            <Bot className="w-5 h-5" />
                        </div>
                    )}
              </div>
              <div className="max-w-md p-3 rounded-lg bg-gray-100 text-gray-800">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isFreeUser ? (
        <div className="border-t border-gray-200">
            <StandardAccountLimits />
        </div>
      ) : (
        <>
          {/* Attached Files List */}
          {allowAttachments && attachedFiles.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                        <div key={index} className="flex flex-col bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm w-full max-w-xs">
                            <div className="flex items-center justify-between p-2 bg-gray-50">
                                <div className="flex items-center space-x-2 truncate">
                                    <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <span className="text-xs font-medium text-gray-700 truncate">{file.name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button 
                                        onClick={() => toggleFilePreview(index)} 
                                        className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-200 transition-colors"
                                        title={file.expanded ? "Hide Preview" : "Show Preview"}
                                    >
                                        {file.expanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                    <button 
                                        onClick={() => removeAttachedFile(index)}
                                        className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-200 transition-colors"
                                        title="Remove file"
                                    >
                                        <XCircle className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            {file.expanded && (
                                <div className="p-2 bg-gray-100 border-t border-gray-200">
                                    <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap overflow-x-auto max-h-32">
                                        {file.preview}
                                    </pre>
                                    <div className="text-[10px] text-gray-400 mt-1 text-center italic">First 5 lines shown</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
          )}

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-end space-x-2">
              {allowAttachments && (
                <>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect}
                        accept=".csv,.txt,.tsv,.dat" // Suggest dataset types
                    />
                    <motion.button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        title="Upload Dataset"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Paperclip className="w-5 h-5" />
                    </motion.button>
                </>
              )}
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                }}
                placeholder={isActionAgent ? 'Describe the changes you want to make... (Shift+Enter for new line)' : 'Ask the AI assistant... (Shift+Enter for new line)'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none overflow-y-auto"
                disabled={isLoading}
                rows={1}
                style={{ minHeight: '40px' }}
              />
              <motion.button
                onClick={handleSendMessage}
                disabled={isLoading || (!newMessage.trim() && attachedFiles.length === 0)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAssistant;
