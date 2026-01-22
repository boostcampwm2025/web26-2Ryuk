'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserService, User } from '../services/UserService';
import IS from '@/utils/is';
import { globalChatService } from '@/app/features/chat/services/GlobalChatService';

/* ================== Types ================== */

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  token: string | null;
  user: User | null;
  hasHydrated: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (userId: string) => Promise<void>;
  logout: () => void;
}

export type AuthStore = AuthState & AuthActions;

/* ================== Store ================== */

export const authStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      /* ---------- state ---------- */
      isAuthenticated: false,
      userId: null,
      token: null,
      user: null,
      hasHydrated: false,

      /* ---------- initialize ---------- */
      initialize: async () => {
        const { hasHydrated, token, userId } = get();
        if (!hasHydrated) return;

        if (!token || !userId) {
          set({
            isAuthenticated: false,
            userId: null,
            user: null,
          });
          return;
        }

        try {
          const data = await UserService.mockLogin(userId);

          const user: User = {
            id: data.user.id,
            nickname: data.user.nickname,
            profileImage: data.user.profile_image ?? undefined,
          };

          set({
            isAuthenticated: true,
            userId: data.userId,
            token: data.token,
            user,
          });

          // WebSocket 구독
          if (typeof window !== 'undefined') {
            await globalChatService.subscribe();
          }
        } catch (e) {
          console.warn('[Auth] initialize failed', e);
          set({ isAuthenticated: false, user: null });
        }
      },

      /* ---------- login ---------- */
      login: async (userId: string) => {
        const data = await UserService.mockLogin(userId);

        const user: User = {
          id: data.user.id,
          nickname: data.user.nickname,
          profileImage: data.user.profile_image ?? undefined,
        };

        set({
          isAuthenticated: true,
          userId: data.userId,
          token: data.token,
          user,
        });

        if (typeof window === 'undefined') return;
        const { globalChatService } =
          await import('@/app/features/chat/services/GlobalChatService');
        await globalChatService.subscribe();
        // 로그인 시 글로벌 채팅 참가자 수 낙관적 +1
        globalChatService.incrementParticipantsOptimistic();
      },

      /* ---------- logout ---------- */
      logout: () => {
        set({
          isAuthenticated: false,
          userId: null,
          token: null,
          user: null,
        });

        if (typeof window === 'undefined') return;
        // 로그아웃 시 글로벌 채팅 참가자 수 낙관적 -1
        globalChatService.decrementParticipantsOptimistic();
        globalChatService.notifyLogout();
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
      }),

      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // hydrate 완료 표시
        state.hasHydrated = true;

        // multi-tab sync
        const onStorage = async (e: StorageEvent) => {
          if (e.key !== 'auth-storage') return;

          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          const next = parsed?.state;

          if (!next?.token) return authStore.getState().logout();

          if (next.token !== authStore.getState().token) {
            authStore.setState({
              token: next.token,
              userId: next.userId,
              isAuthenticated: true,
            });

            try {
              const user = await UserService.getMe(next.token);
              authStore.setState({ user });
            } catch {
              authStore.getState().logout();
            }
          }
        };

        if (typeof window !== 'undefined') {
          window.addEventListener('storage', onStorage);
        }
      },
    },
  ),
);
