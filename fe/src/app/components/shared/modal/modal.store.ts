'use client';

import { create } from 'zustand';

interface ModalState {
  openModals: Set<string>;
}

interface ModalActions {
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  isOpen: (id: string) => boolean;
}

type ModalStore = ModalState & ModalActions;

export const modalStore = create<ModalStore>((set, get) => ({
  openModals: new Set<string>(),

  openModal: (id: string) => {
    set((state) => {
      const next = new Set(state.openModals);
      next.add(id);
      return { openModals: next };
    });
  },

  closeModal: (id: string) => {
    set((state) => {
      const next = new Set(state.openModals);
      next.delete(id);
      return { openModals: next };
    });
  },

  isOpen: (id: string) => {
    return get().openModals.has(id);
  },
}));
