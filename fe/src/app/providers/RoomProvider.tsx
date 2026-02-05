'use client';

import { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { roomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { authStore } from '@/app/features/user/stores/auth';
import { AuthService } from '@/app/features/user/services/AuthService';
import roomService from '@/app/features/room/services/RoomService';
import { voiceSessionManager } from '@/app/features/voice/services/VoiceSessionManager';

interface RoomProviderProps {
  children: ReactNode;
}

export default function RoomProvider({ children }: RoomProviderProps) {
  const hasRestored = useRef(false);
  const voiceDeferredByRestoreRef = useRef(false);
  const roomId = roomStore((state) => state.id);

  useEffect(() => {
    const restoreRoomConnection = async () => {
      if (hasRestored.current) return;

      const isAuthHydrated = authStore.persist.hasHydrated();
      const isRoomHydrated = roomStore.persist.hasHydrated();

      if (!isAuthHydrated || !isRoomHydrated) return;

      const hasAuthSession = Boolean(authStore.getState().id);
      if (!hasAuthSession) return;

      // 토큰이 없으면 아직 세션 복구(refresh) 전 → 나중에 onSessionRestored로 재시도
      if (!AuthService.getAccessToken()) return;

      const storedRoomId = roomStore.getState().id;
      if (!storedRoomId) return;

      hasRestored.current = true;
      voiceDeferredByRestoreRef.current = true;

      let beRoomId: string | undefined;

      try {
        const { roomId } = await roomService.getMyCurrentRoom();
        beRoomId = roomId;
      } catch {
        hasRestored.current = false;
        roomStore.getState().resetRoom();
        roomChatService.clearSubscriptionOnly();
        voiceDeferredByRestoreRef.current = false;
        return;
      }

      if (!beRoomId) {
        hasRestored.current = false;
        roomStore.getState().resetRoom();
        roomChatService.clearSubscriptionOnly();
        voiceDeferredByRestoreRef.current = false;
        return;
      }

      if (storedRoomId !== beRoomId) {
        hasRestored.current = false;
        roomStore.getState().resetRoom();
        roomChatService.clearSubscriptionOnly();
        voiceDeferredByRestoreRef.current = false;
        return;
      }

      await roomChatService.subscribe(beRoomId);
      voiceSessionManager.start(beRoomId);
      voiceDeferredByRestoreRef.current = false;
    };

    // 세션 복구 직후(WebSocket 연결 후) 방 복원 시도
    AuthService.setOnSessionRestored(restoreRoomConnection);

    // 이미 hydration 완료된 경우
    restoreRoomConnection();

    // AuthStore hydration 완료 대기
    if (!authStore.persist.hasHydrated()) {
      const unsubAuth = authStore.persist.onFinishHydration(restoreRoomConnection);

      // RoomStore hydration 완료 대기
      if (!roomStore.persist.hasHydrated()) {
        const unsubRoom = roomStore.persist.onFinishHydration(restoreRoomConnection);
        return () => {
          AuthService.setOnSessionRestored(null);
          unsubAuth();
          unsubRoom();
        };
      }

      return () => {
        AuthService.setOnSessionRestored(null);
        unsubAuth();
      };
    }

    // RoomStore hydration 완료 대기
    if (!roomStore.persist.hasHydrated()) {
      const unsubRoom = roomStore.persist.onFinishHydration(restoreRoomConnection);
      return () => {
        AuthService.setOnSessionRestored(null);
        unsubRoom();
      };
    }

    return () => AuthService.setOnSessionRestored(null);
  }, []);

  // 음성 세션
  useEffect(() => {
    if (roomId && !voiceDeferredByRestoreRef.current) {
      const t = setTimeout(() => voiceSessionManager.start(roomId), 100);
      return () => clearTimeout(t);
    }
    if (!roomId) voiceSessionManager.stop();
  }, [roomId]);

  return <>{children}</>;
}
