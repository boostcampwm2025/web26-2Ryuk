'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GamePlayerResultData } from '@/app/features/game/dtos/data';

interface RankingStore {
  result?: GamePlayerResultData;
  setResult: (result: GamePlayerResultData) => void;
  clearResult: () => void;
}

export const rankingStore = create<RankingStore>()(
  persist(
    (set) => ({
      result: undefined,
      setResult: (result) => set({ result }),
      clearResult: () => set({ result: undefined }),
    }),
    {
      name: 'ranking-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ result: state.result }),
    },
  ),
);
