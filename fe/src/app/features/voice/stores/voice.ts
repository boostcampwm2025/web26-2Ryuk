'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VoiceUserUIState = {
  isMicOn: boolean;
  isSpeakerOn: boolean;
  volume: number;
  isSpeaking?: boolean;
  mutedByMe?: boolean;
};

interface VoiceStoreState {
  users: Record<string, VoiceUserUIState>;
  isMyMicOn: boolean;
  masterMute: boolean;

  addUser: (userId: string) => void;
  removeUser: (userId: string) => void;
  setUserMic: (userId: string, isOn: boolean) => void;
  setUserSpeaker: (userId: string, isOn: boolean) => void;
  setUserVolume: (userId: string, volume: number) => void;
  setUserSpeaking: (userId: string, isSpeaking: boolean) => void;
  setMyMic: (isOn: boolean) => void;
  setMasterMute: (isOn: boolean) => void;
  reset: () => void;
}

const getDefaultUser = (): VoiceUserUIState => ({
  isMicOn: false,
  isSpeakerOn: true,
  volume: 0.5,
  isSpeaking: false,
  mutedByMe: false,
});

export const voiceStore = create<VoiceStoreState>()(
  persist(
    (set) => ({
      users: {},
      isMyMicOn: true,
      masterMute: false,

      addUser: (userId) =>
        set((state) => ({
          users: {
            ...state.users,
            [userId]: state.users[userId] ?? getDefaultUser(),
          },
        })),

      removeUser: (userId) =>
        set((state) => {
          const next = { ...state.users };
          delete next[userId];
          return { users: next };
        }),

      setUserMic: (userId, isOn) =>
        set((state) => {
          if (!state.users[userId]) return state;
          return {
            users: {
              ...state.users,
              [userId]: {
                ...state.users[userId],
                isMicOn: isOn,
              },
            },
          };
        }),

      setUserSpeaker: (userId, isOn) =>
        set((state) => {
          if (!state.users[userId]) return state;
          return {
            users: {
              ...state.users,
              [userId]: {
                ...state.users[userId],
                isSpeakerOn: isOn,
                mutedByMe: !isOn,
              },
            },
          };
        }),

      setUserVolume: (userId, volume) =>
        set((state) => {
          if (!state.users[userId]) return state;
          return {
            users: {
              ...state.users,
              [userId]: {
                ...state.users[userId],
                volume,
              },
            },
          };
        }),

      setUserSpeaking: (userId, isSpeaking) =>
        set((state) => {
          const user = state.users[userId];
          if (!user || user.isSpeaking === isSpeaking) return state;
          return {
            users: {
              ...state.users,
              [userId]: {
                ...user,
                isSpeaking,
              },
            },
          };
        }),

      setMyMic: (isOn) => set({ isMyMicOn: isOn }),
      setMasterMute: (isOn) => set({ masterMute: isOn }),

      reset: () =>
        set({
          users: {},
          isMyMicOn: true,
          masterMute: false,
        }),
    }),
    {
      name: 'voice-store',
      partialize: (state) => ({
        users: Object.fromEntries(
          Object.entries(state.users).map(([id, user]) => [
            id,
            {
              isMicOn: user.isMicOn,
              isSpeakerOn: user.isSpeakerOn,
              volume: user.volume,
              mutedByMe: user.mutedByMe,
            },
          ]),
        ),
        isMyMicOn: state.isMyMicOn,
        masterMute: state.masterMute,
      }),
    },
  ),
);
