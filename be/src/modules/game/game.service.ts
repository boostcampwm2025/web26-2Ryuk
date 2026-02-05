import { Injectable, Logger, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from 'socket.io';
import { RoomService } from '@src/modules/room/room.service';
import { LOG, logMessage } from '@src/common/utils/log-messages';
import { Game } from './game.entity';
import {
  GameListResponseDto,
  GameParticipantDto,
  GameInfoPayloadDto,
  GameJoinAckResponseDto,
  GameHostDto,
  GamePlayerDto,
  GameStartBroadcastDto,
  GameResultBroadcastDto,
  GameResultItemDto,
} from './dto/game-response.dto';
import { GameRepository } from './game.repository';
import { GameBroadcastService } from './game-broadcast.service';
import { GameTimerService } from './game-timer.service';
import { GameRecordRepository } from '@src/modules/game-record/game-record.repository';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private readonly GAME_START_DELAY_MS = 5000;
  private readonly STRIKE_2_FREEZE_MS = 3000; // 매크로 2회 감지 입력 동결 시간
  private readonly STRIKE_3_FREEZE_MS = 999000; // 매크로 2회 감지, 사실상 영구 동결
  private readonly BEAKER_GAME_ID = '550e8400-e29b-41d4-a716-446655440001'; // 비커 채우기 게임 ID

  // 매크로 감지 관련 상수
  private readonly MACRO_DETECTION_WINDOW_MS = 1000; // 입력 빈도수 측정 주기 (1000ms 권장)
  private readonly MIN_LOGS_FOR_PATTERN_ANALYSIS = 11; // 패턴 분석을 위한 최소 realtimeInput 이벤트 개수
  private readonly MAX_SPACES_PER_WINDOW = 17; // 1초 동안 허용되는 총 스페이스바 입력 횟수
  private readonly MACRO_DELTA_STD_DEV_THRESHOLD = 0.3; // 스페이스바 입력 횟수(delta)의 표준편차 임계값 (0.3 ~ 1.0 추천)
  private readonly MIN_DELTAS_FOR_DELTA_PATTERN_ANALYSIS = 11; // 스페이스바 입력 횟수(delta) 패턴 분석을 위한 최소 delta 개수 (MIN_LOGS_FOR_PATTERN_ANALYSIS와 유사하게 설정)

  constructor(
    @Inject(forwardRef(() => RoomService)) private readonly roomService: RoomService,
    @InjectRepository(Game) private readonly gameEntityRepository: Repository<Game>,
    private readonly gameRepository: GameRepository,
    private readonly gameRecordRepository: GameRecordRepository,
    private readonly gameBroadcastService: GameBroadcastService,
    private readonly gameTimerService: GameTimerService,
  ) {}

  /**
   * 전체 게임 목록 조회
   */
  async getAllGames(): Promise<GameListResponseDto> {
    try {
      const games = await this.gameEntityRepository.find();
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
    await this.gameRepository.setGameRecruiting(roomId, true);

    // 방장도 참가자 명단에 추가
    await this.gameRepository.addParticipant(roomId, userId);

    // 방장도 게임 준비 완료 상태로 설정
    await this.gameRepository.setParticipantReady(roomId, userId, true);

    // 해당 방의 모든 참여자에게 브로드캐스트
    this.gameBroadcastService.broadcastGameRecruit(server, roomId);

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
    const isRecruiting = await this.gameRepository.isGameRecruiting(roomId);
    if (!isRecruiting) {
      throw new ForbiddenException('게임 모집 중이 아닙니다.');
    }

    // 게임 참가자 명단에 추가. 새로 추가된 경우는 true 반환, 기존에 존재했으면 false 반환
    const wasAdded = await this.gameRepository.addParticipant(roomId, userId);

    const [roomInfo, players, selectedGame] = await Promise.all([
      this.roomService.getRoom(roomId),
      this.gameRepository.getAllParticipants(roomId),
      this.gameRepository.getSelectedGame(roomId),
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
      this.gameBroadcastService.broadcastGameJoin(server, roomId, userId, currentPlayers, mappedPlayers);
    }

    logMessage(this.logger, LOG.GAME.JOIN_REQUEST(roomId, userId));

    return ackPayload;
  }

  /**
   * 게임 나가기
   */
  async leaveGame(server: Server, roomId: string, userId: string): Promise<void> {
    const exists = await this.gameRepository.participantExists(roomId, userId);

    if (exists) {
      await this.gameRepository.removeParticipant(roomId, userId);
      await this.gameRepository.removeScore(roomId, userId);
      logMessage(this.logger, LOG.GAME.LEAVE(roomId, userId));

      // 남은 참여자 수 계산 및 브로드캐스트
      const currentPlayers = await this.gameRepository.getCurrentPlayersCount(roomId);
      this.gameBroadcastService.broadcastGameLeave(server, roomId, userId, currentPlayers);
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
    const game = await this.gameEntityRepository.findOne({ where: { id: gameId } });
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
    await this.gameRepository.setSelectedGame(roomId, payload);
    this.gameBroadcastService.broadcastGameSelect(server, roomId, payload);

    logMessage(this.logger, LOG.GAME.SELECT(roomId, userId, gameId));
  }

  /**
   * 게임 준비 완료
   */
  async readyGame(server: Server, roomId: string, userId: string): Promise<void> {
    const exists = await this.gameRepository.participantExists(roomId, userId);

    if (!exists) {
      throw new NotFoundException('게임 참가자 정보를 찾을 수 없습니다.');
    }

    // 선택된 게임 정보 조회
    const selectedGame = await this.gameRepository.getSelectedGame(roomId);
    if (selectedGame) {
      const maxPlayers = selectedGame.max_players;
      if (maxPlayers) {
        // 현재 준비 완료한 참가자 수 조회 (본인 포함 전)
        const currentReadyPlayers = await this.gameRepository.getCurrentReadyPlayersCount(roomId);

        // 본인이 준비 완료하면 최대 인원을 초과하는지 확인
        if (currentReadyPlayers + 1 > maxPlayers) {
          throw new ForbiddenException('게임 최대 인원을 초과할 수 없습니다.');
        }
      }
    }

    await this.gameRepository.setParticipantReady(roomId, userId, true);

    // 준비 완료 브로드캐스트
    this.gameBroadcastService.broadcastGameReady(server, roomId, userId, true);

    logMessage(this.logger, LOG.GAME.READY(roomId, userId));
  }

  /**
   * 게임 준비 해제
   */
  async unreadyGame(server: Server, roomId: string, userId: string): Promise<void> {
    const exists = await this.gameRepository.participantExists(roomId, userId);

    if (!exists) {
      throw new NotFoundException('게임 참가자 정보를 찾을 수 없습니다.');
    }

    await this.gameRepository.setParticipantReady(roomId, userId, false);

    // 준비 해제 브로드캐스트
    this.gameBroadcastService.broadcastGameUnready(server, roomId, userId);

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
    const startTime = await this.gameRepository.getGameStartTime(roomId);
    if (startTime) {
      throw new ForbiddenException('게임 시작 후에는 게임을 닫을 수 없습니다.');
    }

    // Redis에서 게임 모집 상태를 0으로 변경
    await this.gameRepository.setGameRecruiting(roomId, false);

    // 게임 정보 삭제
    await this.gameRepository.deleteAllGameData(roomId);

    // 해당 방의 모든 참여자에게 브로드캐스트
    this.gameBroadcastService.broadcastGameClose(server, roomId, false);

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
      const isRecruiting = await this.gameRepository.isGameRecruiting(roomId);
      if (!isRecruiting) return;

      // 게임 시작 후에는 게임 닫기 불가능
      const startTime = await this.gameRepository.getGameStartTime(roomId);
      if (startTime) return;

      // Redis에서 게임 모집 상태를 0으로 변경
      await this.gameRepository.setGameRecruiting(roomId, false);

      // 게임 정보 삭제
      await this.gameRepository.deleteAllGameData(roomId);

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

    const selectedGame = await this.gameRepository.getSelectedGame(roomId);
    if (!selectedGame) {
      throw new NotFoundException('선택된 게임이 없습니다.');
    }

    const [currentReadyPlayers] = await Promise.all([this.gameRepository.getCurrentReadyPlayersCount(roomId)]);

    const minParticipants = selectedGame.min_players;
    if (minParticipants && currentReadyPlayers < minParticipants) {
      throw new ForbiddenException('게임 최소 인원 조건을 충족하지 못했습니다.');
    }

    const startTimeMs = this.clientStartTimeMs();

    await this.gameRepository.setGameStartTime(roomId, startTimeMs);
    await this.gameRepository.setGameRecruiting(roomId, false);

    // 게임 준비 완료한 참가자들만 조회해서 점수 ZSET 초기화
    const readyUserIds = await this.gameRepository.getReadyParticipants(roomId);
    if (readyUserIds.length > 0) {
      await this.gameRepository.initializeScores(roomId, readyUserIds);
    }

    // 게임 자동 종료 타이머 스케줄링 (start_time + time 기준)
    const playDurationMs = selectedGame.time;

    const broadcast: GameStartBroadcastDto = {
      start_time: startTimeMs,
      delay_ms: this.GAME_START_DELAY_MS,
      play_duration_ms: playDurationMs,
    };
    this.gameBroadcastService.broadcastGameStart(server, roomId, broadcast);

    logMessage(this.logger, LOG.GAME.START(roomId, userId, new Date(startTimeMs).toUTCString()));

    if (playDurationMs > 0) {
      this.gameTimerService.scheduleGameEnd(roomId, selectedGame.id, this.GAME_START_DELAY_MS + playDurationMs, () =>
        this.endGameAndBroadcastResults(server, roomId, selectedGame.id),
      );
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

      // 게임 참가자인지 확인 및 정보 조회
      const participant = await this.gameRepository.getParticipant(roomId, userId);
      if (!participant) {
        throw new ForbiddenException('게임 참가자가 아닙니다.');
      }

      // 입력 동결 상태 확인
      if (participant.frozen_until && Date.now() < participant.frozen_until) {
        const remainingMs = participant.frozen_until - Date.now();
        throw new ForbiddenException(`입력이 제한되었습니다. ${Math.ceil(remainingMs / 1000)}초 후 다시 시도하세요.`);
      }

      // 게임 시작 여부 확인
      const startTime = await this.gameRepository.getGameStartTime(roomId);
      if (!startTime) {
        throw new ForbiddenException('게임이 시작되지 않았습니다.');
      }

      // delta 값 검증
      const deltaNum = parseInt(delta, 10);
      if (isNaN(deltaNum)) throw new Error('Invalid delta value');

      // 현재 방의 선택된 게임 정보 조회
      const selectedGame = await this.gameRepository.getSelectedGame(roomId);

      // '비커 채우기' 게임일 경우에만 매크로 감지 로직 적용
      if (selectedGame?.id === this.BEAKER_GAME_ID) {
        const isMacro = await this.detectMacro(roomId, userId, deltaNum);
        if (isMacro) {
          // applyMacroSanctions는 예외를 발생시키므로, 여기서 실행이 중단됨
          await this.applyMacroSanctions(roomId, userId);
        }
      }

      // 현재 사용자의 점수 업데이트
      await this.gameRepository.updateScore(roomId, userId, deltaNum);

      // 300ms 주기 브로드캐스트 스케줄링
      this.gameTimerService.scheduleRealtimeBroadcast(roomId, () => this.broadcastRealtimeState(server, roomId));

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
    this.gameTimerService.stopRealtimeBroadcast(roomId);

    // 점수 ZSET에서 모든 참가자 점수 조회 (내림차순)
    const scores = await this.gameRepository.getAllScores(roomId);

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

      const playerData = await this.gameRepository.getParticipantData(roomId, userId);

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
    try {
      await this.gameRecordRepository.saveGameRecords(roomId, gameId, results);

      // DB 저장 성공 후 결과 브로드캐스트
      this.gameBroadcastService.broadcastGameResult(server, roomId, successBroadcast);
    } catch (error) {
      // 트랜잭션 실패 시 전체 롤백되므로 에러 로그 남김
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `게임 기록 저장 트랜잭션 실패: roomId=${roomId}, gameId=${gameId}, error=${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      // 저장 실패 시 실패했다고 브로드캐스팅
      this.gameBroadcastService.broadcastGameResult(server, roomId, failedBroadcast);
    } finally {
      // Redis 게임 관련 키 정리
      try {
        await this.gameRepository.deleteAllGameData(roomId);
      } catch (cleanupError) {
        // Redis 정리 실패 시에도 로그만 남기고 계속 진행
        const errorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        this.logger.error(`Redis 정리 실패: roomId=${roomId}, error=${errorMessage}`);
      }
    }
  }

  // ==================== 매크로 감지 ====================
  /**
   * 매크로 감지 시 "삼진 아웃" 제재 적용
   * 이 메서드는 항상 예외 발생
   */
  private async applyMacroSanctions(roomId: string, userId: string): Promise<void> {
    const violationCount = await this.gameRepository.incrementMacroViolationCount(roomId, userId);

    if (violationCount >= 3) {
      // 3회 감지: 영구 동결
      this.logger.warn(`매크로 3회 감지 (영구 동결): User ${userId} in Room ${roomId}`);
      const frozenUntil = Date.now() + this.STRIKE_3_FREEZE_MS;
      await this.gameRepository.setPlayerFrozen(roomId, userId, frozenUntil);
      throw new ForbiddenException('반복적인 비정상 입력으로 인해 이번 게임에서 영구적으로 입력이 차단됩니다.');
    } else if (violationCount === 2) {
      // 2회 감지: 3초 동결
      this.logger.warn(`매크로 2회 감지 (${this.STRIKE_2_FREEZE_MS / 1000}초 동결): User ${userId} in Room ${roomId}`);
      const frozenUntil = Date.now() + this.STRIKE_2_FREEZE_MS;
      await this.gameRepository.setPlayerFrozen(roomId, userId, frozenUntil);
      throw new ForbiddenException(
        `두 번째 비정상적 입력이 감지되어 ${this.STRIKE_2_FREEZE_MS / 1000}초간 입력이 제한됩니다.`,
      );
    } else {
      // 1회 감지: 경고
      this.logger.warn(`매크로 1회 감지 (경고): User ${userId} in Room ${roomId}`);
      throw new ForbiddenException('비정상적인 입력이 감지되었습니다. 반복 시 제재될 수 있습니다.');
    }
  }

  /**
   * 사용자 입력의 매크로 여부를 감지
   * 총 스페이스바 입력 횟수, 스페이스바 입력 횟수(delta)의 표준편차를 분석하여 비정상적인 패턴 탐지
   */
  private async detectMacro(roomId: string, userId: string, currentDelta: number): Promise<boolean> {
    const currentTime = Date.now();
    await this.gameRepository.addInputTimestamp(roomId, userId, currentTime, currentDelta);
    const inputLogs = await this.gameRepository.getInputTimestamps(roomId, userId);

    // 데이터가 충분히 쌓이지 않았으면 감지하지 않음
    if (inputLogs.length < this.MIN_LOGS_FOR_PATTERN_ANALYSIS) {
      return false;
    }

    // 1. 총 스페이스바 입력 횟수 감지 - 실제 스페이스바 연타 횟수
    // 특정 시간 윈도우 내의 총 스페이스바 입력 횟수를 검사합니다.
    const relevantLogs = inputLogs.filter((log) => currentTime - log.timestamp <= this.MACRO_DETECTION_WINDOW_MS);
    if (relevantLogs.length > 0) {
      const totalSpaces = relevantLogs.reduce((sum, log) => sum + log.delta, 0);

      if (totalSpaces > this.MAX_SPACES_PER_WINDOW) {
        this.logger.warn(
          `매크로 의심 (총 스페이스바 횟수): User ${userId} in Room ${roomId}. Total ${totalSpaces} spaces in ${this.MACRO_DETECTION_WINDOW_MS}ms. (Threshold: ${this.MAX_SPACES_PER_WINDOW})`,
        );
        return true;
      }
    }

    // 2. 스페이스바 입력 횟수 (delta)의 패턴 분석 (표준편차)
    // 각 realtimeInput 이벤트에 포함된 delta 값들의 표준편차를 계산하여 일관성을 확인
    const deltasForSpaces = inputLogs.map((log) => log.delta);
    if (deltasForSpaces.length >= this.MIN_DELTAS_FOR_DELTA_PATTERN_ANALYSIS) {
      const stdDevSpaces = this.calculateStandardDeviation(deltasForSpaces);
      const averageDelta = deltasForSpaces.reduce((sum, current) => sum + current, 0) / deltasForSpaces.length;

      // 표준편차가 임계값보다 작고 평균 델타가 1.5를 초과하는 경우 매크로 의심
      // 정상적인 느린 입력 및 약간의 불규칙성 허용
      if (stdDevSpaces < this.MACRO_DELTA_STD_DEV_THRESHOLD && averageDelta > 1.5) {
        this.logger.warn(
          `매크로 의심 (스페이스바 횟수 패턴): User ${userId} in Room ${roomId}. StdDev: ${stdDevSpaces.toFixed(2)}, AvgDelta: ${averageDelta.toFixed(2)}`,
        );
        return true;
      }
    }

    return false;
  }
  /**
   * 숫자 배열의 표준편차 계산
   */
  private calculateStandardDeviation(numbers: number[]): number {
    if (numbers.length < 2) return 0; // 최소 2개 이상의 데이터가 있어야 유의미한 표준편차 계산 가능

    const mean = numbers.reduce((sum, current) => sum + current, 0) / numbers.length;
    const variance =
      numbers.map((num) => (num - mean) ** 2).reduce((sum, current) => sum + current, 0) / numbers.length;
    return Math.sqrt(variance);
  }

  // ==================== Public API (외부에서 사용하는 메서드) ====================

  /**
   * 게임 모집 중인지 확인 (외부 API)
   */
  async isGameRecruiting(roomId: string): Promise<boolean> {
    return await this.gameRepository.isGameRecruiting(roomId);
  }

  /**
   * 게임 플레이어 목록 조회 (외부 API)
   */
  async getGamePlayers(roomId: string): Promise<GameParticipantDto[]> {
    return await this.gameRepository.getAllParticipants(roomId);
  }

  /**
   * 실시간 브로드캐스트 타이머 중지 (외부 API)
   */
  public stopRealtimeBroadcast(roomId: string): void {
    this.gameTimerService.stopRealtimeBroadcast(roomId);
  }

  // ==================== 헬퍼 함수 ====================

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

  private clientStartTimeMs(): number {
    return Date.now() + this.GAME_START_DELAY_MS;
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
      const scores = await this.gameRepository.getAllScores(roomId);

      if (scores.length === 0) {
        this.gameTimerService.stopRealtimeBroadcast(roomId);
        return;
      }

      const highestScore = scores[0]?.score || 0;
      const totalScore = scores.reduce((sum, entry) => sum + entry.score, 0);
      const averageScore = (totalScore / scores.length).toFixed(2);
      const ranks = scores.map((entry) => entry.value);

      // 동점자 처리: 같은 점수는 같은 순위, 다음 순위는 건너뜀
      await this.updateParticipantRanksWithTies(roomId, scores);

      // 브로드캐스트
      this.gameBroadcastService.broadcastRealtimeState(server, roomId, highestScore, parseFloat(averageScore), ranks);
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

      await this.gameRepository.updateParticipantRank(roomId, userId, currentRank);

      previousScore = score;
    }
  }
}
