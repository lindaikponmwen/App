
import React from 'react';
import { APP_CONFIG } from '../data/config';
import { Loader2, CheckCircle, Circle } from 'lucide-react';

interface LoadingScreenProps {
  message: string;
  completedSteps: string[];
}

const ALL_STEPS = [
  'Migrating Storage',
  'Initializing R Engine',
  'Loading Datasets',
  'Mounting Filesystem'
];

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, completedSteps }) => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#f8fafc] text-center p-8 animate-in fade-in duration-500">
      <div className="flex flex-col -space-y-1 mb-8">
        <h1 className="text-3xl font-black text-[#1a1f24] tracking-tighter uppercase leading-tight">
          {APP_CONFIG.branding.title}<span className="text-blue-600">{APP_CONFIG.branding.titleAccent}</span>
        </h1>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] leading-tight whitespace-nowrap">{APP_CONFIG.branding.subTitle}</span>
      </div>

      <div className="relative mb-6">
        <div className="absolute -inset-2 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin relative z-10" strokeWidth={2} />
      </div>

      <p className="text-sm font-medium text-gray-600 mb-8 h-5">{message}</p>

      <div className="w-full max-w-sm border-t border-gray-200 pt-6">
        <div className="space-y-3">
          {ALL_STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step);
            // Check if the current loading message contains a keyword from the step, e.g., "Engine" for "Initializing R Engine"
            const isRunning = !isCompleted && message.toLowerCase().includes(step.toLowerCase().split(' ')[1]);
            
            return (
              <div key={step} className={`flex items-center justify-between p-3 transition-all duration-300 rounded-none ${
                isCompleted ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-100'
              }`}>
                <span className={`text-xs font-bold uppercase tracking-widest ${
                  isCompleted ? 'text-green-700' : 'text-gray-400'
                }`}>
                  {step}
                </span>
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle size={14} className="text-green-500" />
                  ) : isRunning ? (
                    <Loader2 size={14} className="text-blue-500 animate-spin" />
                  ) : (
                    <Circle size={14} className="text-gray-200" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-12 absolute bottom-8">
        &copy; {new Date().getFullYear()} Pharmacometrics AI. All rights reserved.
      </p>
    </div>
  );
};

export default LoadingScreen;
