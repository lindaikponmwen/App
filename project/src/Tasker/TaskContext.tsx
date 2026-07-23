
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Task, TASK_STORAGE_KEY, TEXTS } from './taskConfig';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
}

interface TaskContextType {
  tasks: Task[];
  addTask: (text: string) => void;
  addToast: (title: string, message: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTaskText: (id: string, text: string) => void;
  // Timer controls
  setTaskTimer: (id: string, minutes: number) => void;
  toggleTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  // Notifications
  hasUnreadNotifications: boolean;
  markNotificationsRead: () => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTasker = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasker must be used within a TaskProvider');
  return context;
};

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Load initial state
  useEffect(() => {
    const saved = localStorage.getItem(TASK_STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load tasks', e);
      }
    }
  }, []);

  // Save state on change
  useEffect(() => {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Global Timer Loop
  useEffect(() => {
    timerIntervalRef.current = window.setInterval(() => {
      setTasks(prevTasks => {
        let hasUpdates = false;
        const nextTasks = prevTasks.map(task => {
          if (task.isRunning && task.remainingTime !== undefined && task.remainingTime > 0) {
            hasUpdates = true;
            const newTime = task.remainingTime - 1;
            
            // Check for completion
            if (newTime === 0) {
              handleTimerCompletion(task);
              return { ...task, remainingTime: 0, isRunning: false, isTimerCompleted: true };
            }
            
            return { ...task, remainingTime: newTime };
          }
          return task;
        });
        
        return hasUpdates ? nextTasks : prevTasks;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleTimerCompletion = (task: Task) => {
    console.log(`Task Completed: ${task.text} - Time Completed Status`);
    setHasUnreadNotifications(true);
    addToast('Timer Completed', `${TEXTS.TIMER_COMPLETED_MSG} "${task.text}"`);
  };

  const addToast = (title: string, message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, title, message }]);
    // Auto remove after 5 seconds
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addTask = (text: string) => {
    if (!text.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now()
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTaskText = (id: string, text: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text: text.trim() } : t));
  };

  const setTaskTimer = (id: string, minutes: number) => {
    const seconds = minutes * 60;
    setTasks(prev => prev.map(t => t.id === id ? { 
      ...t, 
      timerDuration: seconds, 
      remainingTime: seconds, 
      isRunning: false, 
      isTimerCompleted: false 
    } : t));
  };

  const toggleTimer = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      // If completed, do not toggle
      if (t.isTimerCompleted) return t;
      return { ...t, isRunning: !t.isRunning };
    }));
  };

  const resetTimer = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { 
        ...t, 
        remainingTime: t.timerDuration, 
        isRunning: false, 
        isTimerCompleted: false 
      };
    }));
  };

  const markNotificationsRead = () => {
    setHasUnreadNotifications(false);
  };

  const value = {
    tasks,
    addTask,
    addToast,
    toggleTask,
    deleteTask,
    updateTaskText,
    setTaskTimer,
    toggleTimer,
    resetTimer,
    hasUnreadNotifications,
    markNotificationsRead,
    toasts,
    removeToast
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
