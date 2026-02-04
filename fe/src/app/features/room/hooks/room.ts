'use client';

import { useEffect, useRef } from 'react';
import { roomStore } from '@/app/features/room/stores/room';
import { useRoomEntry } from '@/app/features/room/hooks/roomEntry';
import { useRoomExit } from '@/app/features/room/hooks/roomExit';
import { useGame } from '@/app/features/game/hooks/game';
import { useToast } from '@/app/components/shared/toast/useToast';
import useNavigation from '@/app/hooks/useNavigation';
import { UseRoomResult } from '@/app/features/room/hooks/type';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { globalChatService } from '@/app/features/chat/services/GlobalChatService';
import { gameService } from '@/app/features/game/services/GameService';
import { authStore } from '@/app/features/user/stores/auth';
import {
  RoomParticipantJoinData,
  RoomParticipantLeaveData,
  RoomParticipantUpdateData,
} from '@/app/features/room/dtos/data';

export function useRoom(roomId?: string): UseRoomResult {
  const { showSuccessToast, showErrorToast } = useToast();
  const { goBack, goHome } = useNavigation();

  const hasShownEnterToastRef = useRef(false);
  const prevRoomIdForToastRef = useRef<string>();

  const myId = authStore((state) => state.id);
  const addParticipant = roomStore((state) => state.addParticipant);
  const removeParticipant = roomStore((state) => state.removeParticipant);
  const updateRoom = roomStore((state) => state.updateRoom);
  const resetRoom = roomStore((state) => state.resetRoom);

  const currentRoomId = roomStore((s) => s.id);

  const entry = useRoomEntry(roomId, {
    onAlreadyInOtherRoom: () => {
      showErrorToast('이미 소속 중인 방이 있습니다.');
      goHome();
    },
    onValidateFailed: (message) => {
      showErrorToast(message ?? '입장에 실패했습니다.');
      goHome();
    },
    onCancelPassword: goBack,
  });

  const game = useGame(roomId);

  // 입장 확정 후 채팅 및 게임 구독 (store와 URL 일치 시)
  useEffect(() => {
    const isEntered = entry.status === 'entered';
    if (!isEntered || !roomId) return;

    const storedRoomId = currentRoomId;
    if (storedRoomId !== roomId) return;

    //
    if (prevRoomIdForToastRef.current !== roomId) {
      prevRoomIdForToastRef.current = roomId;
      hasShownEnterToastRef.current = false;
    }

    //
    let cancelled = false;

    let unsubJoin: () => void;
    let unsubLeave: () => void;
    let unsubUpdate: () => void;

    (async () => {
      await globalChatService.ensureConnected();
      if (cancelled) return;

      await roomChatService.subscribe(roomId);
      if (cancelled) return;

      unsubJoin = roomChatService.onJoin((data: RoomParticipantJoinData) => {
        if (data.user.userId === myId) return;
        addParticipant(data.user);
      });

      unsubLeave = roomChatService.onLeave((data: RoomParticipantLeaveData) => {
        removeParticipant(data.user.id);
      });

      unsubUpdate = roomChatService.onUpdate((data: RoomParticipantUpdateData) => {
        updateRoom({
          maxParticipants: data.maxParticipants,
          currentParticipants: data.currentParticipants,
          participants: data.participants,
          title: data.title,
          tags: data.tags,
          hostId: data.hostId,
          isMicAvailable: data.isMicAvailable,
          isPrivate: data.isPrivate,
          createDate: data.createDate,
        });
      });

      await gameService.subscribe(roomId);
    })();

    if (entry.joinInfo && !entry.joinInfo.isMember && !hasShownEnterToastRef.current) {
      hasShownEnterToastRef.current = true;
      showSuccessToast('방에 입장했습니다!');
    }

    return () => {
      cancelled = true;
      unsubJoin?.();
      unsubLeave?.();
      unsubUpdate?.();
    };
  }, [entry.status, entry.joinInfo, roomId, currentRoomId, myId]);

  useEffect(() => {
    const handleRoomRemoved = () => {
      roomChatService.clearSubscriptionOnly();
      resetRoom();
      goHome();
    };
    const unsubDelete = roomChatService.onDelete(handleRoomRemoved);
    const unsubBan = roomChatService.onBan(handleRoomRemoved);
    return () => {
      unsubDelete();
      unsubBan();
    };
  }, [goHome, resetRoom]);

  const exit = useRoomExit(roomId, {
    onLeaveSuccess: () => {
      showSuccessToast('퇴장했습니다!');
      goHome();
    },
    onDeleteSuccess: () => {
      showSuccessToast('방을 삭제했습니다!');
      goHome();
    },
  });

  return { entry, exit, game };
}
