import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '@src/providers/redis/redis.provider';
import { GameParticipantDto, GameInfoPayloadDto } from './dto/game-response.dto';
import { LOG, logMessage } from '@src/common/utils/log-messages';

interface InputLog {
  timestamp: number;
  delta: number;
}

/**
 * Redis 데이터 접근 전용 Repository
 * 게임 상태, 참가자 정보, 점수 등의 데이터 CRUD만 담당
 */
@Injectable()
export class GameRepository {
  private readonly logger = new Logger(GameRepository.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType) {}

  // ==================== 키 생성 헬퍼 ====================
  private getParticipantKey(roomId: string, userId: string): string {
    return `room:${roomId}:game:players:${userId}`;
  }

  private getScoreKey(roomId: string): string {
    return `room:${roomId}:game:scores`;
  }

  private getGameKey(roomId: string): string {
    return `room:${roomId}:game`;
  }

  private getMacroViolationKey(roomId: string, userId: string): string {
    return `room:${roomId}:game:macro_violations:${userId}`;
  }

  // ==================== 게임 상태 관리 ====================
  async setGameRecruiting(roomId: string, isRecruiting: boolean): Promise<void> {
    const gameKey = this.getGameKey(roomId);
    await this.redisClient.hSet(gameKey, 'is_recruiting', isRecruiting ? '1' : '0');
  }

  async isGameRecruiting(roomId: string): Promise<boolean> {
    const gameKey = this.getGameKey(roomId);
    const value = await this.redisClient.hGet(gameKey, 'is_recruiting');
    return value === '1';
  }

  async setGameStartTime(roomId: string, startTime: number): Promise<void> {
    const gameKey = this.getGameKey(roomId);
    await this.redisClient.hSet(gameKey, 'start_time', startTime.toString());
  }

  async getGameStartTime(roomId: string): Promise<string | null> {
    const gameKey = this.getGameKey(roomId);
    return await this.redisClient.hGet(gameKey, 'start_time');
  }

  async setSelectedGame(roomId: string, gamePayload: GameInfoPayloadDto): Promise<void> {
    const gameKey = this.getGameKey(roomId);
    await this.redisClient.hSet(gameKey, { ...gamePayload });
  }

