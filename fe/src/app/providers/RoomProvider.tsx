'use client';

import { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { roomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { authStore } from '@/app/features/user/stores/auth';
import roomService from '@/app/features/room/services/RoomService';

interface RoomProviderProps {
  children: ReactNode;
}

export default function RoomProvider({ children }: RoomProviderProps) {
  const hasRestored = useRef(false);

  useEffect(() => {
    const restoreRoomConnection = async () => {
      if (hasRestored.current) return;

      const isAuthHydrated = authStore.persist.hasHydrated();
      const isRoomHydrated = roomStore.persist.hasHydrated();

      if (!isAuthHydrated || !isRoomHydrated) return;

      const { isAuthenticated } = authStore.getState();
      if (!isAuthenticated) return;

      const { roomId: storedRoomId, isJoined } = roomStore.getState();
      if (!storedRoomId || !isJoined) return;

      hasRestored.current = true;

      // BE 상태 먼저 확인
      let beRoomId;

      try {
        const { roomId } = await roomService.getMyCurrentRoom();
        beRoomId = roomId;
      } catch {
        roomStore.getState().leaveRoom();
        roomChatService.clearSubscriptionOnly();
        return;
      }

      if (!beRoomId) {
        roomStore.getState().leaveRoom();
        roomChatService.clearSubscriptionOnly();
        return;
      }

      if (storedRoomId !== beRoomId) roomStore.getState().leaveRoom();

      await roomChatService.subscribe(beRoomId);
    };

    // 이미 hydration 완료된 경우
    restoreRoomConnection();

    // AuthStore hydration 완료 대기
    if (!authStore.persist.hasHydrated()) {
      const unsubAuth = authStore.persist.onFinishHydration(restoreRoomConnection);

      // RoomStore hydration 완료 대기
      if (!roomStore.persist.hasHydrated()) {
        const unsubRoom = roomStore.persist.onFinishHydration(restoreRoomConnection);
        return () => {
          unsubAuth();
          unsubRoom();
        };
      }

      return unsubAuth;
    }

    // RoomStore hydration 완료 대기
    if (!roomStore.persist.hasHydrated()) {
      return roomStore.persist.onFinishHydration(restoreRoomConnection);
    }
  }, []);

  return <>{children}</>;
}
