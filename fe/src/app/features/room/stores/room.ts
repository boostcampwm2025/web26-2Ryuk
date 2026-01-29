'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { RoomData, RoomParticipantData as PData } from '@/app/features/room/dtos/data';

interface RoomState {
  roomId?: string;
  isJoined: boolean;
  roomData?: RoomData;
  isGameRecruiting: boolean;
}

interface RoomActions {
  setRoom: (roomId?: string) => void;
  setRoomData: (roomData?: RoomData) => void;
  updateRoomData: (updates: Partial<RoomData>) => void;
  setIsGameRecruiting: (isGameRecruiting: boolean) => void;
  addParticipant: (participant: PData) => void;
  removeParticipant: (userId: string) => void;
  setJoined: (isJoined: boolean) => void;
  leaveRoom: () => void;
}

export type RoomStore = RoomState & RoomActions;

export const roomStore = create<RoomStore>()(
  persist(
    (set) => ({
      roomId: undefined,
      isJoined: false,
      roomData: undefined,
      isGameRecruiting: false,

      setRoom: (roomId?: string) =>
        set((state) => {
          const roomData = state.roomData?.id === roomId ? state.roomData : undefined;
          return { roomId, isJoined: false, roomData, isGameRecruiting: false };
        }),

      setRoomData: (roomData?: RoomData) => {
        const roomId = roomData?.id;
        set({ roomData, roomId, isGameRecruiting: roomData?.isGameRecruiting ?? false });
      },

      updateRoomData: (updates: Partial<RoomData>) =>
        set((state) => {
          const next: Partial<RoomState> = {};
          if (state.roomData) next.roomData = { ...state.roomData, ...updates };
          else if (updates.currentParticipants != null && state.roomId) {
            next.roomData = {
              id: state.roomId,
              title: updates.title ?? '',
              tags: updates.tags ?? [],
              hostId: updates.hostId ?? '',
              maxParticipants: updates.maxParticipants ?? 0,
              currentParticipants: updates.currentParticipants,
              participants: [],
              createDate: updates.createDate ?? new Date(),
              isMicAvailable: updates.isMicAvailable ?? false,
              isPrivate: updates.isPrivate ?? false,
            };
          }
          if (typeof updates.isGameRecruiting === 'boolean') {
            next.isGameRecruiting = updates.isGameRecruiting;
          }
          return next;
        }),

      setIsGameRecruiting: (isGameRecruiting: boolean) => set({ isGameRecruiting }),

      addParticipant: (participant: PData) =>
        set((state) => {
          if (!state.roomData) return state;
          const exists = state.roomData.participants.some((p) => p.userId === participant.userId);
          const participants = [...state.roomData.participants, participant];
          if (exists) return state;
          return { roomData: { ...state.roomData, participants } };
        }),

      removeParticipant: (userId: string) =>
        set((state) => {
          if (!state.roomData) return state;
          const participants = state.roomData.participants.filter((p) => p.userId !== userId);
          return { roomData: { ...state.roomData, participants } };
        }),

      setJoined: (isJoined: boolean) => set({ isJoined }),

      leaveRoom: () =>
        set({ roomId: undefined, isJoined: false, roomData: undefined, isGameRecruiting: false }),
    }),
    {
      name: 'room-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ roomId: state.roomId, isJoined: state.isJoined }),
    },
  ),
);
