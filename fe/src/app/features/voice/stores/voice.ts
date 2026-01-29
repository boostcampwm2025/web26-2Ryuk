import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// UI 렌더링에 필요한 확장된 유저 상태 타입
export type UserVoiceState = {
  stream?: MediaStream;
  isMicOn: boolean;
  isSpeakerOn: boolean;
  volume: number;
};

interface VoiceState {
  voiceUsers: Record<string, UserVoiceState>;
  isMyMicOn: boolean;
  isMasterMute: boolean; // 전체 소리 차단 여부

  // Actions
  setVoiceUser: (userId: string, data: Partial<UserVoiceState>) => void;
  removeVoiceUser: (userId: string) => void;
  setMyMic: (on: boolean) => void;
  toggleMasterMute: () => void;
}

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({
      voiceUsers: {},
      isMyMicOn: true,
      isMasterMute: false,

      toggleMasterMute: () => set((state) => ({ isMasterMute: !state.isMasterMute })),

      setVoiceUser: (userId, data) =>
        set((state) => {
          const initialUser: UserVoiceState = {
            isMicOn: false,
            isSpeakerOn: true,
            volume: 0.5,
            stream: undefined,
          };
          const currentUser = state.voiceUsers[userId] || initialUser;
          return {
            voiceUsers: {
              ...state.voiceUsers,
              [userId]: { ...currentUser, ...data },
            },
          };
        }),

      removeVoiceUser: (userId) =>
        set((state) => {
          const next = { ...state.voiceUsers };
          delete next[userId];
          return { voiceUsers: next };
        }),

      setMyMic: (on) => set({ isMyMicOn: on }),
    }),
    {
      name: 'voice-storage', // 저장소 이름
      // 저장할 데이터만 골라냄. (stream은 제외함)
      partialize: (state) => ({
        isMasterMute: state.isMasterMute,
        isMyMicOn: state.isMyMicOn,
        voiceUsers: Object.fromEntries(
          Object.entries(state.voiceUsers).map(([id, user]) => [
            id,
            { isMicOn: user.isMicOn, isSpeakerOn: user.isSpeakerOn, volume: user.volume },
          ]),
        ),
      }),
    },
  ),
);
