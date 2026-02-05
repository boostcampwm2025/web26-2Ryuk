'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameData } from '@/app/features/game/dtos/data';

export type GameState = 'ready' | 'play' | 'result';

interface GameStoreState {
  gameState: GameState;
  startTime?: Date;
  playDurationMs: number;
  delayMs: number;
  myScore: number;
  highestScore?: number;
  averageScore: number;
  ranks: string[];
  selectedGame?: GameData;
  isMePlaying: boolean;
}

interface GameStoreActions {
  setGameState: (state: GameState) => void;
  setStartTime: (startTime?: Date) => void;
  setPlayDurationMs: (playDurationMs: number) => void;
  setDelayMs: (delayMs: number) => void;
  setMyScore: (myScore: number) => void;
  setHighestScore: (highestScore: number) => void;
  setAverageScore: (averageScore: number) => void;
  setRanks: (ranks: string[]) => void;
  setSelectedGame: (game?: GameData) => void;
  setIsMePlaying: (isMePlaying: boolean) => void;
  reset: () => void;
}

export type GameStore = GameStoreState & GameStoreActions;

const GAME_STORAGE_KEY = 'game-storage';

const removePersistedGameState = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GAME_STORAGE_KEY);
};

const initialState: GameStoreState = {
  gameState: 'ready',
  startTime: undefined,
  playDurationMs: 30000,
  delayMs: 0,
  myScore: 0,
  highestScore: undefined,
  averageScore: 0,
  ranks: [],
  selectedGame: undefined,
  isMePlaying: false,
};

export const gameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,
      setGameState: (gameState: GameState) => set({ gameState }),
      setStartTime: (startTime?: Date) => set({ startTime }),
      setPlayDurationMs: (playDurationMs: number) => set({ playDurationMs }),
      setDelayMs: (delayMs: number) => set({ delayMs }),
      setMyScore: (myScore: number) => set({ myScore }),
      setHighestScore: (highestScore?: number) => set({ highestScore }),
      setAverageScore: (averageScore: number) => set({ averageScore }),
      setRanks: (ranks: string[]) => set({ ranks }),
      setSelectedGame: (selectedGame?: GameData) => set({ selectedGame }),
      setIsMePlaying: (isMePlaying: boolean) => set({ isMePlaying }),
      reset: () => {
        removePersistedGameState();
        set(initialState);
      },
    }),
    {
      name: GAME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        gameState: state.gameState,
        startTime: state.startTime ? state.startTime.toISOString() : undefined,
        playDurationMs: state.playDurationMs,
        delayMs: state.delayMs,
        myScore: state.myScore,
        highestScore: state.highestScore,
        averageScore: state.averageScore,
        ranks: state.ranks,
        selectedGame: state.selectedGame,
        isMePlaying: state.isMePlaying,
      }),
      // Date 객체 복구 처리
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.startTime && typeof state.startTime === 'string') {
          state.startTime = new Date(state.startTime);
        }
      },
    },
  ),
);
