import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  type?: 'danger' | 'action' | 'info';
  loading?: boolean;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  type = 'info',
  loading = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <ShieldAlert className="w-6 h-6 text-red-600" />;
      case 'action':
        return <AlertTriangle className="w-6 h-6 text-blue-600" />;
      case 'info':
        return <Info className="w-6 h-6 text-slate-600" />;
      default:
        return <Info className="w-6 h-6 text-slate-600" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'action':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'info':
        return 'bg-slate-900 hover:bg-slate-800 text-white';
      default:
        return 'bg-slate-900 hover:bg-slate-800 text-white';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white shadow-2xl rounded-sm overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    type === 'danger' ? 'bg-red-50' : 
                    type === 'action' ? 'bg-blue-50' : 'bg-slate-50'
                  }`}>
                    {getIcon()}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {description && (
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  {description}
                </p>
              )}

              {children}

              <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-3">
                {cancelText && (
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {cancelText}
                  </button>
                )}
                {confirmText && onConfirm && (
                  <button
                    onClick={onConfirm}
                    disabled={loading}
                    className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm transition-all shadow-lg ${getButtonClass()} disabled:opacity-50`}
                  >
                    {loading ? 'Processing...' : confirmText}
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
