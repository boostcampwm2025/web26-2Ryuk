'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserService, User } from '../services/UserService';
import { globalChatService } from '@/app/features/chat/services/GlobalChatService';
import { HttpService } from '@/app/services/http.service';

/* ================== Types ================== */

interface AuthState {
  isAuthenticated: boolean;
  userId?: string;
  user?: User;
  hasHydrated: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

/* ================== Store ================== */

export const authStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      /* ---------- state ---------- */
      isAuthenticated: false,
      userId: undefined,
      user: undefined,
      hasHydrated: false,

      /* ---------- initialize ---------- */
      initialize: async () => {
        const { hasHydrated, isAuthenticated } = get();
        if (!hasHydrated || !isAuthenticated) return;

        try {
          const user = await UserService.getMe();

          set({
            isAuthenticated: true,
            userId: user.id,
            user,
          });

          // WebSocket 구독
          if (typeof window !== 'undefined') {
            await globalChatService.subscribe();
          }
        } catch (e) {
          console.warn('[Auth] initialize failed', e);
          set({ isAuthenticated: false, userId: undefined, user: undefined });
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
          // token: data.token, // token is not needed anymore
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
      logout: async () => {
        if (typeof window === 'undefined') return;

        try {
          // 백엔드 로그아웃 엔드포인트 호출
          await HttpService.post('/api/auth/logout');
        } catch (error) {
          console.error('Logout API call failed:', error);
          // API 호출 실패하더라도 로컬 상태는 계속 지움
        }

        set({
          isAuthenticated: false,
          userId: undefined,
          // token: undefined,
          user: undefined,
        });

        // 로그아웃 시 글로벌 채팅 참가자 수 낙관적 -1
        globalChatService.decrementParticipantsOptimistic();
        globalChatService.notifyLogout();
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        // token: state.token,
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

          if (!next?.isAuthenticated) return authStore.getState().logout();

          if (next.userId !== authStore.getState().userId) {
            authStore.setState({
              // token: next.token,
              userId: next.userId,
              isAuthenticated: true,
            });

            try {
              const user = await UserService.getMe();
              authStore.setState({ user, isAuthenticated: true, userId: user.id });
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
