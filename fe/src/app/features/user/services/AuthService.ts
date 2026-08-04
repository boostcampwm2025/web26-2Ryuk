'use client';

import { API_BASE } from '@/app/services/api.constants';
import { HttpService } from '@/app/services/http.service';
import { WebSocketService } from '@/app/services/websocket.service';
import { globalChatService } from '@/app/features/chat/services/GlobalChatService';
import { authStore } from '@/app/features/user/stores/auth';
import { AuthConverter, UserConverter } from '@/app/features/user/dtos/converter';
import type { RefreshTokenResponseDto } from '@/app/features/user/dtos/dto';
import type { RefreshTokenData, UserData } from '@/app/features/user/dtos/data';
import type { RestoreSessionOptions } from '@/app/features/user/services/types';
import { UserService } from './UserService';
import type { ApiResponse } from '@/app/features/room/services/type';
import { goHome } from '@/app/hooks/useNavigation';
import { roomStore } from '@/app/features/room/stores/room';
import { toastStore } from '@/app/components/shared/toast/toast.store';

type SessionState = 'active' | 'refreshing' | 'expired';

export class AuthService {
  private static initialized = false;
  private static storageListener?: (event: StorageEvent) => void;
  private static currentAccessToken: string | null = null;
  private static refreshPromise: Promise<string | null> | null = null;
  private static restorePromise: Promise<void> | null = null;
  private static sessionState: SessionState = 'active';
  /** 세션 복구 직후(WebSocket 연결 후) 호출. 방 복원 등에서 사용. */
  private static onSessionRestored: (() => void) | null = null;

  /**
   * refresh 401 등으로 세션 만료 확정 시 단일 진입점. idempotent.
   */
  static expireSession(_reason?: string): void {
    if (this.sessionState === 'expired') return;
    const hadSession = Boolean(authStore.getState().id);
    this.sessionState = 'expired';
    this.refreshPromise = null;
    this.clearAccessToken();
    authStore.getState().resetUser();
    roomStore.getState().resetRoom();
    if (hadSession) {
      globalChatService.decrementParticipantsOptimistic();
      globalChatService.notifyLogout();
      toastStore.getState().showErrorToast('세션이 만료되었습니다. 다시 로그인해 주세요.');
      setTimeout(goHome, 2000);
    }
  }

  /**
   * 로그인 콜백 처리 (OAuth redirect 이후). 백엔드가 refresh 쿠키를 이미 세팅한 상태.
   */
  static async loginWithCallback() {
    this.sessionState = 'active';
    try {
      await this.restoreSession({ includeOptimisticIncrement: true });
    } catch (error) {
      this.logout({ skipApi: true });
      throw error;
    }
  }

  static initialize() {
    if (this.initialized) return;
    this.initialized = true;

    WebSocketService.setAccessTokenGetter(() => this.getAccessToken());
    WebSocketService.setOnDisconnect((reason) => this.handleWebSocketDisconnect(reason));

    this.bindStorageListener();
    if (this.sessionState === 'expired') {
      authStore.getState().setAuthInitDone(true);
      return;
    }
    void this.restoreSession().finally(() => authStore.getState().setAuthInitDone(true));
  }

  /**
   * WebSocket disconnect 시 호출.
   * refresh 후 재연결은 fire-and-forget. 로그인/세션 상태에는 영향 주지 않음.
   * 클라이언트가 의도적으로 끊은 경우(io client disconnect)는 무시 — auth 업그레이드 reconnect와 충돌 방지.
   */
  private static handleWebSocketDisconnect(reason: string): void {
    if (reason === 'io client disconnect') return;
    if (this.sessionState === 'expired') return;

    if (!this.canAttemptRefresh()) return;
    if (!authStore.getState().id) return;

    this.runRefresh().then((token) => {
      if (!token) return;
      void globalChatService.reconnectForAuth();
    });
  }

  /**
   * 로그아웃
   * 토큰 만료 여부와 관계없이 항상 authStore·메모리 정리 후 홈으로 보냄.
   * POST /api/auth/logout 은 가능하면 호출하되, 실패해도 클라이언트 상태는 이미 정리된 상태.
   */
  static logout(options?: { skipApi?: boolean }) {
    const hadSession = Boolean(authStore.getState().id);
    this.sessionState = 'expired';
    this.clearAccessToken();
    authStore.getState().resetUser();
    if (hadSession) {
      globalChatService.decrementParticipantsOptimistic();
      globalChatService.notifyLogout();
      setTimeout(goHome, 2000);
    }
    if (!options?.skipApi) {
      const uri = `${API_BASE}/auth/logout`;
      HttpService.post(uri).catch((err) => console.error('로그아웃 API 호출 실패:', err));
    }
  }