  async getSelectedGame(roomId: string): Promise<GameInfoPayloadDto | undefined> {
    try {
      const gameKey = this.getGameKey(roomId);
      const gameData = await this.redisClient.hGetAll(gameKey);
      if (!gameData || Object.keys(gameData).length === 0) return undefined;
      if (!gameData.id) return undefined;

      const gamePayload = new GameInfoPayloadDto(
        gameData.id,
        gameData.title,
        gameData.description,
        gameData.type,
        Number.parseInt(gameData.min_players, 10),
        Number.parseInt(gameData.max_players, 10),
        Number.parseInt(gameData.time, 10),
      );

      return gamePayload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.GAME.GAME_STATE_FETCH_ERROR(roomId, errorMessage));
      return undefined;
    }
  }

  async deleteGameData(roomId: string): Promise<void> {
    const gameKey = this.getGameKey(roomId);
    await this.redisClient.del(gameKey);
  }

  // ==================== 참가자 관리 ====================
  async addParticipant(roomId: string, userId: string): Promise<boolean> {
    const playerKey = this.getParticipantKey(roomId, userId);
    const exists = await this.redisClient.exists(playerKey);

    if (!exists) {
      // 방 멤버 정보에서 닉네임, 프로필 이미지 가져오기
      const memberData = await this.redisClient.hGetAll(`room:${roomId}:members:${userId}`);

      await this.redisClient.hSet(playerKey, {
        nickname: memberData.nickname || '',
        profile_image: memberData.profile_image || '',
        is_ready: '0',
        score: '0',
        rank: '0',
        frozen_until: '0',
      });

      return true;
    }
    return false;
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    const playerKey = this.getParticipantKey(roomId, userId);
    await this.redisClient.del(playerKey);
  }

  async participantExists(roomId: string, userId: string): Promise<boolean> {
    const playerKey = this.getParticipantKey(roomId, userId);
    return (await this.redisClient.exists(playerKey)) === 1;
  }

  async setParticipantReady(roomId: string, userId: string, isReady: boolean): Promise<void> {
    const playerKey = this.getParticipantKey(roomId, userId);
    await this.redisClient.hSet(playerKey, 'is_ready', isReady ? '1' : '0');
  }

  async setPlayerFrozen(roomId: string, userId: string, frozenUntilTimestamp: number): Promise<void> {
    const playerKey = this.getParticipantKey(roomId, userId);
    await this.redisClient.hSet(playerKey, 'frozen_until', frozenUntilTimestamp.toString());
  }

  async getParticipant(roomId: string, userId: string): Promise<GameParticipantDto | null> {
    const playerKey = this.getParticipantKey(roomId, userId);
    const exists = await this.redisClient.exists(playerKey);
    if (!exists) return null;

    const playerData = await this.redisClient.hGetAll(playerKey);
    return {
      player_id: userId,
      nickname: playerData.nickname || '',
      profile_image: playerData.profile_image || '',
      is_ready: playerData.is_ready === '1',
      score: Number.parseInt(playerData.score, 10) || 0,
      rank: Number.parseInt(playerData.rank, 10) || 0,
      frozen_until: Number.parseInt(playerData.frozen_until, 10) || 0,
    };
  }

  async getAllParticipants(roomId: string): Promise<GameParticipantDto[]> {
    const pattern = `room:${roomId}:game:players:*`;
    const keys = await this.redisClient.keys(pattern);

    if (!keys.length) return [];

    const participants: GameParticipantDto[] = [];

    for (const key of keys) {
      const playerId = key.replace(`room:${roomId}:game:players:`, '');
      const playerData = await this.redisClient.hGetAll(key);

      participants.push({
        player_id: playerId,
        nickname: playerData.nickname || '',
        profile_image: playerData.profile_image || '',
        is_ready: playerData.is_ready === '1',
        score: Number.parseInt(playerData.score, 10) || 0,
        rank: Number.parseInt(playerData.rank, 10) || 0,
        frozen_until: Number.parseInt(playerData.frozen_until, 10) || 0,
      });
    }

    return participants;
  }

  async getCurrentPlayersCount(roomId: string): Promise<number> {
    const pattern = `room:${roomId}:game:players:*`;
    const keys = await this.redisClient.keys(pattern);
    return keys.length;
  }

  async getCurrentReadyPlayersCount(roomId: string): Promise<number> {
    const pattern = `room:${roomId}:game:players:*`;
    const keys = await this.redisClient.keys(pattern);

    let readyCount = 0;

    for (const key of keys) {
      const isReady = await this.redisClient.hGet(key, 'is_ready');
      if (isReady === '1') readyCount++;
    }

    return readyCount;
  }

  async getReadyParticipants(roomId: string): Promise<string[]> {
    const pattern = `room:${roomId}:game:players:*`;
    const keys = await this.redisClient.keys(pattern);
    const readyUserIds: string[] = [];

    for (const key of keys) {
      const isReady = await this.redisClient.hGet(key, 'is_ready');
      if (isReady === '1') {
        const userId = key.replace(`room:${roomId}:game:players:`, '');
        readyUserIds.push(userId);
      }
    }

    return readyUserIds;
  }

  async deleteAllParticipants(roomId: string): Promise<void> {
    const pattern = `room:${roomId}:game:players:*`;
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }
  }

  async updateParticipantRank(roomId: string, userId: string, rank: number): Promise<void> {
    const playerKey = this.getParticipantKey(roomId, userId);
    await this.redisClient.hSet(playerKey, 'rank', rank.toString());
  }

  async getParticipantData(roomId: string, userId: string): Promise<Record<string, string>> {
    const playerKey = this.getParticipantKey(roomId, userId);
    return await this.redisClient.hGetAll(playerKey);
  }

  // ==================== 점수 관리 ====================
  async initializeScores(roomId: string, userIds: string[]): Promise<void> {
    const scoreKey = this.getScoreKey(roomId);
    const scoreEntries: Array<{ score: number; value: string }> = userIds.map((userId) => ({
      score: 0,
      value: userId,
    }));

    if (scoreEntries.length > 0) {
      await this.redisClient.zAdd(scoreKey, scoreEntries);
    }
  }

  async updateScore(roomId: string, userId: string, delta: number): Promise<void> {
    const scoreKey = this.getScoreKey(roomId);
    await this.redisClient.zIncrBy(scoreKey, delta, userId);
  }

  async getAllScores(roomId: string): Promise<Array<{ value: string; score: number }>> {
    const scoreKey = this.getScoreKey(roomId);
    return await this.redisClient.zRangeWithScores(scoreKey, 0, -1, {
      REV: true,
    });
  }

  async deleteScores(roomId: string): Promise<void> {
    const scoreKey = this.getScoreKey(roomId);
    await this.redisClient.del(scoreKey);
  }

  async removeScore(roomId: string, userId: string): Promise<void> {
    const scoreKey = this.getScoreKey(roomId);
    await this.redisClient.zRem(scoreKey, userId);
  }

  // ==================== 전체 삭제 ====================
  async deleteAllGameData(roomId: string): Promise<void> {
    await this.deleteGameData(roomId);
    await this.deleteScores(roomId);
    await this.deleteAllParticipants(roomId);
    await this.deleteAllMacroInputs(roomId);
    await this.deleteAllMacroViolations(roomId);
  }

  // ==================== 매크로 감지 관련 ====================
  private getMacroDetectionKey(roomId: string, userId: string): string {
    return `room:${roomId}:game:macro_inputs:${userId}`;
  }

  async deleteAllMacroInputs(roomId: string): Promise<void> {
    const pattern = `room:${roomId}:game:macro_inputs:*`;
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }
  }

  async deleteAllMacroViolations(roomId: string): Promise<void> {
    const pattern = `room:${roomId}:game:macro_violations:*`;
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }
  }

  async incrementMacroViolationCount(roomId: string, userId: string): Promise<number> {
    const key = this.getMacroViolationKey(roomId, userId);
    const count = await this.redisClient.incr(key);
    if (count === 1) {
      await this.redisClient.expire(key, 900);
    }
    return count;
  }

  async getMacroViolationCount(roomId: string, userId: string): Promise<number> {
    const key = this.getMacroViolationKey(roomId, userId);
    const value = await this.redisClient.get(key);
    return value ? Number.parseInt(value, 10) : 0;
  }

  async addInputTimestamp(roomId: string, userId: string, timestamp: number, delta: number): Promise<void> {
    const key = this.getMacroDetectionKey(roomId, userId);
    // 리스트에 타임스탬프와 델타를 JSON 형태로 추가하고, 리스트의 길이를 100으로 제한하여 최신 100개만 유지
    await this.redisClient.lPush(key, JSON.stringify({ timestamp, delta }));
    await this.redisClient.lTrim(key, 0, 99); // 인덱스 0부터 99까지 유지 (최신 100개)
  }

  async getInputTimestamps(roomId: string, userId: string): Promise<InputLog[]> {
    const key = this.getMacroDetectionKey(roomId, userId);
    const rawLogs = await this.redisClient.lRange(key, 0, -1);
    // Redis 리스트는 역순으로 저장되므로, 파싱 후 시간 순서대로 정렬하여 반환
    return rawLogs.map((log) => JSON.parse(log) as InputLog).sort((a, b) => a.timestamp - b.timestamp);
  }
}
