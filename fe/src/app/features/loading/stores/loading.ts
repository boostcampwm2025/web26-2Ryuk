'use client';

import { create } from 'zustand';

interface LoadingState {
  loading: boolean;
}

interface LoadingActions {
  show: () => void;
  hide: () => void;
  setLoading: (loading: boolean) => void;
}

export type LoadingStore = LoadingState & LoadingActions;

export const loadingStore = create<LoadingStore>((set) => ({
  loading: false,
  show: () => set({ loading: true }),
  hide: () => set({ loading: false }),
  setLoading: (loading: boolean) => set({ loading }),
}));
