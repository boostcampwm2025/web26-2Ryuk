'use client';

import { useEffect, useRef, useState } from 'react';
import { gameService } from '@/app/features/game/services/GameService';
import { gameStore } from '@/app/features/game/stores/game';
import { useGame } from '@/app/features/game/hooks/game';
import { UseBeakerGameResult } from '@/app/features/game/hooks/type';

export function useBeakerGame(roomId?: string): UseBeakerGameResult {
  const game = useGame(roomId);
  const { gameState } = game;
  const deltaRef = useRef<number>(0);
  const throttleTimerRef = useRef<NodeJS.Timeout>();
  const previousAverageScoreRef = useRef<number>(0);
  const [opponentDropTrigger, setOpponentDropTrigger] = useState<number>(0);
  const [myDropTrigger, setMyDropTrigger] = useState<number>(0);

  useEffect(() => {
    return gameService.onRealtime((data) => {
      if (gameStore.getState().gameState !== 'play') return;

      gameStore.getState().setHighestScore(data.highestScore);
      gameStore.getState().setAverageScore(data.averageScore);
      gameStore.getState().setRanks(data.ranks);

      const currentAvg = data.averageScore;
      const prevAvg = previousAverageScoreRef.current;
      const scoreDiff = currentAvg - prevAvg;

      if (scoreDiff > 0) {
        const interval = 100 / scoreDiff;
        if (interval > 0 && isFinite(interval)) {
          setOpponentDropTrigger((prev) => prev + 1);
        }
      }

      previousAverageScoreRef.current = currentAvg;
    });
  }, []);

  useEffect(() => {
    if (gameState !== 'play' || !roomId) {
      if (throttleTimerRef.current) {
        clearInterval(throttleTimerRef.current);
        throttleTimerRef.current = undefined;
      }
      deltaRef.current = 0;
      return;
    }

    throttleTimerRef.current = setInterval(() => {
      if (gameStore.getState().gameState !== 'play') {
        if (throttleTimerRef.current) {
          clearInterval(throttleTimerRef.current);
          throttleTimerRef.current = undefined;
        }
        deltaRef.current = 0;
        return;
      }

      if (deltaRef.current <= 0) return;
      gameService.realtimeInput(roomId, deltaRef.current);
      deltaRef.current = 0;
    }, 100);

    return () => {
      if (!throttleTimerRef.current) return;
      clearInterval(throttleTimerRef.current);
      throttleTimerRef.current = undefined;
    };
  }, [gameState, roomId]);

  useEffect(() => {
    if (gameState !== 'play') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStore.getState().gameState !== 'play') return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        gameStore.getState().setMyScore(gameStore.getState().myScore + 1);
        setMyDropTrigger((prev) => prev + 1);

        deltaRef.current += 1;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearInterval(throttleTimerRef.current);
        throttleTimerRef.current = undefined;
      }
      deltaRef.current = 0;
    };
  }, []);

  return {
    ...game,
    myDropTrigger,
    opponentDropTrigger,
  };
}
