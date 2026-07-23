import { useState, useEffect, useRef, useCallback } from 'react';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
const LOCK_STATE_KEY = 'session_locked';

export function useInactivityLock(isAuthenticated: boolean) {
  // Check sessionStorage for existing lock state on initialization
  const [isLocked, setIsLocked] = useState(() => {
    if (isAuthenticated) {
      const locked = sessionStorage.getItem(LOCK_STATE_KEY);
      return locked === 'true';
    }
    return false;
  });
  const timeoutRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const lockSession = useCallback(() => {
    setIsLocked(true);
    sessionStorage.setItem(LOCK_STATE_KEY, 'true');
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isAuthenticated && !isLocked) {
      timeoutRef.current = window.setTimeout(() => {
        lockSession();
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, isLocked, lockSession]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    sessionStorage.removeItem(LOCK_STATE_KEY);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLocked(false);
      sessionStorage.removeItem(LOCK_STATE_KEY);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Check if session is already locked on mount
    const lockedState = sessionStorage.getItem(LOCK_STATE_KEY);
    if (lockedState === 'true') {
      setIsLocked(true);
      return; // Don't set up activity listeners if already locked
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleActivity = () => {
      if (!isLocked) {
        resetTimer();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated, isLocked, resetTimer]);

  return { isLocked, unlock };
}
