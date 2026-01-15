'use client';

import { create } from 'zustand';
import { RoomData, SimpleParticipant } from '../dtos/type';

interface RoomState {
  roomId: string | null;
  isJoined: boolean;
  roomData: RoomData | null;
}

interface RoomActions {
  setRoom: (roomId: string | null) => void;
  setRoomData: (roomData: RoomData | null) => void;
  updateRoomData: (updates: Partial<RoomData>) => void;
  addParticipant: (participant: SimpleParticipant) => void;
  removeParticipant: (userId: string) => void;
  setJoined: (isJoined: boolean) => void;
  leaveRoom: () => void;
}

export type RoomStore = RoomState & RoomActions;

export const roomStore = create<RoomStore>((set) => ({
  roomId: null,
  isJoined: false,
  roomData: null,

  setRoom: (roomId: string | null) =>
    set((state) => ({
      roomId,
      isJoined: false,
      roomData: state.roomData?.id === roomId ? state.roomData : null,
    })),
  setRoomData: (roomData: RoomData | null) => set({ roomData, roomId: roomData?.id || null }),
  updateRoomData: (updates: Partial<RoomData>) =>
    set((state) => ({ roomData: state.roomData ? { ...state.roomData, ...updates } : null })),
  addParticipant: (participant: SimpleParticipant) =>
    set((state) => {
      if (!state.roomData) return state;
      const existingIndex = state.roomData.participants.findIndex(
        (p) => p.userId === participant.userId,
      );
      if (existingIndex >= 0) return state; // 이미 존재하면 추가하지 않음
      return {
        roomData: {
          ...state.roomData,
          participants: [...state.roomData.participants, participant],
        },
      };
    }),
  removeParticipant: (userId: string) =>
    set((state) => {
      if (!state.roomData) return state;
      return {
        roomData: {
          ...state.roomData,
          participants: state.roomData.participants.filter((p) => p.userId !== userId),
        },
      };
    }),
  setJoined: (isJoined: boolean) => set({ isJoined }),
  leaveRoom: () => set({ roomId: null, isJoined: false, roomData: null }),
}));
