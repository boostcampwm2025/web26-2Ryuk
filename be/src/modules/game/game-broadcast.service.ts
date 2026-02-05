import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { WS_EVENTS_GAME } from '@src/common/constants/ws-events.constant';
import {
  GameSelectBroadcastDto,
  GameReadyBroadcastDto,
  GameStartBroadcastDto,
  GameCloseBroadcastDto,
  GameRealtimeBroadcastDto,
  GameResultBroadcastDto,
  GameParticipantDto,
} from './dto/game-response.dto';
import { LOG, logMessage } from '@src/common/utils/log-messages';

@Injectable()
export class GameBroadcastService {
  private readonly logger = new Logger(GameBroadcastService.name);

  /**
   * 게임 모집 시작 브로드캐스트
   */
  broadcastGameRecruit(server: Server, roomId: string): void {
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_RECRUIT, {
      is_game_recruiting: true,
    });
  }

  /**
   * 게임 참가 브로드캐스트
   */
  broadcastGameJoin(
    server: Server,
    roomId: string,
    userId: string,
    currentPlayers: number,
    participants: GameParticipantDto[],
  ): void {
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
   * 게임 선택 브로드캐스트
   */
  broadcastGameSelect(server: Server, roomId: string, game: GameSelectBroadcastDto['game']): void {
    const roomBroadcast: GameSelectBroadcastDto = { game };
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_SELECT, roomBroadcast);
  }

  /**
   * 게임 준비 완료/해제 브로드캐스트
   */
  broadcastGameReady(server: Server, roomId: string, playerId: string, isReady: boolean): void {
    const readyBroadcast: GameReadyBroadcastDto = {
      player_id: playerId,
      is_ready: isReady,
    };
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_READY, readyBroadcast);
  }

  /**
   * 게임 준비 해제 브로드캐스트
   */
  broadcastGameUnready(server: Server, roomId: string, playerId: string): void {
    const unreadyBroadcast: GameReadyBroadcastDto = {
      player_id: playerId,
      is_ready: false,
    };
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_UNREADY, unreadyBroadcast);
  }

  /**
   * 게임 시작 브로드캐스트
   */
  broadcastGameStart(server: Server, roomId: string, broadcast: GameStartBroadcastDto): void {
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_START, broadcast);
  }

  /**
   * 게임 닫기 브로드캐스트
   */
  broadcastGameClose(server: Server, roomId: string, isGameRecruiting: boolean): void {
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_CLOSE, new GameCloseBroadcastDto(isGameRecruiting));
  }

  /**
   * 게임 나가기 브로드캐스트
   */
  broadcastGameLeave(server: Server, roomId: string, playerId: string, currentPlayers: number): void {
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_LEAVE, {
      player_id: playerId,
      current_players: currentPlayers,
    });
  }

  /**
   * 실시간 게임 상태 브로드캐스트
   */
  broadcastRealtimeState(
    server: Server,
    roomId: string,
    highestScore: number,
    averageScore: number,
    ranks: string[],
  ): void {
    const broadcast: GameRealtimeBroadcastDto = {
      highest_score: highestScore,
      average_score: averageScore,
      ranks,
    };

    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_REALTIME, broadcast);

    logMessage(this.logger, LOG.GAME.REALTIME_BROADCAST(roomId, highestScore, averageScore.toString(), ranks));
  }

  /**
   * 게임 결과 브로드캐스트
   */
  broadcastGameResult(server: Server, roomId: string, broadcast: GameResultBroadcastDto): void {
    server.to(roomId).emit(WS_EVENTS_GAME.PLAYER_RESULT, broadcast);
  }
}
