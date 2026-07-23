import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, File, Folder, ChevronDown, Clock, Keyboard, ExternalLink, BookOpen } from 'lucide-react';
import { helpAgents, helpPages, HelpAgent, HelpPage, HelpFolder, timeManagementFeatures, HelpFeature } from '../help/helpData';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-gray-200">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-50 w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: 'calc(100vh - 80px)', maxHeight: '800px' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
          <h2 id="help-modal-title" className="text-xl font-bold text-gray-900">Application Guide</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100" aria-label="Close dialog">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Accordion title="Comprehensive Documentation">
            <div className="flex items-start space-x-4">
              <BookOpen className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Full Documentation</p>
                <p className="text-sm text-gray-600 mb-3">
                  Access our full documentation suite for deep dives into how the project app works with pharmacokinetic modeling, 
                  platform features, and advanced workflows.
                </p>
                <a 
                  href="http://docs.drlevy.ai/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 border border-blue-100 hover:border-blue-200"
                >
                  <span>Go to Documentation</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Accordion>

          <Accordion title="AI Agents">
            <div className="space-y-4">
              {helpAgents.map((agent: HelpAgent) => (
                <div key={agent.name} className="flex items-start space-x-4">
                  <Bot className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">{agent.name}</p>
                    <p className="text-sm text-gray-600">{agent.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Accordion>

          <Accordion title="Pages & Folders">
             <div className="space-y-6">
              {helpPages.map((page: HelpPage) => (
                <div key={page.path} className="flex items-start space-x-4">
                  <File className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{page.name}</p>
                    <p className="text-sm text-gray-600">{page.description}</p>
                    {page.folders && page.folders.length > 0 && (
                       <div className="mt-3 space-y-2">
                         {page.folders.map((folder: HelpFolder) => (
                           <div key={folder.name} className="flex items-start space-x-3 pl-2 border-l-2 border-gray-200">
                             <Folder className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                             <div>
                                <p className="font-medium text-sm text-gray-700">{folder.name}</p>
                                <p className="text-sm text-gray-500">{folder.description}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Accordion>

          <Accordion title="Task & Time Management">
            <div className="space-y-4">
              {timeManagementFeatures.map((feature: HelpFeature) => (
                <div key={feature.name} className="flex items-start space-x-4">
                  <Clock className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">{feature.name}</p>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Accordion>

          <Accordion title="Keyboard Shortcuts">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <Keyboard className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                    <div>
                      <p className="font-semibold text-gray-800">Save File</p>
                      <p className="text-sm text-gray-600">Save the current file content.</p>
                    </div>
                    <div className="bg-gray-100 px-2 py-1 text-xs font-mono font-bold text-gray-700 border border-gray-200">
                      Ctrl + S
                    </div>
                  </div>
                  {/* Add more shortcuts here as they are implemented */}
                </div>
              </div>
            </div>
          </Accordion>
        </div>

        <div className="p-4 bg-white border-t border-gray-200 text-right">
            <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;