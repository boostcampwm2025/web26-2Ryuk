// HTTP DTOs
export type GameItemDto = {
  id: string;
  title: string;
  type: string;
  description?: string;
  min_players: number;
  max_players: number;
};

export type GameListResponseDto = {
  games: GameItemDto[];
};

// WebSocket DTOs

export type GameRecruitDto = {
  room_id: string;
};

export type GameRecruitAckDto = {
  room_id: string;
};

export type GamePlayerRecruitDto = {
  is_game_recruiting: boolean;
};

export type GameJoinDto = {
  room_id: string;
};

export type GamePlayerDto = {
  user_id: string;
  nickname: string;
  profile_image?: string;
  is_ready?: boolean;
  is_host?: boolean;
};

export type GameDto = {
  id: string;
  title: string;
  description?: string;
  type: string;
  min_players: string;
  max_players: string;
};

export type GameJoinAckDto = {
  current_players: string;
  max_players: string;
  host: GamePlayerDto;
  players: Array<GamePlayerDto>;
  game?: GameDto;
};

export type GamePlayerJoinDto = {
  player: GamePlayerDto;
  current_players: string;
};

export type GameLeaveDto = {
  room_id: string;
};

export type GamePlayerLeaveDto = {
  player_id: string;
  current_players: string;
};

export type GameSelectDto = {
  room_id: string;
  game_id: string;
};

export type GamePlayerSelectDto = {
  game: GameDto;
};

export type GameReadyDto = {
  room_id: string;
};

export type GamePlayerReadyDto = {
  player_id: string;
  is_ready: boolean;
};

export type GameUnreadyDto = {
  room_id: string;
};

export type GamePlayerUnreadyDto = {
  player_id: string;
  is_ready: boolean;
};

export type GameStartDto = {
  room_id: string;
};

export type GamePlayerStartDto = {
  start_time: string;
};

export type GameCloseDto = {
  room_id: string;
};

export type GamePlayerCloseDto = {
  is_game_recruiting: boolean;
};

export type GameRealtimeDto = {
  room_id: string;
  delta: string;
};

export type GamePlayerRealtimeDto = {
  highest_score: string;
  average_score: string;
  ranks: string[];
};

export type GamePlayerResultDto = {
  results: Array<GamePlayerDto & { score: string }>;
};
