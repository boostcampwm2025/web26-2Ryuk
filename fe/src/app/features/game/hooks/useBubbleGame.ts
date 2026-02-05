'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gameService } from '@/app/features/game/services/GameService';
import { gameStore } from '@/app/features/game/stores/game';
import { useGame } from '@/app/features/game/hooks/game';
import { watchDate } from '@/utils/watchDate';
import { mulberry32 } from '@/utils/prng';
import { UseBubbleGameResult } from '@/app/features/game/hooks/type';
import Rules from '@/app/shared/rule';

const { HIGHEST_SCORE, MIN_DIFF_MS, MAX_DIFF_MS } = Rules.GAME.BUBBLE;

/**
 * 물방울 터지기 예정 시각 - 사용자 입력 시각 = diffMs.
 * diff가 0에 가까울수록 로그스케일로 높은 점수 (Reflex 점수식과 동일, 스케일 1~20000ms).
 * 20s 초과 또는 20s 입력 시 0점.
 */
function calculateBubbleScore(diffMs: number): number {
  if (diffMs <= 0) return 0;
  if (diffMs >= MAX_DIFF_MS) return 0;

  const s = HIGHEST_SCORE;
  const m = MIN_DIFF_MS;
  const M = MAX_DIFF_MS;

  if (diffMs <= m) return s;

  const exponent = (-Math.log(s) / (M - m)) * (diffMs - m);
  const rawScore = s * ((Math.exp(exponent) - 1 / s) / (1 - 1 / s));
  return Math.ceil(rawScore);
}

function getExplodeOffsetMs(seed: number, durationMs: number): number {
  const minOffset = Math.floor(durationMs * (2 / 3));
  const maxOffset = Math.floor(durationMs * (9 / 10));
  const range = maxOffset - minOffset;
  if (range <= 0) return minOffset;
  const rng = mulberry32(seed);
  return minOffset + Math.floor(rng() * range);
}

export function useBubbleGame(roomId?: string): UseBubbleGameResult {
  const game = useGame(roomId);
  const startTime = gameStore((s) => s.startTime);
  const storePlayDurationMs = gameStore((s) => s.playDurationMs);
  const { gameState, startTrigger } = game;

  const [resetTrigger, setResetTrigger] = useState(0);
  const [explodeTrigger, setExplodeTrigger] = useState(0);
  const [myTrigger, setMyTrigger] = useState(0);
  const [highestTrigger, setHighestTrigger] = useState(0);
  const [explodeTime, setExplodeTime] = useState(0);
  const [hasInput, setHasInput] = useState(false);
  const [isExploded, setIsExploded] = useState(false);
  const [lastScore, setLastScore] = useState<number | undefined>(undefined);
  const [lastInputElapsedMs, setLastInputElapsedMs] = useState<number | undefined>(undefined);

  const explodeOffsetMs =
    startTime && storePlayDurationMs
      ? getExplodeOffsetMs(startTime.getTime(), storePlayDurationMs)
      : undefined;

  const hasInputRef = useRef(false);
  const isExplodedRef = useRef(false);
  const explodeTimeRef = useRef(0);
  const watchCleanupRef = useRef<(() => void) | null>(null);
  const prevHighestRef = useRef<number>(0);

  // game:player:realtime 구독 (랭킹/평균/최고점, 최고점 트리거만 갱신)
  useEffect(() => {
    const offRealtime = gameService.onRealtime((data) => {
      if (gameStore.getState().gameState !== 'play') return;
      const { highestScore, averageScore } = data;
      gameStore.getState().setHighestScore(highestScore);
      gameStore.getState().setAverageScore(averageScore);
      gameStore.getState().setRanks(data.ranks);
      if (highestScore === prevHighestRef.current) return;
      prevHighestRef.current = highestScore;
      const myScoreNow = gameStore.getState().myScore;
      if (highestScore === myScoreNow) return;
      setHighestTrigger((prev) => prev + 1);
    });
    return () => offRealtime();
  }, []);

  // play 진입 시 explodeTime 계산, watchDate 등록, resetTrigger++
  useEffect(() => {
    if (gameState !== 'play' || !startTrigger) return;

    const store = gameStore.getState();
    const startTime = store.startTime;
    const durationMs = store.playDurationMs;
    if (!startTime || !durationMs) return;

    if (watchCleanupRef.current) {
      watchCleanupRef.current();
      watchCleanupRef.current = null;
    }

    const startTimeMs = startTime.getTime();
    const explodeOffsetMs = getExplodeOffsetMs(startTimeMs, durationMs);
    const computedExplodeTime = startTimeMs + explodeOffsetMs;

    hasInputRef.current = false;
    isExplodedRef.current = false;
    setHasInput(false);
    setIsExploded(false);
    setLastScore(undefined);
    setLastInputElapsedMs(undefined);
    setExplodeTime(computedExplodeTime);
    explodeTimeRef.current = computedExplodeTime;
    setResetTrigger((prev) => prev + 1);
    setMyTrigger(0);
    setHighestTrigger(0);
    prevHighestRef.current = 0;

    watchCleanupRef.current = watchDate(new Date(computedExplodeTime), () => {
      isExplodedRef.current = true;
      setIsExploded(true);
      setExplodeTrigger((prev) => prev + 1);
    });

    return () => {
      if (!watchCleanupRef.current) return;
      watchCleanupRef.current();
      watchCleanupRef.current = null;
    };
  }, [gameState, startTrigger]);

  // gameState result 또는 unmount 시 cleanup
  useEffect(() => {
    if (gameState === 'result' || gameState === 'ready') {
      if (!watchCleanupRef.current) return;
      watchCleanupRef.current();
      watchCleanupRef.current = null;
    }
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (!watchCleanupRef.current) return;
      watchCleanupRef.current();
      watchCleanupRef.current = null;
    };
  }, []);

  const handleClick = useCallback(() => {
    if (gameState !== 'play' || !roomId) return;
    if (hasInputRef.current) return;

    const store = gameStore.getState();
    const startTimeDate = store.startTime;
    if (!startTimeDate) return;

    const inputTime = Date.now();
    const startTimeMs = startTimeDate.getTime();
    const elapsedMs = inputTime - startTimeMs;
    const expTime = explodeTimeRef.current;
    const diffMs = expTime - inputTime;

    const score = Math.max(0, calculateBubbleScore(diffMs));

    hasInputRef.current = true;
    setHasInput(true);
    setLastScore(score);
    setLastInputElapsedMs(elapsedMs);
    setMyTrigger((prev) => prev + 1);

    store.setMyScore(store.myScore + score);
    gameService.realtimeInput(roomId, score);
  }, [gameState, roomId]);

  return {
    ...game,
    resetTrigger,
    explodeTrigger,
    myTrigger,
    highestTrigger,
    handleClick,
    hasInput,
    isExploded,
    explodeTime,
    lastScore,
    explodeOffsetMs,
    lastInputElapsedMs,
    startTime,
  };
}
