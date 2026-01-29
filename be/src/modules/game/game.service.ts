import { Injectable, Logger, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Server } from 'socket.io';
import { RedisClientType } from 'redis';
import { RoomService } from '@src/modules/room/room.service';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { REDIS_CLIENT } from '@src/providers/redis/redis.provider';
import { Game } from './game.entity';
import { GameRecord } from '../game-record/game-record.entity';
import {
  GameListResponseDto,
  GameParticipantDto,
  GameInfoPayloadDto,
  GameSelectBroadcastDto,
  GameJoinAckResponseDto,
  GameHostDto,
  GamePlayerDto,
  GameReadyBroadcastDto,
  GameStartBroadcastDto,
  GameCloseBroadcastDto,
  GameRealtimeBroadcastDto,
  GameResultBroadcastDto,
  GameResultItemDto,
} from './dto/game-response.dto';
import { WS_EVENTS_GAME } from '@src/common/constants/ws-events.constant';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private readonly GAME_START_DELAY_MS = 5000;
  private readonly REALTIME_BROADCAST_INTERVAL_MS = 300; // 300ms 주기로 상태 브로드캐스트
  private realtimeBroadcastTimers: Map<string, NodeJS.Timeout> = new Map(); // 방별 브로드캐스트 타이머
  private readonly gameEndTimers: Map<string, NodeJS.Timeout> = new Map(); // 방별 게임 종료 타이머

  constructor(
    @Inject(forwardRef(() => RoomService)) private readonly roomService: RoomService,
    @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameRecord) private readonly gameRecordRepository: Repository<GameRecord>,
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  /**
   * 전체 게임 목록 조회
   */
  async getAllGames(): Promise<GameListResponseDto> {
    try {
      const games = await this.gameRepository.find();
      return { games };
    } catch (error) {
      this.logger.error('게임 목록 조회 중 오류 발생', error.stack);
      throw error;
    }
  }

  /**
   * 게임 모집 시작
   * @param server Socket.io 서버 인스턴스
   * @param roomId 방 ID
   * @param userId 사용자 ID
   */
  async startGameRecruiting(server: Server, roomId: string, userId: string): Promise<void> {
    const roomExists = await this.roomService.roomExists(roomId);
    if (!roomExists) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }
    const isInRoom = await this.roomService.isUserInRoom(userId, roomId);
    if (!isInRoom) {
      throw new NotFoundException('해당 방에 참여하지 않았습니다.');
    }
    const isHost = await this.roomService.isHost(userId, roomId);
    if (!isHost) {
      throw new ForbiddenException('방장만 게임 모집을 시작할 수 있습니다.');
    }

    // Redis에 게임 모집 상태 저장
    const gameKey = this.getGameKey(roomId);
    await this.redisClient.hSet(gameKey, 'is_recruiting', '1');

    // 방장도 참가자 명단에 추가
    await this.addParticipant(roomId, userId);

    // 방장도 게임 준비 완료 상태로 설정
    const hostParticipantKey = this.getParticipantKey(roomId, userId);
    await this.redisClient.hSet(hostParticipantKey, 'is_ready', '1');

    // 해당 방의 모든 참여자에게 브로드캐스트
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_RECRUIT, {
      is_game_recruiting: true,
    });

    logMessage(this.logger, LOG.GAME.RECRUIT_STARTED(roomId, userId));
  }

  /**
   * 게임 참가
   */
  async joinGame(server: Server, roomId: string, userId: string): Promise<GameJoinAckResponseDto> {
    // 방 존재 여부
    const isRoomExists = await this.roomService.roomExists(roomId);
    if (!isRoomExists) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }
    // 사용자가 그 방 멤버인지 확인
    const isInRoom = await this.roomService.isUserInRoom(userId, roomId);
    if (!isInRoom) {
      throw new ForbiddenException('해당 방에 참여하지 않았습니다.');
    }

    // 게임 모집 중인지 확인
    const isRecruiting = await this.isGameRecruiting(roomId);
    if (!isRecruiting) {
      throw new ForbiddenException('게임 모집 중이 아닙니다.');
    }

    // 게임 참가자 명단에 추가. 새로 추가된 경우는 true 반환, 기존에 존재했으면 false 반환
    const wasAdded = await this.addParticipant(roomId, userId);

    const [roomInfo, players, selectedGame] = await Promise.all([
      this.roomService.getRoom(roomId),
      this.getGamePlayers(roomId),
      this.getSelectedGame(roomId),
    ]);

    const currentPlayers = players.length;

    const hostProfile = this.extractHostProfile(roomInfo.host_id, players, roomInfo.players);

    const mappedPlayers: GamePlayerDto[] = players.map((participant) => ({
      player_id: participant.player_id,
      nickname: participant.nickname,
      profile_image: participant.profile_image,
      is_ready: participant.is_ready,
    }));

    // max_players는 선택된 게임의 최대 인원을 우선 사용, 없으면 방 최대 인원으로 대체
    const maxPlayers = selectedGame?.max_players ?? roomInfo.max_participants;

    const ackPayload = new GameJoinAckResponseDto(currentPlayers, maxPlayers, hostProfile, mappedPlayers, selectedGame);

    // 새로 추가된 경우에만 브로드캐스트
    if (wasAdded) {
      await this.broadcastGameJoin(server, roomId, userId, currentPlayers, mappedPlayers);
    }

    logMessage(this.logger, LOG.GAME.JOIN_REQUEST(roomId, userId));

    return ackPayload;
  }

  /**
   * 게임 나가기
   */
  async leaveGame(server: Server, roomId: string, userId: string): Promise<void> {
    const playerKey = this.getParticipantKey(roomId, userId);
    const exists = await this.redisClient.exists(playerKey);

    if (exists) {
      await this.redisClient.del(playerKey);
      await this.redisClient.zRem(this.getScoreKey(roomId), userId);
      logMessage(this.logger, LOG.GAME.LEAVE(roomId, userId));

      // 남은 참여자 수 계산 및 브로드캐스트
      const currentPlayers = await this.getCurrentPlayers(roomId);
      server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_LEAVE, {
        player_id: userId,
        current_players: currentPlayers,
      });
    }
  }

  /**
   * 게임 선택
   */
  async selectGame(server: Server, roomId: string, userId: string, gameId: string): Promise<void> {
    const roomExists = await this.roomService.roomExists(roomId);
    if (!roomExists) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    const isInRoom = await this.roomService.isUserInRoom(userId, roomId);
    if (!isInRoom) {
      throw new ForbiddenException('해당 방에 참여하지 않았습니다.');
    }

    const isHost = await this.roomService.isHost(userId, roomId);
    if (!isHost) {
      throw new ForbiddenException('방장만 게임을 선택할 수 있습니다.');
    }

    // db에서 게임 정보 조회
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException('존재하지 않는 게임입니다.');
    }

    // 브로드캐스트 용 페이로드
    const payload = new GameInfoPayloadDto(
      game.id,
      game.title,
      game.description || '',
      game.type,
      game.min_players || 0,
      game.max_players || 0,
      (game.time ?? 0) * 1000,
    );
    await this.redisClient.hSet(this.getGameKey(roomId), { ...payload });
    const roomBroadcast: GameSelectBroadcastDto = { game: payload };
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_SELECT, roomBroadcast);

    logMessage(this.logger, LOG.GAME.SELECT(roomId, userId, gameId));
  }

  /**
   * 게임 준비 완료
   */
  async readyGame(server: Server, roomId: string, userId: string): Promise<void> {
    const playerKey = this.getParticipantKey(roomId, userId);
    const exists = await this.redisClient.exists(playerKey);

    if (!exists) {
      throw new NotFoundException('게임 참가자 정보를 찾을 수 없습니다.');
    }

    // 선택된 게임 정보 조회
    const selectedGame = await this.getSelectedGame(roomId);
    if (selectedGame) {
      const maxPlayers = selectedGame.max_players;
      if (maxPlayers) {
        // 현재 준비 완료한 참가자 수 조회 (본인 포함 전)
        const currentReadyPlayers = await this.getCurrentReadyPlayers(roomId);

        // 본인이 준비 완료하면 최대 인원을 초과하는지 확인
        if (currentReadyPlayers + 1 > maxPlayers) {
          throw new ForbiddenException('게임 최대 인원을 초과할 수 없습니다.');
        }
      }
    }

    await this.redisClient.hSet(playerKey, 'is_ready', '1');

    // 준비 완료 브로드캐스트
    const readyBroadcast: GameReadyBroadcastDto = {
      player_id: userId,
      is_ready: true,
    };
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_READY, readyBroadcast);

    logMessage(this.logger, LOG.GAME.READY(roomId, userId));
  }

  /**
   * 게임 준비 해제
   */
  async unreadyGame(server: Server, roomId: string, userId: string): Promise<void> {
    const playerKey = this.getParticipantKey(roomId, userId);
    const exists = await this.redisClient.exists(playerKey);

    if (!exists) {
      throw new NotFoundException('게임 참가자 정보를 찾을 수 없습니다.');
    }

    await this.redisClient.hSet(playerKey, 'is_ready', '0');

    // 준비 해제 브로드캐스트
    const unreadyBroadcast: GameReadyBroadcastDto = {
      player_id: userId,
      is_ready: false,
    };
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_UNREADY, unreadyBroadcast);

    logMessage(this.logger, LOG.GAME.UNREADY(roomId, userId));
  }

  /**
   * 게임 닫기 (방장 전용)
   */
  async closeGame(server: Server, roomId: string, userId: string): Promise<void> {
    // 방 존재 여부 확인
    const roomExists = await this.roomService.roomExists(roomId);
    if (!roomExists) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    // 사용자가 방에 참여 중인지 확인
    const isInRoom = await this.roomService.isUserInRoom(userId, roomId);
    if (!isInRoom) {
      throw new ForbiddenException('해당 방에 참여하지 않았습니다.');
    }

    // 방장만 게임 모집 닫기 가능
    const isHost = await this.roomService.isHost(userId, roomId);
    if (!isHost) {
      throw new ForbiddenException('방장만 게임 모집을 닫을 수 있습니다.');
    }

    // 게임 시작 후에는 게임 닫기 불가능
    const gameKey = this.getGameKey(roomId);
    const startTime = await this.redisClient.hGet(gameKey, 'start_time');
    if (startTime) {
      throw new ForbiddenException('게임 시작 후에는 게임을 닫을 수 없습니다.');
    }

    // Redis에서 게임 모집 상태를 0으로 변경
    await this.redisClient.hSet(gameKey, 'is_recruiting', '0');

    // 게임 정보 삭제
    await this.redisClient.del(gameKey);
    await this.redisClient.del(this.getScoreKey(roomId));
    // 참가자 명단 삭제
    const pattern = `room:${roomId}:game:players:*`;
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) await this.redisClient.del(keys);

    // 해당 방의 모든 참여자에게 브로드캐스트
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_CLOSE, new GameCloseBroadcastDto(false));

    logMessage(this.logger, LOG.GAME.CLOSE(roomId, userId));
  }

  /**
   * 방장이 연결 해제 시 게임 모집 종료 처리 (예외 없이 조용히 처리)
   */
  async closeGameOnDisconnect(server: Server, roomId: string, userId: string): Promise<void> {
    try {
      // 방 존재 여부 확인
      const roomExists = await this.roomService.roomExists(roomId);
      if (!roomExists) return;

      // 방장인지 확인
      const isHost = await this.roomService.isHost(userId, roomId);
      if (!isHost) return;

      // 게임 모집 중인지 확인
      const isRecruiting = await this.isGameRecruiting(roomId);
      if (!isRecruiting) return;

      // 게임 시작 후에는 게임 닫기 불가능
      const gameKey = this.getGameKey(roomId);
      const startTime = await this.redisClient.hGet(gameKey, 'start_time');
      if (startTime) return;

      // Redis에서 게임 모집 상태를 0으로 변경
      await this.redisClient.hSet(gameKey, 'is_recruiting', '0');

      // 게임 정보 삭제
      await this.redisClient.del(gameKey);
      await this.redisClient.del(this.getScoreKey(roomId));
      // 참가자 명단 삭제
      const pattern = `room:${roomId}:game:players:*`;
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }

      // 해당 방의 모든 참여자에게 브로드캐스트
      server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_CLOSE, new GameCloseBroadcastDto(false));

      logMessage(this.logger, LOG.GAME.CLOSE(roomId, userId));
    } catch (error) {
      // 예외 발생 시 조용히 처리 (로그만 남김)
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`게임 모집 종료 처리 중 오류 발생: ${errorMessage}`);
    }
  }

  /**
   * 게임 시작 (3초 지연 시작 시간 전달)
   */
  async startGame(server: Server, roomId: string, userId: string): Promise<number> {
    const roomExists = await this.roomService.roomExists(roomId);
    if (!roomExists) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    const isInRoom = await this.roomService.isUserInRoom(userId, roomId);
    if (!isInRoom) {
      throw new ForbiddenException('해당 방에 참여하지 않았습니다.');
    }

    const isHost = await this.roomService.isHost(userId, roomId);
    if (!isHost) {
      throw new ForbiddenException('방장만 게임을 시작할 수 있습니다.');
    }

    const selectedGame = await this.getSelectedGame(roomId);
    if (!selectedGame) {
      throw new NotFoundException('선택된 게임이 없습니다.');
    }

    const [currentReadyPlayers] = await Promise.all([this.getCurrentReadyPlayers(roomId)]);

    const minParticipants = selectedGame.min_players;
    if (minParticipants && currentReadyPlayers < minParticipants) {
      throw new ForbiddenException('게임 최소 인원 조건을 충족하지 못했습니다.');
    }

    const startTimeMs = this.clientStartTimeMs();

    await this.redisClient.hSet(this.getGameKey(roomId), {
      start_time: startTimeMs.toString(),
      is_recruiting: '0',
    });

    // 게임 준비 완료한 참가자들만 조회해서 점수 ZSET 초기화 -> room:${roomId}:game:scores
    const pattern = `room:${roomId}:game:players:*`;
    const keys = await this.redisClient.keys(pattern);
    const scoreEntries: Array<{ score: number; value: string }> = [];
    for (const key of keys) {
      const isReady = await this.redisClient.hGet(key, 'is_ready');
      if (isReady === '1') {
        const userId = key.replace(`room:${roomId}:game:players:`, '');
        scoreEntries.push({ score: 0, value: userId });
      }
    }
    if (scoreEntries.length > 0) {
      await this.redisClient.zAdd(this.getScoreKey(roomId), scoreEntries);
    }

    // 게임 자동 종료 타이머 스케줄링 (start_time + time 기준)
    const playDurationMs = selectedGame.time;

    const broadcast: GameStartBroadcastDto = {
      start_time: startTimeMs,
      delay_ms: this.GAME_START_DELAY_MS,
      play_duration_ms: playDurationMs,
    };
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_START, broadcast);

    logMessage(this.logger, LOG.GAME.START(roomId, userId, new Date(startTimeMs).toUTCString()));

    if (playDurationMs > 0) {
      this.scheduleGameEnd(server, roomId, selectedGame.id, this.GAME_START_DELAY_MS + playDurationMs);
    }

    return startTimeMs;
  }

  /**
   * 실시간 게임 중 정보
   */
  async handleRealtimeInput(server: Server, roomId: string, userId: string, delta: string): Promise<void> {
    try {
      // 방 존재 여부 확인
      const roomExists = await this.roomService.roomExists(roomId);
      if (!roomExists) {
        throw new NotFoundException('존재하지 않는 방입니다.');
      }

      // 사용자가 방에 참여 중인지 확인
      const isInRoom = await this.roomService.isUserInRoom(userId, roomId);
      if (!isInRoom) {
        throw new ForbiddenException('해당 방에 참여하지 않았습니다.');
      }

      // 게임 참가자인지 확인
      const playerKey = this.getParticipantKey(roomId, userId);
      const playerExists = await this.redisClient.exists(playerKey);
      if (!playerExists) {
        throw new ForbiddenException('게임 참가자가 아닙니다.');
      }

      // 게임 시작 여부 확인
      const gameKey = this.getGameKey(roomId);
      const startTime = await this.redisClient.hGet(gameKey, 'start_time');
      if (!startTime) {
        throw new ForbiddenException('게임이 시작되지 않았습니다.');
      }

      // delta 값 검증
      const deltaNum = parseInt(delta, 10);
      if (isNaN(deltaNum)) throw new Error('Invalid delta value');

      // 현재 사용자의 점수 업데이트
      await this.updateParticipantScore(roomId, userId, deltaNum);

      // 300ms 주기 브로드캐스트 스케줄링
      this.scheduleRealtimeBroadcast(server, roomId);

      logMessage(this.logger, LOG.GAME.REALTIME_INPUT(roomId, userId, delta));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.GAME.REALTIME_INPUT_ERROR(roomId, userId, errorMessage));
      throw error;
    }
  }

  /**
   * 게임 종료 시 최종 결과 브로드캐스트 및 랭킹 등록
   * - Redis ZSET/해시 기반으로 최종 결과 생성
   * - game_record 테이블에 최고 점수 기준으로 upsert
   * - Redis 게임 관련 키 정리
   */
  async endGameAndBroadcastResults(server: Server, roomId: string, gameId: string): Promise<void> {
    // 실시간 브로드캐스트 타이머 중지
    this.stopRealtimeBroadcast(roomId);

    // 점수 ZSET에서 모든 참가자 점수 조회 (내림차순)
    const scores = await this.redisClient.zRangeWithScores(this.getScoreKey(roomId), 0, -1, {
      REV: true,
    });

    if (scores.length === 0) {
      return;
    }

    const results: GameResultItemDto[] = [];

    let currentRank = 1;
    let previousScore: number | null = null;

    const achieveDate = new Date();

    for (let i = 0; i < scores.length; i++) {
      const { value: userId, score } = scores[i];

      // 이전 점수와 다르면 현재 인덱스 기반으로 순위 갱신 (동점자는 같은 순위)
      if (previousScore !== null && score !== previousScore) {
        currentRank = i + 1;
      }

      const playerKey = this.getParticipantKey(roomId, userId);
      const playerData = await this.redisClient.hGetAll(playerKey);

      const resultItem: GameResultItemDto = {
        player_id: userId,
        nickname: playerData.nickname || '',
        profile_image: playerData.profile_image || '',
        score,
        rank: currentRank,
        achieve_date: achieveDate.getTime(),
      };

      results.push(resultItem);
      previousScore = score;
    }

    const successBroadcast = new GameResultBroadcastDto(results, true);
    const failedBroadcast = new GameResultBroadcastDto(results, false, '게임 기록 저장 실패');

    // game_record 테이블에 최고 점수 기준으로 upsert (트랜잭션 처리)
    // 모든 플레이어의 기록이 함께 저장되거나, 모두 실패하도록 하여(all or nothing) 공정성 보장
    // N+1 문제 해결: 벌크 조회 -> 메모리 필터링 -> 벌크 저장
    try {
      await this.gameRecordRepository.manager.transaction(async (manager) => {
        const validResults = results.filter((item) => !isNaN(item.score));

        if (validResults.length === 0) {
          this.logger.warn(`유효한 게임 기록이 없음: roomId=${roomId}`);
          return;
        }

        // 모든 user_id에 대한 기존 기록을 한 번에 조회 (N+1 -> 1번 쿼리)
        const userIds = validResults.map((item) => item.player_id);
        const existingRecords = await manager.find(GameRecord, {
          where: {
            game_id: gameId,
            user_id: In(userIds),
          },
        });

        // 기존 기록을 Map으로 변환 (빠른 조회)
        const existingRecordMap = new Map<string, GameRecord>();
        existingRecords.forEach((record) => {
          existingRecordMap.set(record.user_id, record);
        });

        // 메모리에서 비교하여 신규 생성 / 업데이트 분리
        const recordsToInsert: GameRecord[] = [];
        const recordsToUpdate: GameRecord[] = [];

        for (const item of validResults) {
          const existingRecord = existingRecordMap.get(item.player_id);

          if (!existingRecord) {
            // 기존 기록 없음 -> 신규 생성
            recordsToInsert.push(
              manager.create(GameRecord, {
                user_id: item.player_id,
                game_id: gameId,
                score: item.score,
                achieve_date: achieveDate,
              }),
            );
          } else if (item.score > existingRecord.score) {
            // 기존 기록보다 점수가 높음 -> 업데이트
            existingRecord.score = item.score;
            existingRecord.achieve_date = achieveDate;
            recordsToUpdate.push(existingRecord);
          }
          // 기존 점수가 더 높거나 같으면 아무것도 안 함
        }

        // 벌크 저장 (insert + update를 각각 한 번씩)
        if (recordsToInsert.length > 0) {
          await manager.save(GameRecord, recordsToInsert);
        }
        if (recordsToUpdate.length > 0) {
          await manager.save(GameRecord, recordsToUpdate);
        }
      });

      // DB 저장 성공 후 결과 브로드캐스트
      server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_RESULT, successBroadcast);

      logMessage(this.logger, LOG.GAME.RESULT_BROADCAST(roomId, results));
    } catch (error) {
      // 트랜잭션 실패 시 전체 롤백되므로 에러 로그 남김
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `게임 기록 저장 트랜잭션 실패: roomId=${roomId}, gameId=${gameId}, error=${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      // 저장 실패 시 실패했다고 브로드캐스팅
      server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_RESULT, failedBroadcast);
    } finally {
      // Redis 게임 관련 키 정리
      try {
        const participantPattern = `room:${roomId}:game:players:*`;
        const participantKeys = await this.redisClient.keys(participantPattern);

        const deleteTargets: string[] = [this.getScoreKey(roomId), this.getGameKey(roomId)];
        if (participantKeys.length > 0) {
          deleteTargets.push(...participantKeys);
        }

        if (deleteTargets.length > 0) {
          await this.redisClient.del(deleteTargets);
        }
      } catch (cleanupError) {
        // Redis 정리 실패 시에도 로그만 남기고 계속 진행
        const errorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        this.logger.error(`Redis 정리 실패: roomId=${roomId}, error=${errorMessage}`);
      }
    }
  }

  // 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️ 헬퍼 함수 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️

  private getParticipantKey(roomId: string, userId: string): string {
    return `room:${roomId}:game:players:${userId}`;
  }

  private getScoreKey(roomId: string): string {
    return `room:${roomId}:game:scores`;
  }

  private getGameKey(roomId: string): string {
    return `room:${roomId}:game`;
  }

  async isGameRecruiting(roomId: string): Promise<boolean> {
    const gameKey = this.getGameKey(roomId);
    const value = await this.redisClient.hGet(gameKey, 'is_recruiting');
    return value === '1';
  }

  private extractHostProfile(
    hostId: string,
    participants: GameParticipantDto[],
    roomParticipants?: Array<{ player_id: string; nickname: string; profile_image: string }>,
  ): GameHostDto {
    const host =
      participants.find((participant) => participant.player_id === hostId) ||
      roomParticipants?.find((participant) => participant.player_id === hostId);

    return {
      player_id: hostId,
      nickname: host?.nickname || '',
      profile_image: host?.profile_image || '',
    };
  }

  private async addParticipant(roomId: string, userId: string): Promise<boolean> {
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
      });

      return true;
    }
    return false;
  }

  async getGamePlayers(roomId: string): Promise<GameParticipantDto[]> {
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
        score: parseInt(playerData.score, 10) || 0,
        rank: parseInt(playerData.rank, 10) || 0,
      });
    }

    return participants;
  }

  private async getSelectedGame(roomId: string): Promise<GameInfoPayloadDto | undefined> {
    try {
      const gameKey = this.getGameKey(roomId);
      // Redis에서 조회만 수행 (selectGame에서 이미 저장됨)
      const gameData = await this.redisClient.hGetAll(gameKey);
      if (!gameData || Object.keys(gameData).length === 0) return undefined;
      if (!gameData.id) return undefined;

      // Redis에 저장된 게임 정보 반환
      const gamePayload = new GameInfoPayloadDto(
        gameData.id,
        gameData.title,
        gameData.description,
        gameData.type,
        parseInt(gameData.min_players, 10),
        parseInt(gameData.max_players, 10),
        parseInt(gameData.time, 10),
      );

      return gamePayload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(this.logger, LOG.GAME.GAME_STATE_FETCH_ERROR(roomId, errorMessage));
      return undefined;
    }
  }

  async getCurrentPlayers(roomId: string): Promise<number> {
    const pattern = `room:${roomId}:game:players:*`;
    const keys = await this.redisClient.keys(pattern);
    return keys.length;
  }

  async getCurrentReadyPlayers(roomId: string): Promise<number> {
    const pattern = `room:${roomId}:game:players:*`;
    const keys = await this.redisClient.keys(pattern);

    let readyCount = 0;

    for (const key of keys) {
      const isReady = await this.redisClient.hGet(key, 'is_ready');
      if (isReady === '1') readyCount++;
    }

    return readyCount;
  }

  private async updateParticipantScore(roomId: string, userId: string, deltaDelta: number): Promise<void> {
    // zIncrBy는 없는 member에 대해 자동으로 0부터 시작하므로, 초기화 없이 첫 입력 시 자동으로 생성되게 할 수도 있음
    // 그러나 명시적으로 게임 시작 시 초기화를 수행함
    await this.redisClient.zIncrBy(this.getScoreKey(roomId), deltaDelta, userId);
  }

  private clientStartTimeMs(): number {
    return Date.now() + this.GAME_START_DELAY_MS;
  }

  private async broadcastGameJoin(
    server: Server,
    roomId: string,
    userId: string,
    currentPlayers: number,
    participants: GameParticipantDto[],
  ): Promise<void> {
    const joinedParticipant = participants.find((participant) => participant.player_id === userId);

    const payload = {
      player: {
        player_id: joinedParticipant?.player_id || userId,
        nickname: joinedParticipant?.nickname || '',
        profile_image: joinedParticipant?.profile_image || '',
        is_ready: joinedParticipant?.is_ready ?? false,
      },
      current_players: currentPlayers.toString(),
    };

    server.to(roomId).except(userId).emit(WS_EVENTS_GAME.PLAYER_JOIN, payload);
  }

  /**
   * 300ms 주기의 브로드캐스트 스케줄링
   * - 중복 스케줄링 방지
   * - 한 번 스케줄되면 주기마다 자동으로 상태 브로드캐스트
   */
  private scheduleRealtimeBroadcast(server: Server, roomId: string): void {
    const timerKey = `realtime:${roomId}`;

    // 이미 스케줄된 경우 추가 스케줄링 하지 않음
    if (this.realtimeBroadcastTimers.has(timerKey)) {
      return;
    }

    // 처음 스케줄링 시 타이머 설정
    const handleRealtimeBroadcast = async () => {
      try {
        await this.broadcastRealtimeState(server, roomId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`브로드캐스트 중 오류: roomId=${roomId}, error=${message}`);
      }
    };

    const broadcastTimer = setInterval(() => {
      void handleRealtimeBroadcast();
    }, this.REALTIME_BROADCAST_INTERVAL_MS);

    this.realtimeBroadcastTimers.set(timerKey, broadcastTimer);
  }

  /**
   * 게임 자동 종료 타이머 스케줄링
   * - duration 후 endGameAndBroadcastResults 호출
   * - 방별로 하나의 타이머만 유지
   */
  private scheduleGameEnd(server: Server, roomId: string, gameId: string, durationMs: number): void {
    const timerKey = `end:${roomId}`;

    // 이미 종료 타이머가 설정되어 있다면 중복 설정 방지
    if (this.gameEndTimers.has(timerKey)) {
      return;
    }

    const handleGameEnd = async () => {
      try {
        await this.endGameAndBroadcastResults(server, roomId, gameId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`게임 자동 종료 처리 중 오류: roomId=${roomId}, error=${message}`);
      } finally {
        this.gameEndTimers.delete(timerKey);
      }
    };

    const endTimer = setTimeout(() => {
      void handleGameEnd();
    }, durationMs);

    this.gameEndTimers.set(timerKey, endTimer);
  }

  /**
   * 실시간 게임 상태 브로드캐스트
   * - 현재 최고 점수
   * - 평균 점수
   * - 현재 랭킹 순서
   */
  private async broadcastRealtimeState(server: Server, roomId: string): Promise<void> {
    try {
      // 점수 ZSET에서 모든 참가자 점수 조회 (내림차순)
      const scores = await this.redisClient.zRangeWithScores(this.getScoreKey(roomId), 0, -1, {
        REV: true,
      });

      if (scores.length === 0) {
        this.stopRealtimeBroadcast(roomId);
        return;
      }

      const highestScore = scores[0]?.score || 0;
      const totalScore = scores.reduce((sum, entry) => sum + entry.score, 0);
      const averageScore = (totalScore / scores.length).toFixed(2);
      const ranks = scores.map((entry) => entry.value);

      // 동점자 처리: 같은 점수는 같은 순위, 다음 순위는 건너뜀
      await this.updateParticipantRanksWithTies(roomId, scores);

      // 브로드캐스트
      const broadcast: GameRealtimeBroadcastDto = {
        highest_score: highestScore,
        average_score: parseFloat(averageScore),
        ranks,
      };

      server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_REALTIME, broadcast);

      logMessage(this.logger, LOG.GAME.REALTIME_BROADCAST(roomId, highestScore, averageScore, ranks));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`실시간 상태 브로드캐스트 실패: roomId=${roomId}, error=${errorMessage}`);
      throw error;
    }
  }

  /**
   * 참가자 랭크 업데이트 (동점자 처리)
   */
  private async updateParticipantRanksWithTies(
    roomId: string,
    scores: Array<{ value: string; score: number }>,
  ): Promise<void> {
    let currentRank = 1;
    let previousScore: number | null = null;

    for (let i = 0; i < scores.length; i++) {
      const { value: userId, score } = scores[i];

      // 이전 점수와 다르면 현재 인덱스 기반으로 순위 갱신
      if (previousScore !== null && score !== previousScore) {
        currentRank = i + 1;
      }

      const playerKey = this.getParticipantKey(roomId, userId);
      await this.redisClient.hSet(playerKey, 'rank', currentRank.toString());

      previousScore = score;
    }
  }

  /**
   * 실시간 브로드캐스트 타이머 중지
   */
  public stopRealtimeBroadcast(roomId: string): void {
    const timerKey = `realtime:${roomId}`;
    const timer = this.realtimeBroadcastTimers.get(timerKey);

    if (timer) {
      clearInterval(timer);
      this.realtimeBroadcastTimers.delete(timerKey);
      logMessage(this.logger, LOG.GAME.REALTIME_BROADCAST_STOPPED(roomId));
    }
  }
}
