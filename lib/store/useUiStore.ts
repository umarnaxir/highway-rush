'use client';

import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error' | 'trophy' | 'achievement' | 'reward';

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
  duration: number;
}

interface UiStore {
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id' | 'duration'> & { duration?: number }) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

let counter = 0;

export const useUiStore = create<UiStore>()((set, get) => ({
  toasts: [],
  pushToast: (toast) => {
    counter += 1;
    const id = `toast-${Date.now()}-${counter}`;
    const item: ToastItem = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.kind === 'trophy' ? 6200 : 4200),
    };
    set((state) => ({ toasts: [...state.toasts.slice(-3), item] }));
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (get().toasts.some((entry) => entry.id === id)) {
          set((state) => ({ toasts: state.toasts.filter((entry) => entry.id !== id) }));
        }
      }, item.duration);
    }
    return id;
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));
