import { Injectable, Logger } from '@nestjs/common';
import { LOG, logMessage } from '@src/common/utils/log-messages';

@Injectable()
export class GameTimerService {
  private readonly logger = new Logger(GameTimerService.name);
  private readonly REALTIME_BROADCAST_INTERVAL_MS = 300; // 300ms 주기로 상태 브로드캐스트
  private realtimeBroadcastTimers: Map<string, NodeJS.Timeout> = new Map(); // 방별 브로드캐스트 타이머
  private readonly gameEndTimers: Map<string, NodeJS.Timeout> = new Map(); // 방별 게임 종료 타이머

  /**
   * 300ms 주기의 브로드캐스트 스케줄링
   * - 중복 스케줄링 방지
   * - 한 번 스케줄되면 주기마다 자동으로 상태 브로드캐스트
   */
  scheduleRealtimeBroadcast(roomId: string, broadcastCallback: () => Promise<void>): void {
    const timerKey = `realtime:${roomId}`;

    // 이미 스케줄된 경우 추가 스케줄링 하지 않음
    if (this.realtimeBroadcastTimers.has(timerKey)) {
      return;
    }

    // 처음 스케줄링 시 타이머 설정
    const handleRealtimeBroadcast = async () => {
      try {
        await broadcastCallback();
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
   * - duration 후 endGameCallback 호출
   * - 방별로 하나의 타이머만 유지
   */
  scheduleGameEnd(roomId: string, gameId: string, durationMs: number, endGameCallback: () => Promise<void>): void {
    const timerKey = `end:${roomId}`;

    // 이미 종료 타이머가 설정되어 있다면 중복 설정 방지
    if (this.gameEndTimers.has(timerKey)) {
      return;
    }

    const handleGameEnd = async () => {
      try {
        await endGameCallback();
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
   * 실시간 브로드캐스트 타이머 중지
   */
  stopRealtimeBroadcast(roomId: string): void {
    const timerKey = `realtime:${roomId}`;
    const timer = this.realtimeBroadcastTimers.get(timerKey);

    if (timer) {
      clearInterval(timer);
      this.realtimeBroadcastTimers.delete(timerKey);
      logMessage(this.logger, LOG.GAME.REALTIME_BROADCAST_STOPPED(roomId));
    }
  }

  /**
   * 게임 종료 타이머 취소
   */
  cancelGameEndTimer(roomId: string): void {
    const timerKey = `end:${roomId}`;
    const timer = this.gameEndTimers.get(timerKey);

    if (timer) {
      clearTimeout(timer);
      this.gameEndTimers.delete(timerKey);
    }
  }
}
