
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { useTasker } from './TaskContext';

export default function Toast() {
  const { toasts, removeToast } = useTasker();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="pointer-events-auto bg-white border border-gray-200 shadow-lg p-4 rounded-lg flex items-start gap-3 w-80"
          >
            <div className="bg-red-100 p-2 rounded-full text-red-600">
                <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-sm">{toast.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
            </div>
            <button 
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600"
            >
                <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
