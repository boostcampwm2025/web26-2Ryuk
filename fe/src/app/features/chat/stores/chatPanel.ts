'use client';

import { create } from 'zustand';

type ActivePanelId = 'global-chat-panel' | 'local-chat-panel' | undefined;

interface ChatPanelState {
  activePanelId: ActivePanelId;
  setActive: (id: ActivePanelId) => void;
}

export const chatPanelStore = create<ChatPanelState>((set) => ({
  activePanelId: undefined,
  setActive: (id) => set({ activePanelId: id }),
}));
