'use client';

import { useCallback, useEffect, useState } from 'react';
import { showInfoToast, useToast } from '@/app/components/shared/toast/useToast';
import { modalStore } from '@/app/components/shared/modal/modal.store';
import { roomStore } from '@/app/features/room/stores/room';
import { authStore } from '@/app/features/user/stores/auth';
import { GamePlayerData, GameJoinAckData } from '@/app/features/game/dtos/data';
import { gameService } from '@/app/features/game/services/GameService';

export function useGame(roomId: string, isHost: boolean) {
  const { showSuccessToast, showErrorToast } = useToast();
  const [isGameRecruiting, setIsGameRecruiting] = useState(false);
  const [isReadyModalOpen, setIsReadyModalOpen] = useState(false);
  const roomData = roomStore((state) => state.roomData);
  const userId = authStore((state) => state.userId);
  const [gamePlayers, setGamePlayers] = useState<GamePlayerData[]>([]);
  const [myStatus, setMyStatus] = useState<GamePlayerData>();

  const initialPlayer: GamePlayerData = {
    userId: userId ?? '',
    nickname: authStore.getState().user?.nickname ?? '',
    profileImage: authStore.getState().user?.profileImage ?? '',
    isHost,
    isReady: false,
  };

  // 초기 방 정보에 isGameRecruiting이 포함되어 있으면 반영
  useEffect(() => {
    const recruiting = Boolean(roomData?.isGameRecruiting);
    setIsGameRecruiting(recruiting);
    if (recruiting && isHost && !isReadyModalOpen) {
      handleGameRecruitClick();
    }
  }, [roomData?.isGameRecruiting, isHost, isReadyModalOpen]);

  // 방 상세 players 정보를 초기 상태로 반영
  useEffect(() => {
    if (!roomData?.players) return;

    const others =
      roomData.players
        ?.filter((p: GamePlayerData) => p.userId !== userId)
        .map((p: GamePlayerData) => ({
          userId: p.userId,
          nickname: p.nickname,
          profileImage: p.profileImage ?? '',
          isHost: p.isHost,
          isReady: p.isReady,
        })) ?? [];

    setGamePlayers(others);

    const me = roomData.players.find((p: GamePlayerData) => p.userId === userId) ?? initialPlayer;
    setMyStatus(me);

    if (roomData.isGameRecruiting && isHost && !isReadyModalOpen) {
      setIsReadyModalOpen(true);
    }
  }, [roomData?.players, roomData?.isGameRecruiting, userId, isHost, isReadyModalOpen]);

  useEffect(() => {
    const unsubscribeRecruit = gameService.onRecruit((data) => {
      setIsGameRecruiting(Boolean(data.isGameRecruiting));
      if (data.isGameRecruiting) {
        if (!isHost) showInfoToast('게임 모집이 시작되었습니다.');
        else {
          openReadyModal();
          setIsReadyModalOpen(true);
        }
      }
    });

    return () => {
      unsubscribeRecruit();
    };
  }, [showSuccessToast, isHost]);

  const applyJoinAck = (ackData: GameJoinAckData) => {
    const isPHost = (p: GamePlayerData) => p.userId === ackData.host.userId;
    const players = ackData.players.map((p) => ({ ...p, isHost: isPHost(p) }));

    const hasHost = players.some((p) => p.userId === ackData.host.userId);
    const mergedPlayers = hasHost ? players : [...players, ackData.host];
    setGamePlayers(mergedPlayers.filter((p) => p.userId !== userId));

    const me = mergedPlayers.find((p: GamePlayerData) => p.userId === userId) ?? initialPlayer;
    setMyStatus(me);
  };

  useEffect(() => {
    const unsubscribePlayerJoin = gameService.onPlayerJoin((data) => {
      if (data.player.userId === userId) return;
      setGamePlayers((prev) => {
        const exists = prev.some((p) => p.userId === data.player.userId);
        const next = {
          ...data.player,
          isHost: data.player.userId === roomData?.hostId,
        };
        if (exists) return prev;
        return [...prev, next];
      });
    });

    return () => {
      unsubscribePlayerJoin();
    };
  }, [roomData?.hostId]);

  const handleGameRecruitClick = useCallback(async () => {
    if (!roomId) return;

    try {
      if (isHost) {
        await gameService.recruit(roomId);
        const ack = await gameService.join(roomId);
        applyJoinAck(ack);
        setIsGameRecruiting(true);
        showSuccessToast('게임 모집을 시작했습니다.');
        openReadyModal();
        setIsReadyModalOpen(true);
        return;
      }

      if (!isGameRecruiting) {
        showErrorToast('게임 모집 중이 아닙니다.');
        return;
      }

      const ack = await gameService.join(roomId);
      applyJoinAck(ack);
      showSuccessToast('게임 모집에 참여했습니다.');
      openReadyModal();
      setIsReadyModalOpen(true);
    } catch {
      showErrorToast('게임 요청에 실패했습니다.');
    }
  }, [roomId, isHost, isGameRecruiting, showErrorToast, showSuccessToast, applyJoinAck]);

  const openReadyModal = useCallback(() => {
    modalStore.getState().openModal('game-ready');
  }, []);

  const closeReadyModal = useCallback(() => {
    modalStore.getState().closeModal('game-ready');
    if (isHost) setIsReadyModalOpen(false);
  }, []);

  useEffect(() => {
    const unsubscribeLeave = gameService.onPlayerLeave((data) => {
      setGamePlayers((prev) => prev.filter((p) => p.userId !== data.playerId));
      // 나 자신이 떠났을 때는 모달 닫기
      if (data.playerId === userId) closeReadyModal();
    });
    return () => unsubscribeLeave();
  }, [closeReadyModal, userId]);

  const handleReadyChange = useCallback(
    async (isReady: boolean) => {
      if (!roomId || !userId) return;
      if (isReady) gameService.ready(roomId);
      else gameService.unready(roomId);
      setMyStatus((prev) => {
        if (!prev) return prev;
        return { ...prev, isReady };
      });
    },
    [roomId, userId, closeReadyModal, showErrorToast, setMyStatus],
  );

  const updateReadyState = useCallback((playerId: string, isReady: boolean) => {
    setGamePlayers((prev) => prev.map((p) => (p.userId === playerId ? { ...p, isReady } : p)));

    setMyStatus((prev) => {
      if (!prev) return prev;
      if (prev.userId !== playerId) return prev;
      return { ...prev, isReady };
    });
  }, []);

  useEffect(() => {
    const unsubscribeReady = gameService.onReady((data) => {
      updateReadyState(data.playerId, data.isReady);
    });
    return () => unsubscribeReady();
  }, [updateReadyState]);

  useEffect(() => {
    const unsubscribeUnready = gameService.onUnready((data) => {
      updateReadyState(data.playerId, data.isReady);
    });
    return () => unsubscribeUnready();
  }, [updateReadyState]);

  const handleLeaveGame = useCallback(async () => {
    if (!roomId || !userId) return;
    try {
      await gameService.leave(roomId);
      showSuccessToast('게임에서 퇴장했습니다.');
      setGamePlayers((prev) => prev.filter((p) => p.userId !== userId));
      closeReadyModal();
    } catch {
      showErrorToast('게임 나가기에 실패했습니다.');
    }
  }, [roomId, userId, closeReadyModal, showErrorToast]);

  // 방장 모달 닫기 = game:close, 참가자 모달 닫기 = game:leave
  const handleCloseGame = useCallback(async () => {
    if (!roomId) return;
    try {
      if (isHost) await gameService.close(roomId);
      else await handleLeaveGame();
    } catch (error) {
      console.error('[useGame] 게임 닫기 실패:', error);
    }
  }, [roomId, isHost, handleLeaveGame]);

  // game:player:close 브로드캐스트 수신 시 상태 초기화
  useEffect(() => {
    const unsubscribeClose = gameService.onClose((data) => {
      if (!data.isGameRecruiting) {
        if (isHost) showSuccessToast('게임 모집을 종료했습니다.');
        else showInfoToast('게임 모집이 종료되었습니다.');
        setIsGameRecruiting(false);
        setGamePlayers([]);
        closeReadyModal();
      }
    });
    return () => unsubscribeClose();
  }, [closeReadyModal, showInfoToast]);

  return {
    isGameRecruiting,
    isReadyModalOpen,
    handleGameRecruitClick,
    myStatus,
    gamePlayers,
    handleReadyChange,
    handleLeaveGame,
    handleCloseGame,
  };
}
