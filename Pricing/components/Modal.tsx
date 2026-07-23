import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionStyle?: 'blue' | 'red' | 'black';
  secondaryLabel?: string;
  secondaryAction?: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
  children?: React.ReactNode;
  preventAutoClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  actionLabel,
  onAction,
  actionStyle = 'blue',
  secondaryLabel,
  secondaryAction,
  type = 'info',
  children,
  preventAutoClose = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'error': return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'info': return <Info className="w-6 h-6 text-blue-500" />;
      default: return null;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success': return 'bg-emerald-50';
      case 'error': return 'bg-red-50';
      case 'warning': return 'bg-amber-50';
      case 'info': return 'bg-blue-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md bg-white rounded-sm shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${getIconBg()} rounded-full flex items-center justify-center`}>
                    {getIcon()}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-slate-900 transition-colors">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {message && (
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  {message}
                </p>
              )}

              {children}

              <div className="flex flex-col space-y-3 mt-8">
                {onAction && actionLabel && (
                  <button 
                    onClick={() => {
                      if (onAction) onAction();
                      if (!preventAutoClose) onClose();
                    }}
                    className={`w-full py-4 text-white text-xs font-bold uppercase tracking-widest transition-colors ${
                      actionStyle === 'red' ? 'bg-red-600 hover:bg-red-700' : 
                      actionStyle === 'black' ? 'bg-slate-900 hover:bg-slate-800' : 
                      'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {actionLabel}
                  </button>
                )}
                
                {secondaryLabel && secondaryLabel !== 'none' && (
                  <button 
                    onClick={() => {
                      if (secondaryAction) secondaryAction();
                      onClose();
                    }}
                    className="w-full py-4 bg-white text-slate-900 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                  >
                    {secondaryLabel}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};