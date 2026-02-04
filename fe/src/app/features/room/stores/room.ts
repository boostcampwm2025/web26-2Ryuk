'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { RoomData, RoomParticipantData } from '@/app/features/room/dtos/data';
import { GamePlayerData } from '@/app/features/game/dtos/data';

type RoomState = Partial<RoomData>;

const createEmptyRoomState = (): RoomState => ({
  id: undefined,
  title: undefined,
  tags: [],
  hostId: undefined,
  currentParticipants: undefined,
  maxParticipants: undefined,
  isMicAvailable: undefined,
  isPrivate: undefined,
  isGameRecruiting: undefined,
  participants: [],
  players: [],
  createDate: undefined,
});

interface RoomActions {
  replaceRoom: (room: RoomData) => void;
  updateRoom: (patch: Partial<RoomData>) => void;
  updateHost: (hostId: string) => void;
  addParticipant: (participant: RoomParticipantData) => void;
  removeParticipant: (userId: string) => void;
  addPlayer: (player: GamePlayerData) => void;
  removePlayer: (playerId: string) => void;
  resetRoom: () => void;
}

export type RoomStore = RoomState & RoomActions;

export const roomStore = create<RoomStore>()(
  persist(
    (set) => {
      const emptyState = createEmptyRoomState();

      return {
        ...emptyState,

        replaceRoom: (room) => set(() => ({ ...room })),
        updateRoom: (patch) => set((state) => ({ ...state, ...patch })),

        updateHost: (hostId) => set((state) => ({ ...state, hostId })),

        addParticipant: (participant) =>
          set((state) => {
            const existing = state.participants ?? [];
            if (existing.some((p) => p.userId === participant.userId)) return {};
            return {
              participants: [...existing, participant],
            };
          }),

        removeParticipant: (userId) =>
          set((state) => {
            const participants = state.participants ?? [];
            if (!participants.length) return {};
            const next = participants.filter((p) => p.userId !== userId);
            if (next.length === participants.length) return {};
            return { participants: next };
          }),

        addPlayer: (player) =>
          set((state) => {
            const existing = state.players ?? [];
            if (existing.some((p) => p.playerId === player.playerId)) return {};
            return { players: [...existing, player] };
          }),

        removePlayer: (playerId) =>
          set((state) => {
            const players = state.players ?? [];
            if (!players.length) return {};
            const next = players.filter((p) => p.playerId !== playerId);
            if (next.length === players.length) return {};
            return { players: next };
          }),

        resetRoom: () => {
          set(() => ({ ...createEmptyRoomState() }));
          localStorage.removeItem('room-storage');
        },
      };
    },
    {
      name: 'room-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
