import React, { useState } from 'react';
import { Sparkles, Send, X, Loader2, Bot, User } from 'lucide-react';
import { modifyRCode } from '../services/geminiService';

interface AiPanelProps {
  currentCode: string;
  onClose: () => void;
  width: number;
}

interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
}

const AiPanel: React.FC<AiPanelProps> = ({ currentCode, onClose, width }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    
    const userMsg = prompt.trim();
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setPrompt('');
    setIsProcessing(true);

    try {
      const response = await modifyRCode(currentCode, userMsg);
      setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Request failed. Please verify system connectivity and API permissions." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="h-full bg-white border-l border-gray-200 flex flex-col shadow-2xl z-30 animate-in slide-in-from-right duration-300 rounded-none"
      style={{ width: `${width}px` }}
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-none shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" />
          <h2 className="font-bold text-sm text-gray-700 uppercase tracking-wider">AI Assistant</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-none">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 rounded-none custom-scrollbar bg-gray-50/20">
        {chatHistory.length === 0 && (
          <div className="text-center py-10 px-4">
            <div className="inline-flex p-3 bg-blue-50 rounded-full mb-4">
               <Bot size={24} className="text-blue-600" />
            </div>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              I can analyze your R code, suggest improvements, or explain specific functions. 
              Note: I cannot modify your script directly.
            </p>
          </div>
        )}

        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-center gap-1.5 mb-1 text-[8px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-gray-400' : 'text-blue-600'}`}>
              {msg.role === 'user' ? <><User size={10} /> Operator</> : <><Bot size={10} /> Assistant</>}
            </div>
            <div className={`max-w-[90%] p-3 text-[11px] font-medium leading-relaxed border ${
              msg.role === 'user' 
                ? 'bg-white border-gray-200 text-gray-800' 
                : 'bg-blue-600 border-blue-600 text-white shadow-md'
            }`}>
              <div className="whitespace-pre-wrap font-mono text-[10px]">{msg.text}</div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-start gap-2 animate-pulse">
            <div className="p-3 bg-gray-100 border border-gray-200 rounded-none">
              <Loader2 size={14} className="text-blue-600 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-white rounded-none shrink-0">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about this code..."
            className="w-full p-3 pr-10 text-[11px] border border-gray-200 focus:border-blue-500 focus:ring-0 outline-none resize-none h-20 rounded-none font-medium"
            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
          />
          <button 
            onClick={handleAsk}
            disabled={isProcessing || !prompt.trim()}
            className="absolute bottom-3 right-3 p-2 bg-[#1a1f24] text-white hover:bg-black disabled:opacity-30 transition-all rounded-none"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiPanel;