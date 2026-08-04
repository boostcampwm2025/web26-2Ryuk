'use client';

import { useEffect, useRef, useState } from 'react';
import { gameService } from '@/app/features/game/services/GameService';
import { gameStore } from '@/app/features/game/stores/game';
import { useGame } from '@/app/features/game/hooks/game';
import { UseBeakerGameResult } from '@/app/features/game/hooks/type';
import { GamePlayerRealtimeData } from '@/app/features/game/dtos/data';
import Rules from '@/app/shared/rule';

const { THROTTLE_INTERVAL_MS } = Rules.GAME.BEAKER;

export function useBeakerGame(roomId?: string): UseBeakerGameResult {
  const game = useGame(roomId);
  const { gameState } = game;

  const deltaRef = useRef<number>(0);
  const throttleTimerRef = useRef<NodeJS.Timeout>();
  const previousAverageScoreRef = useRef<number>(0);

  const [opponentDropTrigger, setOpponentDropTrigger] = useState<number>(0);
  const [myDropTrigger, setMyDropTrigger] = useState<number>(0);

  const setHighestScore = gameStore((s) => s.setHighestScore);
  const setAverageScore = gameStore((s) => s.setAverageScore);
  const setRanks = gameStore((s) => s.setRanks);
  const setMyScore = gameStore((s) => s.setMyScore);

  const isPlaying = () => gameStore.getState().gameState === 'play';

  // 델타 값 전송 주기 타이머 초기화
  const clearThrottleTimer = () => {
    if (throttleTimerRef.current) {
      clearInterval(throttleTimerRef.current);
      throttleTimerRef.current = undefined;
    }
    deltaRef.current = 0;
  };

  // 델타 값 전송
  const flushDelta = (targetRoomId: string) => {
    if (!isPlaying()) return clearThrottleTimer();
    if (deltaRef.current <= 0) return;

    gameService.realtimeInput(targetRoomId, deltaRef.current);
    deltaRef.current = 0;
  };

  // game:player:realtime 구독
  const handleRealtimeUpdate = (data: GamePlayerRealtimeData) => {
    if (!isPlaying()) return;

    setHighestScore(data.highestScore);
    setAverageScore(data.averageScore);
    setRanks(data.ranks);

    const scoreDiff = data.averageScore - previousAverageScoreRef.current;
    if (scoreDiff > 0) {
      const interval = 100 / scoreDiff;
      if (interval > 0 && isFinite(interval)) {
        setOpponentDropTrigger((prev) => prev + 1);
      }
    }
    previousAverageScoreRef.current = data.averageScore;
  };

  // space bar 이벤트 처리
  const handleSpacePress = () => {
    if (!isPlaying()) return;
    setMyScore(gameStore.getState().myScore + 1);
    setMyDropTrigger((prev) => prev + 1);
    deltaRef.current += 1;
  };

  useEffect(() => {
    return gameService.onRealtime(handleRealtimeUpdate);
  }, []);

  useEffect(() => {
    if (gameState !== 'play' || !roomId) return clearThrottleTimer();

    throttleTimerRef.current = setInterval(() => flushDelta(roomId), THROTTLE_INTERVAL_MS);
    return clearThrottleTimer;
  }, [gameState, roomId]);

  useEffect(() => {
    if (gameState !== 'play') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handleSpacePress();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    return clearThrottleTimer;
  }, []);

  return {
    ...game,
    myDropTrigger,
    opponentDropTrigger,
  };
}
