//src/plugin/pptx/useHistory.ts
import { useState, useCallback } from 'react';

export const useHistory = <T,>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const setState = useCallback((action: T | ((prevState: T) => T), skipHistory: boolean = false) => {
    if (skipHistory) {
        setHistory(prevHistory => {
            const newHistory = [...prevHistory];
            newHistory[index] = typeof action === 'function' 
                ? (action as (prevState: T) => T)(newHistory[index]) 
                : action;
            return newHistory;
        });
        return;
    }

    setHistory(prevHistory => {
      const currentState = prevHistory[index];
      const newState = typeof action === 'function' 
        ? (action as (prevState: T) => T)(currentState) 
        : action;
      
      // If the new state is the same as the current one, do nothing.
      if (JSON.stringify(newState) === JSON.stringify(currentState)) {
          return prevHistory;
      }

      // When a new state is set, clear any "redo" history.
      const newHistory = prevHistory.slice(0, index + 1);
      newHistory.push(newState);
      
      setIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [index]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(prevIndex => prevIndex - 1);
    }
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(prevIndex => prevIndex + 1);
    }
  }, [index, history.length]);

  return {
    state: history[index],
    setState,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
};
