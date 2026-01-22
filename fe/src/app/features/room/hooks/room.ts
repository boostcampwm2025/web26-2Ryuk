'use client';

import { useEffect, useState, useCallback } from 'react';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import roomService from '@/app/features/room/services/RoomService';
import { RoomConverter } from '@/app/features/room/dtos/converter';
import { RoomJoinInfoData } from '@/app/features/room/dtos/data';
import { authStore, AuthStore } from '@/app/features/user/stores/auth';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { useToast } from '@/app/components/shared/toast/useToast';
import useNavigation from '@/app/hooks/useNavigation';
import { useGame } from '@/app/features/game/hooks/useGame';
import { GamePlayerData } from '@/app/features/game/dtos/data';

export interface UseRoomResult {
  roomData: RoomStore['roomData'];
  roomJoinInfoData: RoomJoinInfoData | null;
  isHost: boolean;
  isGameRecruiting: boolean;
  isGameReadyModalOpen: boolean;
  myStatus: GamePlayerData;
  gamePlayers: GamePlayerData[];
  showPasswordAuth: boolean;
  handlePasswordConfirm: (password: string) => Promise<void>;
  handlePasswordCancel: () => void;
  handleGameRecruitClick: () => Promise<void>;
  handleReadyChange: (isReady: boolean) => Promise<void>;
  handleLeaveGame: () => Promise<void>;
  handleCloseGame: () => Promise<void>;
}

export function useRoom(roomId: string): UseRoomResult {
  const { showSuccessToast, showErrorToast } = useToast();
  const { goBack, goHome } = useNavigation();

  const roomData = roomStore((state: RoomStore) => state.roomData);
  const userId = authStore((state: AuthStore) => state.userId);

  const [roomJoinInfoData, setRoomJoinInfoData] = useState<RoomJoinInfoData | null>(null);
  const [showPasswordAuth, setShowPasswordAuth] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const {
    isGameRecruiting,
    isReadyModalOpen,
    handleGameRecruitClick,
    handleReadyChange,
    handleLeaveGame,
    handleCloseGame,
    myStatus,
    gamePlayers,
  } = useGame(roomId, isHost);

  useEffect(() => {
    if (!roomId || !userId) return;

    const syncFromBe = async () => {
      if (!userId) {
        showErrorToast('로그인 후 이용해주세요.');
        goHome();
        return;
      }

      if (!roomId) return;

      try {
        // 1. 입장 정보
        const joinInfoDto = await roomService.getRoomJoinInfo(roomId);
        const joinInfoData = RoomConverter.toRoomJoinInfoData(joinInfoDto);
        setRoomJoinInfoData(joinInfoData);

        // 2. 방 정보
        const roomDto = await roomService.getRoom(roomId);
        const convertedRoom = RoomConverter.toData(roomDto);
        roomStore.getState().setRoomData(convertedRoom);
        setIsHost(convertedRoom.hostId === userId);

        // 3. 비회원 + 비공개
        if (!joinInfoData.isMember && joinInfoData.isPrivate) {
          setShowPasswordAuth(true);
          return;
        }

        // 4. 입장 처리
        if (!joinInfoData.isMember) {
          await roomService.validateJoin(roomId);
          await roomChatService.subscribe(roomId);
          showSuccessToast('방에 입장했습니다!');
          return;
        }

        await roomChatService.subscribe(roomId);
      } catch {
        roomStore.getState().leaveRoom();
        roomChatService.clearSubscriptionOnly();
        goHome();
      }
    };

    const unsubInvalidated = roomChatService.onRoomInvalidated(goHome);
    syncFromBe();

    return () => unsubInvalidated();
  }, [roomId, userId, showSuccessToast, showErrorToast]);

  const handlePasswordConfirm = useCallback(
    async (password: string) => {
      await roomService.validateJoin(roomId, password);
      setShowPasswordAuth(false);
      showSuccessToast('방에 입장했습니다!');

      await roomChatService.subscribe(roomId);

      const roomDto = await roomService.getRoom(roomId);
      const convertedRoom = RoomConverter.toData(roomDto);
      roomStore.getState().setRoomData(convertedRoom);
      setIsHost(convertedRoom.hostId === userId);
    },
    [roomId, userId, showSuccessToast],
  );

  const handlePasswordCancel = useCallback(() => {
    setShowPasswordAuth(false);
    goBack();
  }, [goBack]);

  const safeMyStatus: GamePlayerData = myStatus ?? {
    userId: userId ?? '',
    nickname: '',
    profileImage: '',
    isHost,
    isReady: false,
  };

  return {
    roomData,
    roomJoinInfoData,
    isHost,
    isGameRecruiting,
    isGameReadyModalOpen: isReadyModalOpen,
    myStatus: safeMyStatus,
    gamePlayers,
    showPasswordAuth,
    handlePasswordConfirm,
    handlePasswordCancel,
    handleGameRecruitClick,
    handleReadyChange,
    handleLeaveGame,
    handleCloseGame,
  };
}
