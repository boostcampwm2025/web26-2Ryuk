import {
  GameCloseDto,
  GameItemDto,
  GameListResponseDto,
  GameJoinAckDto,
  GameJoinDto,
  GameLeaveDto,
  GamePlayerCloseDto,
  GamePlayerDto,
  GamePlayerJoinDto,
  GamePlayerLeaveDto,
  GamePlayerReadyDto,
  GamePlayerRealtimeDto,
  GamePlayerRecruitDto,
  GamePlayerResultDto,
  GamePlayerSelectDto,
  GamePlayerStartDto,
  GamePlayerUnreadyDto,
  GameRecruitAckDto,
  GameRecruitDto,
  GameReadyDto,
  GameRealtimeDto,
  GameSelectDto,
  GameStartDto,
  GameUnreadyDto,
  GameDto,
} from './dto';
import {
  GameItemData,
  GameListResponseData,
  GameCloseData,
  GameJoinAckData,
  GameJoinData,
  GameLeaveData,
  GameData,
  GamePlayerCloseData,
  GamePlayerData,
  GamePlayerJoinData,
  GamePlayerLeaveData,
  GamePlayerReadyData,
  GamePlayerRealtimeData,
  GamePlayerRecruitData,
  GamePlayerResultData,
  GamePlayerSelectData,
  GamePlayerStartData,
  GamePlayerUnreadyData,
  GameRecruitAckData,
  GameRecruitData,
  GameReadyData,
  GameRealtimeData,
  GameSelectData,
  GameStartData,
  GameUnreadyData,
} from './data';

export const toGameData = (dto: GameItemDto): GameItemData => ({
  id: dto.id,
  title: dto.title,
  type: dto.type,
  description: dto.description,
  minPlayers: dto.min_players,
  maxPlayers: dto.max_players,
});

export const toGameDto = (data: GameItemData): GameItemDto => ({
  id: data.id,
  title: data.title,
  type: data.type,
  description: data.description,
  min_players: data.minPlayers,
  max_players: data.maxPlayers,
});

export const toGameListData = (dto: GameListResponseDto): GameListResponseData => ({
  games: dto.games.map(toGameData),
});

const toGamePayloadData = (game: GameDto): GameData => ({
  id: game.id,
  title: game.title,
  description: game.description,
  type: game.type,
  minPlayers: Number(game.min_players),
  maxPlayers: Number(game.max_players),
});

const toGamePlayerData = (player: GamePlayerDto): GamePlayerData => ({
  userId: player.user_id,
  nickname: player.nickname,
  profileImage: player.profile_image ?? undefined,
  isReady: player.is_ready,
  isHost: player.is_host,
});

export const toGameRecruitDto = (data: GameRecruitData): GameRecruitDto => ({
  room_id: data.roomId,
});

export const toGameRecruitData = (dto: GameRecruitAckDto): GameRecruitAckData => ({
  roomId: dto.room_id,
});

export const toGamePlayerRecruitData = (dto: GamePlayerRecruitDto): GamePlayerRecruitData => ({
  isGameRecruiting: dto.is_game_recruiting,
});

export const toGameJoinDto = (data: GameJoinData): GameJoinDto => ({
  room_id: data.roomId,
});

export const toGameJoinAckData = (dto: GameJoinAckDto): GameJoinAckData => ({
  currentPlayers: Number(dto.current_players),
  maxPlayers: Number(dto.max_players),
  host: { ...toGamePlayerData(dto.host), isHost: true },
  players: dto.players.map((p) => {
    const data = toGamePlayerData(p);
    const hostId = dto.host.user_id;
    const playerId = p.user_id;
    return { ...data, isHost: playerId === hostId };
  }),
  game: dto.game ? toGamePayloadData(dto.game) : undefined,
});

export const toGamePlayerJoinData = (dto: GamePlayerJoinDto): GamePlayerJoinData => ({
  player: toGamePlayerData(dto.player),
  currentPlayers: Number(dto.current_players),
});

export const toGameLeaveDto = (data: GameLeaveData): GameLeaveDto => ({
  room_id: data.roomId,
});

export const toGamePlayerLeaveData = (dto: GamePlayerLeaveDto): GamePlayerLeaveData => ({
  playerId: dto.player_id,
  currentPlayers: Number(dto.current_players),
});

export const toGameSelectDto = (data: GameSelectData): GameSelectDto => ({
  room_id: data.roomId,
  game_id: data.gameId,
});

export const toGamePlayerSelectData = (dto: GamePlayerSelectDto): GamePlayerSelectData => ({
  game: toGamePayloadData(dto.game),
});

export const toGameReadyDto = (data: GameReadyData): GameReadyDto => ({
  room_id: data.roomId,
});

export const toGamePlayerReadyData = (dto: GamePlayerReadyDto): GamePlayerReadyData => ({
  playerId: dto.player_id,
  isReady: dto.is_ready,
});

export const toGameUnreadyDto = (data: GameUnreadyData): GameUnreadyDto => ({
  room_id: data.roomId,
});

export const toGamePlayerUnreadyData = (dto: GamePlayerUnreadyDto): GamePlayerUnreadyData => ({
  playerId: dto.player_id,
  isReady: dto.is_ready,
});

export const toGameStartDto = (data: GameStartData): GameStartDto => ({
  room_id: data.roomId,
});

export const toGamePlayerStartData = (dto: GamePlayerStartDto): GamePlayerStartData => ({
  startTime: new Date(dto.start_time),
});

export const toGameCloseDto = (data: GameCloseData): GameCloseDto => ({
  room_id: data.roomId,
});

export const toGamePlayerCloseData = (dto: GamePlayerCloseDto): GamePlayerCloseData => ({
  isGameRecruiting: dto.is_game_recruiting,
});

export const toGameRealtimeDto = (data: GameRealtimeData): GameRealtimeDto => ({
  room_id: data.roomId,
  delta: data.delta.toString(),
});

export const toGamePlayerRealtimeData = (dto: GamePlayerRealtimeDto): GamePlayerRealtimeData => ({
  highestScore: Number(dto.highest_score),
  averageScore: Number(dto.average_score),
  ranks: dto.ranks,
});

export const toGamePlayerResultData = (dto: GamePlayerResultDto): GamePlayerResultData => ({
  results: dto.results.map((result) => ({
    userId: result.user_id,
    nickname: result.nickname,
    profileImage: result.profile_image,
    isReady: result.is_ready,
    score: Number(result.score),
  })),
});

export const GameConverter = {
  toGameData,
  toGameDto,
  toGameListData,
  toGameRecruitDto,
  toGameRecruitData,
  toGamePlayerRecruitData,
  toGameJoinDto,
  toGameJoinAckData,
  toGamePlayerJoinData,
  toGameLeaveDto,
  toGamePlayerLeaveData,
  toGameSelectDto,
  toGamePlayerSelectData,
  toGameReadyDto,
  toGamePlayerReadyData,
  toGameUnreadyDto,
  toGamePlayerUnreadyData,
  toGameStartDto,
  toGamePlayerStartData,
  toGameCloseDto,
  toGamePlayerCloseData,
  toGameRealtimeDto,
  toGamePlayerRealtimeData,
  toGamePlayerResultData,
};
