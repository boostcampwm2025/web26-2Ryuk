'use client';

import { create } from 'zustand';

type ActivePanelId = 'global-chat-panel' | 'local-chat-panel' | null;

interface ChatPanelState {
  activePanelId: ActivePanelId;
  setActive: (id: ActivePanelId) => void;
}

export const chatPanelStore = create<ChatPanelState>((set) => ({
  activePanelId: null,
  setActive: (id) => set({ activePanelId: id }),
}));
