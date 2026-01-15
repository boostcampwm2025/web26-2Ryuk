'use client';

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
}

interface ToastActions {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showInfoToast: (message: string) => void;
  removeToast: (id: string) => void;
}

type ToastStore = ToastState & ToastActions;

export const toastStore = create<ToastStore>((set) => ({
  toasts: [],

  showToast: (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  showSuccessToast: (message: string) => {
    toastStore.getState().showToast(message, 'success');
  },

  showErrorToast: (message: string) => {
    toastStore.getState().showToast(message, 'error');
  },

  showInfoToast: (message: string) => {
    toastStore.getState().showToast(message, 'info');
  },

  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