  static getAccessToken() {
    return this.currentAccessToken;
  }

  /** 세션 복구 직후 콜백 등록 (RoomProvider 등에서 방 복원용). 한 번만 등록 가능. */
  static setOnSessionRestored(cb: (() => void) | null): void {
    this.onSessionRestored = cb;
  }

  static canAttemptRefresh(): boolean {
    return this.sessionState !== 'expired';
  }

  private static async restoreSession(options?: RestoreSessionOptions) {
    if (this.sessionState === 'expired') return;

    // AuthProvider.initialize + loginWithCallback 동시 호출 시 한 번만 복구
    if (this.restorePromise) {
      await this.restorePromise;
      if (options?.includeOptimisticIncrement && authStore.getState().id) {
        globalChatService.incrementParticipantsOptimistic();
      }
      return;
    }

    this.restorePromise = (async () => {
      try {
        const token = await this.requestNewAccessToken();
        this.setAccessToken(token);
        await this.loadCurrentUser(options);
      } catch {
        this.expireSession();
      }
    })();

    try {
      await this.restorePromise;
    } finally {
      this.restorePromise = null;
    }
  }

  static async runRefresh(): Promise<string | null> {
    if (this.sessionState === 'expired') return null;
    if (this.refreshPromise) return this.refreshPromise;

    this.sessionState = 'refreshing';
    this.refreshPromise = this.executeRefresh();
    return this.refreshPromise;
  }

  private static async executeRefresh(): Promise<string | null> {
    try {
      const refreshData = await this.requestRefreshToken();
      this.sessionState = 'active';
      this.setAccessToken(refreshData.accessToken);
      return refreshData.accessToken;
    } catch {
      this.expireSession();
      return null;
    } finally {
      this.refreshPromise = null;
    }
  }

  private static async requestRefreshToken(): Promise<RefreshTokenData> {
    const url = `${API_BASE}/auth/refresh`;
    const response = await HttpService.post<ApiResponse<RefreshTokenResponseDto>>(url);

    if (!response.success || !response.data) {
      throw new Error('Invalid refresh response');
    }

    return AuthConverter.toRefreshTokenData(response.data);
  }

  private static async requestNewAccessToken(): Promise<string> {
    const token = await this.runRefresh();
    if (!token) throw new Error('액세스 토큰을 재발급하지 못했습니다.');
    return token;
  }

  private static async loadCurrentUser(options?: RestoreSessionOptions) {
    const dto = await UserService.getMe();
    const data = UserConverter.toData(dto);
    await this.setUserSession(data, options);
  }

  /**
   * HTTP 인증만 반영. WebSocket은 await 하지 않고 로그인 완료 후 side-effect로만 연결 시도.
   */
  private static setUserSession(user: UserData, options?: RestoreSessionOptions) {
    this.sessionState = 'active';
    authStore.getState().setUser(user);
    authStore.getState().setSessionRestored(true);

    if (options?.includeOptimisticIncrement) {
      globalChatService.incrementParticipantsOptimistic();
    }

    this.connectWebSocketFireAndForget();
  }

  /**
   * 로그인/세션 복구 후 WebSocket을 토큰으로 다시 붙임.
   * 게스트 열람이 이미 된 경우 UI는 '연결 중...'으로 되돌리지 않음.
   */
  private static connectWebSocketFireAndForget(): void {
    void (async () => {
      try {
        await globalChatService.reconnectForAuth();
        this.onSessionRestored?.();
      } catch {}
    })();
  }

  private static bindStorageListener() {
    if (typeof window === 'undefined' || this.storageListener) return;

    this.storageListener = async (event: StorageEvent) => {
      if (event.key !== 'auth-storage') return;

      const payload = event.newValue ? JSON.parse(event.newValue) : null;
      const next = payload?.state as { id?: string } | undefined;

      await this.syncFromStorage(next?.id);
    };

    window.addEventListener('storage', this.storageListener);
  }

  private static async syncFromStorage(nextId?: string) {
    if (this.sessionState === 'expired') return;
    if (!nextId) return this.expireSession();
    if (nextId === authStore.getState().id) return;
    await this.restoreSession();
  }

  private static setAccessToken(token: string | null) {
    this.currentAccessToken = token;
  }

  private static clearAccessToken() {
    this.currentAccessToken = null;
  }
}
