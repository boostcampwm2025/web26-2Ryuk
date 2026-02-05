'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserData } from '../dtos/data';

interface AuthState {
  id?: string;
  nickname?: string;
  profileImage?: string;
  sessionRestored: boolean;
  authInitDone: boolean;
}

interface AuthActions {
  setUser: (user: UserData) => void;
  resetUser: () => void;

  // 세션 복구 완료 여부
  setSessionRestored: (value: boolean) => void;

  // auth 초기화 완료 여부
  setAuthInitDone: (value: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

export const authStore = create<AuthStore>()(
  persist(
    (set) => ({
      id: undefined,
      nickname: undefined,
      profileImage: undefined,
      sessionRestored: false,
      authInitDone: false,

      setUser: (user) =>
        set(() => ({
          id: user.id,
          nickname: user.nickname,
          profileImage: user.profileImage,
        })),

      resetUser: () =>
        set(() => ({
          id: undefined,
          nickname: undefined,
          profileImage: undefined,
          sessionRestored: false,
        })),

      setSessionRestored: (value) => set(() => ({ sessionRestored: value })),
      setAuthInitDone: (value) => set(() => ({ authInitDone: value })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        id: state.id,
        nickname: state.nickname,
        profileImage: state.profileImage,
      }),
    },
  ),
);
