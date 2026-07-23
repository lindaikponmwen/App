
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Edit2, Check, Calendar, Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { useTasker } from './TaskContext';
import { Task, TEXTS, ICONS } from './taskConfig';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function TaskModal({ isOpen, onClose }: TaskModalProps) {
  const { 
    tasks, 
    addTask, 
    toggleTask, 
    deleteTask, 
    updateTaskText, 
    setTaskTimer, 
    toggleTimer, 
    resetTimer,
    markNotificationsRead
  } = useTasker();

  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Local state for setting new timer
  const [timerSetupId, setTimerSetupId] = useState<string | null>(null);
  const [timerInput, setTimerInput] = useState('30'); // Default 30 mins

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      markNotificationsRead();
    }
  }, [isOpen, markNotificationsRead]);

  const handleAddTask = () => {
    if (!inputValue.trim()) return;
    addTask(inputValue);
    setInputValue('');
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditValue(task.text);
    setTimerSetupId(null);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      updateTaskText(editingId, editValue);
    }
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const openTimerSetup = (task: Task) => {
    if (timerSetupId === task.id) {
        setTimerSetupId(null); // toggle off
    } else {
        setTimerSetupId(task.id);
        setTimerInput('30');
    }
  };

  const confirmTimer = (id: string) => {
    const mins = parseInt(timerInput, 10);
    if (!isNaN(mins) && mins > 0) {
        setTaskTimer(id, mins);
    }
    setTimerSetupId(null);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ICONS.Main className="w-7 h-7 text-blue-600" />
                {TEXTS.MODAL_TITLE}
              </h2>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Calendar className="w-4 h-4 mr-2" />
                {todayDate}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 text-gray-500 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-gray-600 uppercase tracking-wider">
              <span>{TEXTS.PROGRESS_LABEL}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-300 h-3">
              <div 
                className="bg-blue-600 h-3 transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex gap-0 border border-gray-300">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder={TEXTS.INPUT_PLACEHOLDER}
              className="flex-1 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddTask}
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>{TEXTS.EMPTY_STATE}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 border-b border-gray-200">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`group flex items-center justify-between p-4 transition-all ${
                    task.completed ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Left Side: Checkbox + Text */}
                  <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center transition-colors ${
                        task.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400 hover:border-blue-600 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingId === task.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <button onClick={saveEdit} className="text-white bg-green-600 hover:bg-green-700 px-2"><Check className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="text-white bg-red-600 hover:bg-red-700 px-2"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <span 
                            className={`text-base block truncate cursor-pointer select-none ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                            onClick={() => toggleTask(task.id)}
                        >
                          {task.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Timer & Actions */}
                  <div className="flex items-center gap-2">
                    
                    {/* Timer Logic */}
                    {task.timerDuration ? (
                        <div className={`flex items-center border rounded px-2 py-1 gap-2 ${task.isTimerCompleted ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                            <span className={`font-mono text-sm font-medium ${task.isTimerCompleted ? 'text-red-600' : 'text-blue-700'}`}>
                                {formatTime(task.remainingTime || 0)}
                            </span>
                            {!task.isTimerCompleted && (
                                <button onClick={() => toggleTimer(task.id)} className="text-blue-600 hover:text-blue-800">
                                    {task.isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                </button>
                            )}
                            <button onClick={() => resetTimer(task.id)} className="text-gray-400 hover:text-gray-600">
                                <RotateCcw className="w-3 h-3" />
                            </button>
                        </div>
                    ) : timerSetupId === task.id ? (
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded animate-fade-in">
                            <input 
                                type="number" 
                                className="w-12 text-sm px-1 py-0.5 border border-gray-300 text-center"
                                value={timerInput}
                                onChange={(e) => setTimerInput(e.target.value)}
                                min="1"
                                max="999"
                                autoFocus
                            />
                            <span className="text-xs text-gray-500">min</span>
                            <button onClick={() => confirmTimer(task.id)} className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"><Check className="w-3 h-3"/></button>
                            <button onClick={() => setTimerSetupId(null)} className="text-gray-500 hover:bg-gray-200 p-1 rounded"><X className="w-3 h-3"/></button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => openTimerSetup(task)} 
                            className={`p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 ${editingId ? 'hidden' : ''}`} 
                            title="Set Timer"
                        >
                            <Clock className="w-4 h-4" />
                        </button>
                    )}

                    {/* Basic Actions */}
                    {!editingId && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditing(task)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
