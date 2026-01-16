'use client';

import { useEffect, useRef } from 'react';
import { authStore } from '../features/user/stores/auth';
import { roomStore } from '../features/room/stores/room';
import { globalChatService } from '../features/chat/services/GlobalChatService';
import { roomChatService } from '../features/chat/services/RoomChatService';
import roomService from '../features/room/services/RoomService';
import { RoomConverter } from '../features/room/dtos/Room';
import { WebSocketService } from '../services/websocket.service';
import { RoomJoinedAckDto, RoomJoinedBroadcastDto } from '../features/chat/services/type';

/**
 * 방 정보 복구 Provider
 * 새로고침 후에도 사용자가 참여 중인 방 정보를 복구하고 채팅 세션을 재구독
 */
export default function RoomProvider({ children }: { children: React.ReactNode }) {
  const hasInitialized = useRef(false);
  const restoredRoomId = useRef<string | null>(null);
  const handlersRegistered = useRef(false);
  const handlersRef = useRef<{
    handleRoomJoinAck: (data: RoomJoinedAckDto) => Promise<void>;
    handleRoomJoined: (data: RoomJoinedBroadcastDto) => Promise<void>;
  } | null>(null);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const restoreRoomSession = async () => {
      const userId = authStore.getState().userId;
      const isAuthenticated = authStore.getState().isAuthenticated;

      if (!isAuthenticated || !userId) return;

      // 방 정보 복구 함수
      const restoreRoomData = async (roomId: string) => {
        const currentRoomId = roomStore.getState().roomId;

        // 이미 복구된 방이면 스킵
        if (restoredRoomId.current === roomId) return;
        // 이미 같은 방에 대한 정보가 있으면 스킵
        if (currentRoomId === roomId) return;

        restoredRoomId.current = roomId;

        // 방 정보 조회 및 roomData 복구
        try {
          const roomDto = await roomService.getRoom(roomId);
          const roomData = RoomConverter.toData(roomDto);
          roomStore.getState().setRoomData(roomData);
          roomStore.getState().setJoined(true);

          // 채팅 세션 재구독
          await roomChatService.subscribe(roomId);
        } catch (error) {
          console.error('[RoomProvider] 방 정보 복구 실패:', error);
        }
      };

      // room:join ACK 핸들러 (백엔드 세션 복구 시 자동으로 방에 재참여하면 발생)
      const handleRoomJoinAck = async (data: RoomJoinedAckDto) => {
        await restoreRoomData(data.roomId);
      };

      // room:joined 브로드캐스트 핸들러 (백엔드 세션 복구 시 자신의 재입장 알림)
      const handleRoomJoined = async (data: RoomJoinedBroadcastDto) => {
        const currentUserId = authStore.getState().userId;

        // 자신의 입장인 경우에만 복구 (다른 사용자 입장 알림은 무시)
        if (currentUserId && data.user.id === currentUserId) {
          await restoreRoomData(data.roomId);
        }
      };

      // 핸들러 참조 저장 (cleanup에서 사용)
      handlersRef.current = { handleRoomJoinAck, handleRoomJoined };

      // WebSocket 연결 보장
      await globalChatService.ensureConnected();

      // 이벤트 핸들러를 먼저 등록 (백엔드 세션 복구 이벤트를 놓치지 않도록)
      // 전역 Provider이므로 이벤트 리스너는 유지 (cleanup에서 제거하지 않음)
      if (!handlersRegistered.current) {
        WebSocketService.on('room:join', handleRoomJoinAck);
        WebSocketService.on('room:joined', handleRoomJoined);
        handlersRegistered.current = true;
      }

      // WebSocket 연결 후 잠시 대기 (백엔드 세션 복구 완료 대기)
      // 백엔드가 세션 복구를 완료하면 room:join ACK 또는 room:joined 이벤트가 발생함
      await new Promise((resolve) => setTimeout(resolve, 2000));
    };

    // authStore hydration 완료 후 실행
    if (authStore.persist.hasHydrated()) {
      restoreRoomSession();
    } else {
      const unsub = authStore.persist.onFinishHydration(() => {
        restoreRoomSession();
      });
      return unsub;
    }
  }, []);

  return <>{children}</>;
}
