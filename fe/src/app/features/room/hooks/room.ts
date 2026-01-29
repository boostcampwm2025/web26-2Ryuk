'use client';

import { useEffect, useState } from 'react';
import { roomStore } from '@/app/features/room/stores/room';
import { authStore } from '@/app/features/user/stores/auth';
import * as roomEntry from '@/app/features/room/utils/roomEntry';
import * as roomActions from '@/app/features/room/utils/roomActions';
import { useGame } from '@/app/features/game/hooks/game';
import { useToast } from '@/app/components/shared/toast/useToast';
import useNavigation from '@/app/hooks/useNavigation';
import { RoomJoinInfoData } from '@/app/features/room/dtos/data';
import { UseRoomResult } from '@/app/features/room/hooks/type';
import { loadingStore } from '@/app/features/loading/stores/loading';
import { useModal } from '@/app/components/shared/modal/useModal';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { globalChatService } from '@/app/features/chat/services/GlobalChatService';
import { gameService } from '@/app/features/game/services/GameService';

export function useRoom(roomId?: string): UseRoomResult {
  const { showSuccessToast } = useToast();
  const { refresh, goBack, goHome } = useNavigation();
  const { show, hide } = loadingStore.getState();
  const { openModal, closeModal } = useModal();
  const deleteModalId = 'delete-room-modal';
  const leaveModalId = 'leave-room-modal';

  const userId = authStore((s) => s.userId);
  const roomData = roomStore((s) => s.roomData);

  const [roomJoinInfoData, setRoomJoinInfoData] = useState<RoomJoinInfoData>();
  const [showPasswordAuth, setShowPasswordAuth] = useState(false);

  const game = useGame(roomId);

  // 초기 진입
  useEffect(() => {
    if (!roomId || !userId) return;

    (async () => {
      show();

      // 방 입장 가능 여부 조회
      const joinInfo = await roomEntry.fetchRoomJoinInfo(roomId);
      setRoomJoinInfoData(joinInfo);

      // 방 세션 진입
      const passwordRequired = await roomEntry.isPasswordRequired(roomId, joinInfo);
      if (passwordRequired) return setShowPasswordAuth(true);

      await globalChatService.ensureConnected();
      await roomChatService.subscribe(roomId);
      await gameService.subscribe(roomId);

      // 이미 소속된 방일 경우 토스트 표시 안함
      if (!joinInfo.isMember) {
        showSuccessToast('방에 입장했습니다!');
      }
    })().finally(hide);
  }, [roomId, userId]);

  useEffect(() => {
    return roomChatService.onRoomInvalidated(goHome);
  }, [goHome]);

  // 비밀번호 인증
  const handlePasswordConfirm = async (password: string) => {
    if (!roomId) return;
    await roomEntry.enterRoomWithPassword(roomId, password);
    setShowPasswordAuth(false);
    showSuccessToast('방에 입장했습니다!');
    refresh();
  };

  const handlePasswordCancel = () => {
    setShowPasswordAuth(false);
    goBack();
  };

  // 방 나가기
  const handleLeaveRoom = async () => {
    if (!roomId) return;
    await roomActions.leaveRoom();
    showSuccessToast('퇴장했습니다!');
    goHome();
  };

  // 방 삭제
  const handleDeleteRoom = async () => {
    if (!roomId) return;
    await roomActions.deleteRoom(roomId);
    showSuccessToast('방을 삭제했습니다!');
    goHome();
  };

  const openDeleteModal = () => openModal(deleteModalId);
  const closeDeleteModal = () => closeModal(deleteModalId);
  const openLeaveModal = () => openModal(leaveModalId);
  const closeLeaveModal = () => closeModal(leaveModalId);

  const handleDeleteModalCancel = () => closeDeleteModal();
  const handleDeleteModalConfirm = async () => {
    await handleDeleteRoom();
    closeDeleteModal();
  };

  const handleLeaveModalCancel = () => closeLeaveModal();
  const handleLeaveModalConfirm = async () => {
    await handleLeaveRoom();
    closeLeaveModal();
  };

  return {
    roomData,
    roomJoinInfoData,
    showPasswordAuth,
    handlePasswordCancel,
    handlePasswordConfirm,
    handleLeaveRoom,
    handleDeleteRoom,
    deleteModalId,
    leaveModalId,
    openDeleteModal,
    openLeaveModal,
    handleDeleteModalCancel,
    handleDeleteModalConfirm,
    handleLeaveModalCancel,
    handleLeaveModalConfirm,
    game,
  };
}
