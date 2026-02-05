'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import Rules from '@/app/shared/rule';
import { ReflexGameVariant, UseReflexGameOptions, UseReflexGameResult } from './type';

/**
 * 게임 전반 설정값 (기획 값이므로 Rules에서 관리)
 */
const {
  TOTAL_TRIGGERS,
  TOTAL_DURATION_MS,
  READY_DELAY_MS,
  ACTIVE_TIMEOUT_MS,
  FEEDBACK_DURATION,
  HIGHEST_SCORE,
  MIN_REACTION_MS,
  MAX_REACTION_MS,
} = Rules.GAME.REFLEX;
const MISS_PENALTY = Math.ceil(HIGHEST_SCORE * 0.1);

type Ref = MutableRefObject<number | null>;

export function useReflexGame(options: UseReflexGameOptions = {}): UseReflexGameResult {
  // 현재 게임 상태
  const [variant, setVariant] = useState<ReflexGameVariant>('idle');
  const [currentTriggerIndex, setCurrentTriggerIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [displayText, setDisplayText] = useState('START SOON');

  /**
   * 단계별 타이머 refs
   * - ready / active / feedback / game expiration 을 명확히 분리
   */
  const readyTimerRef = useRef<number | null>(null);
  const activeTimerRef = useRef<number | null>(null);
  const expirationTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  // active 상태 진입 시점을 기록하여 반응속도 계산에 사용
  const startTimeRef = useRef<number>(0);

  /**
   * 타이머 설정 유틸
   * - 기존 타이머를 정리하고 새 타이머를 설정
   */
  const setTimer = useCallback((ref: Ref, callback: () => void, delay: number) => {
    if (ref.current) window.clearTimeout(ref.current);
    ref.current = window.setTimeout(callback, delay);
  }, []);

  // 단일 타이머 정리
  const clearTimer = useCallback((ref: Ref) => {
    if (!ref.current) return;
    window.clearTimeout(ref.current);
    ref.current = null;
  }, []);

  // 모든 단계 타이머 정리 (게임 종료/리셋 시 사용)
  const clearAllTimers = useCallback(() => {
    clearTimer(readyTimerRef);
    clearTimer(activeTimerRef);
    clearTimer(expirationTimerRef);
    clearTimer(feedbackTimerRef);
  }, [clearTimer]);

  /**
   * 상태 + 표시 문구를 함께 변경하는 헬퍼
   * UI와 로직의 일관성을 유지하기 위함
   */
  const setDisplayState = useCallback((nextVariant: ReflexGameVariant, text: string) => {
    setVariant(nextVariant);
    setDisplayText(text);
    return nextVariant;
  }, []);

  // 상태별 UI 전환 헬퍼
  const showReady = useCallback(() => setDisplayState('ready', 'READY'), [setDisplayState]);
  const showClick = useCallback(() => setDisplayState('active', 'CLICK!'), [setDisplayState]);
  const showMissed = useCallback(() => setDisplayState('missed', 'MISSED'), [setDisplayState]);
  const showSuccess = useCallback(
    (text: string) => setDisplayState('success', text),
    [setDisplayState],
  );
  const showFinished = useCallback(
    () => setDisplayState('finished', 'FINISHED'),
    [setDisplayState],
  );

  /**
   * 게임 강제 종료 처리
   * - 모든 타이머 정리
   * - 상태를 finished로 전환
   */
  const finishGame = useCallback(() => {
    clearAllTimers();
    setCurrentTriggerIndex(TOTAL_TRIGGERS);
    showFinished();
  }, [clearAllTimers, showFinished]);

  /**
   * 반응속도(ms)를 점수로 변환
   */
  const calculateScore = useCallback((reactionMs: number) => {
    const s = HIGHEST_SCORE;
    const m = MIN_REACTION_MS;
    const M = MAX_REACTION_MS;

    if (reactionMs <= m) return s;
    if (reactionMs >= M) return 0;

    const exponent = (-Math.log(s) / (M - m)) * (reactionMs - m);
    const rawScore = s * ((Math.exp(exponent) - 1 / s) / (1 - 1 / s));

    return Math.ceil(rawScore);
  }, []);

  // 미스 발생 시 패널티 적용
  const { onMissedScore } = options;

  const applyMissPenalty = useCallback(() => {
    setTotalScore((prev) => prev - MISS_PENALTY);
    setDisplayText(`-${MISS_PENALTY} (MISS)`);
    onMissedScore?.(-MISS_PENALTY);
  }, [onMissedScore]);

  /**
   * 트리거 간 ready 대기 시간 계산
   * - 전체 시간 / 트리거 수 기준으로 랜덤성 부여
   */
  const getRandomReadyDelay = useCallback(() => {
    const perTrigger = TOTAL_DURATION_MS / TOTAL_TRIGGERS;
    const baseDelay = Math.max(
      READY_DELAY_MS,
      perTrigger - (ACTIVE_TIMEOUT_MS + FEEDBACK_DURATION),
    );
    const variance = Math.max(200, baseDelay * 0.4);
    const minDelay = Math.max(READY_DELAY_MS, baseDelay - variance);
    const maxDelay = baseDelay + variance;
    return Math.round(minDelay + Math.random() * (maxDelay - minDelay));
  }, []);

  /**
   * 타이머 콜백에서 최신 scheduleActive를 사용하기 위한 ref
   * (stale closure 방지)
   */
  const scheduleActiveRef = useRef<(nextIndex: number) => void>(() => undefined);

  /**
   * 성공/실패 후 다음 트리거로 이동하는 큐
   * - FEEDBACK_DURATION 동안 결과를 보여준 뒤 다음 단계로 전환
   */
  const queueNextTrigger = useCallback(
    (nextIndex: number) =>
      setTimer(
        feedbackTimerRef,
        () => {
          setCurrentTriggerIndex(nextIndex);
          if (nextIndex >= TOTAL_TRIGGERS) return finishGame();
          scheduleActiveRef.current(nextIndex);
        },
        FEEDBACK_DURATION,
      ),
    [finishGame, setTimer],
  );

  /**
   * ready → active → timeout(missed) 흐름을 담당
   * 한 트리거의 생명주기를 캡슐화
   */
  const scheduleActive = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= TOTAL_TRIGGERS) return finishGame();

      const readyDelay = getRandomReadyDelay();
      showReady();
      setTimer(
        readyTimerRef,
        () => {
          showClick();
          startTimeRef.current = Date.now();
          setTimer(
            activeTimerRef,
            () => {
              showMissed();
              applyMissPenalty();
              queueNextTrigger(nextIndex + 1);
            },
            ACTIVE_TIMEOUT_MS,
          );
        },
        readyDelay,
      );
    },
    [
      finishGame,
      getRandomReadyDelay,
      queueNextTrigger,
      setTimer,
      showReady,
      showClick,
      showMissed,
      applyMissPenalty,
    ],
  );

  // 최신 scheduleActive를 ref에 동기화
  useEffect(() => {
    scheduleActiveRef.current = scheduleActive;
  }, [scheduleActive]);

  /**
   * 게임 시작
   * - 상태/점수/트리거 초기화
   * - 전체 게임 종료 타이머 설정
   */
  const startGame = useCallback(() => {
    clearAllTimers();
    startTimeRef.current = Date.now();
    showReady();
    setCurrentTriggerIndex(0);
    setTotalScore(0);
    setTimer(expirationTimerRef, finishGame, TOTAL_DURATION_MS);
    scheduleActiveRef.current = scheduleActive;
    scheduleActive(0);
  }, [clearAllTimers, finishGame, scheduleActive, setTimer, showReady]);

  /**
   * 사용자 클릭 처리
   * - active 상태에서만 성공 판정
   * - ready 상태 클릭은 조기 클릭(miss) 처리
   */
  const handleClick = () => {
    if (variant !== 'active') {
      if (variant === 'ready') {
        clearTimer(readyTimerRef);
        showMissed();
        applyMissPenalty();
        queueNextTrigger(currentTriggerIndex + 1);
      }
      return null;
    }

    const reactionMs = Date.now() - startTimeRef.current;
    const earned = calculateScore(reactionMs);
    setTotalScore((prev) => prev + earned);
    showSuccess(`+${earned} (${reactionMs}ms)`);
    clearTimer(activeTimerRef);
    queueNextTrigger(currentTriggerIndex + 1);
    return earned;
  };

  // 남은 트리거 수
  const remainingTriggers = useMemo(
    () => Math.max(0, TOTAL_TRIGGERS - currentTriggerIndex),
    [currentTriggerIndex],
  );

  return {
    variant,
    totalScore,
    displayText,
    currentTriggerIndex,
    remainingTriggers,
    startGame,
    handleClick,
  };
}
