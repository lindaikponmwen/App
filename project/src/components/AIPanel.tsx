import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Maximize2, Minimize2 } from 'lucide-react';
import AIAssistant from './AIAssistant';
import { agents } from '../data/agents';

interface AIPanelProps {
  defaultAgentName: string;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ defaultAgentName, isOpen, onToggle }) => {
    const [internalIsCollapsed, setInternalIsCollapsed] = useState(true);
    
    // Filter out Dr. Levy from the available agents for this panel
    const availableAgents = agents.filter(a => a.name !== 'Dr. Levy');
    
    const [selectedAgent, setSelectedAgent] = useState(() => 
        availableAgents.find(a => a.name === defaultAgentName) || availableAgents[0]
    );

    const isCollapsed = isOpen !== undefined ? !isOpen : internalIsCollapsed;

    const handleToggle = () => {
        if (onToggle) {
            onToggle(isCollapsed);
        } else {
            setInternalIsCollapsed(!internalIsCollapsed);
        }
    };

    return (
        <div className={`${isCollapsed ? 'h-12' : 'h-80'} bg-white border-t border-zinc-200 flex flex-col transition-all duration-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]`}>
            <div className="px-4 py-2 border-b border-zinc-200 flex items-center bg-zinc-50/50">
                <div className="flex items-center space-x-3 w-full">
                    <motion.button
                        onClick={handleToggle}
                        className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-white rounded-md transition-all border border-zinc-200 hover:border-blue-100 shadow-sm"
                        title={isCollapsed ? 'Expand AI assistant' : 'Collapse AI assistant'}
                    >
                        {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                    </motion.button>
                    <div className="flex items-center space-x-2 flex-1">
                        <div className="p-1 bg-blue-50 rounded-md">
                            <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <select
                            value={selectedAgent.name}
                            onChange={(e) => setSelectedAgent(availableAgents.find(a => a.name === e.target.value) || availableAgents[0])}
                            className="text-sm font-bold text-zinc-900 bg-transparent border-0 focus:ring-0 p-0 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                            {availableAgents.map(agent => (
                                <option key={agent.name} value={agent.name}>{agent.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        className="flex-1 overflow-hidden"
                        transition={{ duration: 0.3 }}
                    >
                       <AIAssistant systemInstruction={selectedAgent.systemInstruction} key={selectedAgent.name} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIPanel;