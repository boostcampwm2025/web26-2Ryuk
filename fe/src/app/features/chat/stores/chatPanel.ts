'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatPanelType, Position, ActivePanelId } from '@/app/features/chat/components/type';

export type MoveReason = 'user-drag' | 'system-adjust' | 'viewport-adjust';

export type PanelState = {
  visible: boolean;
  isExpanded: boolean;
  savedPosition: Position;
  position: Position;
  hydrated: boolean;
};

const DEFAULT_POSITION: Position = { x: 2000, y: 2000 };

function createInitialPanelState(position: Position = DEFAULT_POSITION): PanelState {
  return {
    visible: false,
    isExpanded: false,
    savedPosition: { ...position },
    position: { ...position },
    hydrated: false,
  };
}

const CHAT_PANEL_TYPES: ChatPanelType[] = ['global', 'local'];

type PanelStateMap = Record<ChatPanelType, PanelState>;

type ChatPanelStoreState = PanelStateMap & {
  activePanelId: ActivePanelId;

  show: (type: ChatPanelType) => void;
  hide: (type: ChatPanelType) => void;
  setExpanded: (type: ChatPanelType, expanded: boolean) => void;
  updatePosition: (type: ChatPanelType, position: Position, reason: MoveReason) => void;
  setActive: (id: ActivePanelId) => void;
};

function updatePositionForReason(
  _state: PanelState,
  position: Position,
  reason: MoveReason,
): Partial<PanelState> {
  const next: Partial<PanelState> = { position: { ...position } };
  if (reason === 'user-drag' || reason === 'viewport-adjust') {
    next.savedPosition = { ...position };
  }
  return next;
}

type PersistedPanelState = {
  savedPosition?: Position;
  isExpanded?: boolean;
  visible?: boolean;
};

type PersistedChatPanelState = Partial<Record<ChatPanelType, PersistedPanelState>>;

export const chatPanelStore = create<ChatPanelStoreState>()(
  persist(
    (set) => ({
      global: createInitialPanelState(),
      local: createInitialPanelState(),
      activePanelId: undefined as ActivePanelId,

      setActive: (id) => set({ activePanelId: id }),

      show: (type) =>
        set((state) => {
          const panel = state[type];
          return {
            ...state,
            [type]: { ...panel, visible: true },
          };
        }),

      hide: (type) =>
        set((state) => {
          const panel = state[type];
          return {
            ...state,
            [type]: { ...panel, visible: false },
          };
        }),

      setExpanded: (type, expanded) =>
        set((state) => {
          const panel = state[type];
          return {
            ...state,
            [type]: { ...panel, isExpanded: expanded },
          };
        }),

      updatePosition: (type, position, reason) =>
        set((state) => {
          const panel = state[type];
          return {
            ...state,
            [type]: {
              ...panel,
              ...updatePositionForReason(panel, position, reason),
            },
          };
        }),
    }),
    {
      name: 'chat-panel-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const partial: Partial<Record<ChatPanelType, PersistedPanelState>> = {};
        CHAT_PANEL_TYPES.forEach((type) => {
          const panel = state[type];
          partial[type] = {
            savedPosition: panel.savedPosition,
            isExpanded: panel.isExpanded,
            visible: panel.visible,
          };
        });
        return partial;
      },
      merge: (persisted, current) => {
        const persistedPanels = persisted as PersistedChatPanelState;
        const mergedPanels: Record<ChatPanelType, PanelState> = {} as Record<
          ChatPanelType,
          PanelState
        >;
        CHAT_PANEL_TYPES.forEach((type) => {
          const panel = current[type];
          const savedPosition = persistedPanels[type]?.savedPosition ?? panel.savedPosition;
          mergedPanels[type] = {
            ...panel,
            savedPosition,
            position: { ...savedPosition },
            isExpanded: persistedPanels[type]?.isExpanded ?? panel.isExpanded,
            visible: persistedPanels[type]?.visible ?? panel.visible,
            hydrated: true,
          };
        });
        return {
          ...current,
          ...mergedPanels,
        };
      },
    },
  ),
);

export const DEFAULT_PANEL_POSITION = DEFAULT_POSITION;

export function isDefaultPosition(p: Position): boolean {
  return p.x === DEFAULT_POSITION.x && p.y === DEFAULT_POSITION.y;
}
