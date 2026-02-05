import { GameData, GamePlayerData } from '@/app/features/game/dtos/data';
import { GameState } from '@/app/features/game/stores/game';

export interface UseGameResult {
  myStatus: GamePlayerData;
  gamePlayers: GamePlayerData[];
  isGameRecruiting: boolean;
  isReadyModalOpen: boolean;
  handleGameRecruit: () => Promise<void>;
  handleGameJoin: () => Promise<void>;
  handleReadyChange: (isReady: boolean) => void;
  handleLeaveGame: () => Promise<void>;
  handleCloseGame: () => Promise<void>;
  handleGameSelect: (gameId: string) => void;
  handleGameStartButtonClick: () => void;
  selectedGame?: GameData;
  gameState: GameState;
  remainingTime: number;
  playDurationMs: number;
  delayMs: number;
  myScore: number;
  opponentScore: number;
  opponentHighestScore?: number;
  myRank?: number;
  startTrigger?: number;
}

export interface UseBeakerGameResult extends UseGameResult {
  myDropTrigger: number;
  opponentDropTrigger: number;
}

export type ReflexGameVariant = 'idle' | 'ready' | 'active' | 'success' | 'missed' | 'finished';

export interface UseReflexGameResult {
  variant: ReflexGameVariant;
  totalScore: number;
  displayText: string;
  currentTriggerIndex: number;
  remainingTriggers: number;
  startGame: () => void;
  handleClick: () => number | null;
}

export interface UseReflexGameOptions {
  onMissedScore?: (score: number) => void;
}

export type BubbleGameVariant = 'idle' | 'growing' | 'exploding';

export interface UseBubbleGameResult extends UseGameResult {
  resetTrigger: number;
  explodeTrigger: number;
  myTrigger: number;
  highestTrigger: number;
  handleClick: () => void;
  hasInput: boolean;
  isExploded: boolean;
  explodeTime: number;
  lastScore: number | undefined;
  explodeOffsetMs: number | undefined;
  lastInputElapsedMs: number | undefined;
  startTime: Date | undefined;
}
