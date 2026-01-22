// HTTP data

export type GameItemData = {
  id: string;
  title: string;
  type: string;
  description?: string;
  minPlayers: number;
  maxPlayers: number;
};

export type GameListResponseData = {
  games: GameItemData[];
};

// WebSocket Data

export type GameRecruitData = {
  roomId: string;
};

export type GameRecruitAckData = {
  roomId: string;
};

export type GamePlayerRecruitData = {
  isGameRecruiting: boolean;
};

export type GameJoinData = {
  roomId: string;
};

export type GamePlayerData = {
  userId: string;
  nickname: string;
  profileImage?: string;
  isReady?: boolean;
  isHost?: boolean;
};

export type GameData = {
  id: string;
  title: string;
  description?: string;
  type: string;
  minPlayers: number;
  maxPlayers: number;
};

export type GameJoinAckData = {
  currentPlayers: number;
  maxPlayers: number;
  host: GamePlayerData;
  players: Array<GamePlayerData>;
  game?: GameData;
};

export type GamePlayerJoinData = {
  player: GamePlayerData;
  currentPlayers: number;
};

export type GameLeaveData = {
  roomId: string;
};

export type GamePlayerLeaveData = {
  playerId: string;
  currentPlayers: number;
};

export type GameSelectData = {
  roomId: string;
  gameId: string;
};

export type GamePlayerSelectData = {
  game: GameData;
};

export type GameReadyData = {
  roomId: string;
};

export type GamePlayerReadyData = {
  playerId: string;
  isReady: boolean;
};

export type GameUnreadyData = {
  roomId: string;
};

export type GamePlayerUnreadyData = {
  playerId: string;
  isReady: boolean;
};

export type GameStartData = {
  roomId: string;
};

export type GamePlayerStartData = {
  startTime: Date;
};

export type GameCloseData = {
  roomId: string;
};

export type GamePlayerCloseData = {
  isGameRecruiting: boolean;
};

export type GameRealtimeData = {
  roomId: string;
  delta: number;
};

export type GamePlayerRealtimeData = {
  highestScore: number;
  averageScore: number;
  ranks: string[];
};

export type GamePlayerResultData = {
  results: Array<GamePlayerData & { score: number }>;
};
