import { useState, useCallback } from 'react';

export const useHistory = <T,>(initialPresent: T) => {
    const [state, setState] = useState<{ past: T[], present: T, future: T[] }>({
        past: [], present: initialPresent, future: [],
    });
    const canUndo = state.past.length !== 0;
    const canRedo = state.future.length !== 0;

    const set = useCallback((newPresent: T | ((prevState: T) => T), skipHistory = false) => {
        setState(s => {
            const newPresentValue = typeof newPresent === 'function' ? (newPresent as (prevState: T) => T)(s.present) : newPresent;
            
            if (skipHistory) {
                return { ...s, present: newPresentValue };
            }
            
            if (JSON.stringify(newPresentValue) === JSON.stringify(s.present)) return s;

            return { past: [...s.past, s.present], present: newPresentValue, future: [] };
        });
    }, []);

    const undo = useCallback(() => {
        setState(s => {
            if (s.past.length === 0) return s;
            const previous = s.past[s.past.length - 1];
            const newPast = s.past.slice(0, s.past.length - 1);
            return { past: newPast, present: previous, future: [s.present, ...s.future] };
        });
    }, []);

    const redo = useCallback(() => {
        setState(s => {
            if (s.future.length === 0) return s;
            const next = s.future[0];
            const newFuture = s.future.slice(1);
            return { past: [...s.past, s.present], present: next, future: newFuture };
        });
    }, []);
    
    const reset = useCallback((newInitialState: T) => {
        setState({ past: [], present: newInitialState, future: [] });
    }, []);

    return [state, set, undo, redo, canUndo, canRedo, reset] as const;
};