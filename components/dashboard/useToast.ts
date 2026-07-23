'use client';

import { useCallback, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  show: boolean;
  msg: string;
  type: ToastType;
}

const INITIAL_TOAST: ToastState = { show: false, msg: '', type: 'info' };

/**
 * Provides toast notification state plus a function to show a message that
 * auto-dismisses after 4 seconds.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(INITIAL_TOAST);

  /**
   * Displays a toast with the given message and type, then hides it again
   * after a fixed delay.
   */
  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(INITIAL_TOAST), 4000);
  }, []);

  return { toast, showToast };
}
