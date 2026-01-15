/**
 * 로그 메시지 중앙 관리
 */

type LogLevel = 'log' | 'warn' | 'debug' | 'error';

interface LoggerLike {
  log: Function;
  warn: Function;
  debug: Function;
  error: Function;
}

interface LogMessage {
  message: string;
  level: LogLevel;
}

export const LOG = {
  // WebSocket 연결 관련
  WS: {
    CONNECT: (socketId: string, userId?: string): LogMessage => ({
      message: `클라이언트 연결: socketId=${socketId}, userId=${userId || 'anonymous'}`,
      level: 'log',
    }),
    DISCONNECT: (socketId: string, userId?: string): LogMessage => ({
      message: `클라이언트 연결 해제: socketId=${socketId}, userId=${userId || 'anonymous'}`,
      level: 'log',
    }),
    ROOM_JOIN_DTO_RECEIVED: (dto: string, type: string): LogMessage => ({
      message: `room:join 받은 DTO: ${dto}, 타입: ${type}`,
      level: 'debug',
    }),
    SOCKET_IO_JOIN_AUTH: (userId: string, roomId: string): LogMessage => ({
      message: `인증 사용자 Socket.io room 참여: userId=${userId}, roomId=${roomId}`,
      level: 'log',
    }),
    SOCKET_IO_JOIN_UNAUTH: (socketId: string, roomId: string): LogMessage => ({
      message: `비인증 사용자 Socket.io room 참여: socketId=${socketId}, roomId=${roomId}`,
      level: 'log',
    }),
    SOCKET_IO_JOIN_ERROR: (error: string): LogMessage => ({
      message: `Socket.io room 참여 실패: ${error}`,
      level: 'error',
    }),
    REDIS_JOIN: (userId: string, roomId: string): LogMessage => ({
      message: `Redis 방 참여: userId=${userId}, roomId=${roomId}`,
      level: 'log',
    }),
    REDIS_JOIN_ERROR: (error: string): LogMessage => ({
      message: `방 참여 실패: ${error}`,
      level: 'error',
    }),
    AUTH_CONNECT: (userId: string): LogMessage => ({
      message: `인증 사용자 연결 완료: userId=${userId}`,
      level: 'log',
    }),
    UNAUTH_CONNECT: (socketId: string): LogMessage => ({
      message: `비인증 사용자 연결 완료: socketId=${socketId}`,
      level: 'log',
    }),
    ROOM_PARTICIPATION_CHECK_ERROR: (error: string): LogMessage => ({
      message: `방 참여 확인 실패: ${error}`,
      level: 'error',
    }),
    CONNECTION_HANDLE_ERROR: (error: string, stack?: string): LogMessage => ({
      message: `연결 처리 중 예상치 못한 에러: ${error}${stack ? `\n${stack}` : ''}`,
      level: 'error',
    }),
    GLOBAL_ROOM_LEAVE_ERROR: (error: string): LogMessage => ({
      message: `글로벌 방 퇴장 처리 실패: ${error}`,
      level: 'error',
    }),
    GLOBAL_CHAT_HANDLE_ERROR: (error: string): LogMessage => ({
      message: `글로벌 채팅 처리 중 에러 발생: ${error}`,
      level: 'error',
    }),
    ROOM_CHAT_HANDLE_ERROR: (error: string): LogMessage => ({
      message: `방 채팅 처리 중 에러 발생: ${error}`,
      level: 'error',
    }),
    ROOM_JOIN_HANDLE_ERROR: (error: string, stack?: string): LogMessage => ({
      message: `방 입장 처리 중 에러 발생: ${error}${stack ? `\n${stack}` : ''}`,
      level: 'error',
    }),
    ROOM_LEAVE_HANDLE_ERROR: (error: string, stack?: string): LogMessage => ({
      message: `방 퇴장 처리 중 에러 발생: ${error}${stack ? `\n${stack}` : ''}`,
      level: 'error',
    }),
    LOGOUT: (userId: string): LogMessage => ({
      message: `사용자 로그아웃: userId=${userId} (WebSocket 연결 유지, 참여자 수에서 제외)`,
      level: 'log',
    }),
    LOGOUT_ERROR: (error: string): LogMessage => ({
      message: `로그아웃 처리 중 에러 발생: ${error}`,
      level: 'error',
    }),
  },

  // 채팅 관련
  CHAT: {
    GLOBAL_BROADCAST: (userId: string, message: string): LogMessage => ({
      message: `글로벌 메시지 브로드캐스트: userId=${userId}, message=${message}`,
      level: 'log',
    }),
    ROOM_BROADCAST: (roomId: string, userId: string, message: string): LogMessage => ({
      message: `방 메시지 브로드캐스트: roomId=${roomId}, userId=${userId}, message=${message}`,
      level: 'log',
    }),
    USER_JOINED: (roomId: string, userId: string): LogMessage => ({
      message: `사용자 참여 알림: roomId=${roomId}, userId=${userId}`,
      level: 'log',
    }),
    USER_LEFT: (roomId: string, userId: string): LogMessage => ({
      message: `사용자 퇴장 알림: roomId=${roomId}, userId=${userId}`,
      level: 'log',
    }),
    UNAUTH_SEND: (socketId: string): LogMessage => ({
      message: `인증되지 않은 사용자의 메시지 송신 시도: socketId=${socketId}`,
      level: 'warn',
    }),
    UNAUTH_ROOM_SEND: (socketId: string): LogMessage => ({
      message: `인증되지 않은 사용자의 방 메시지 송신 시도: socketId=${socketId}`,
      level: 'warn',
    }),
    NOT_MEMBER_SEND: (userId: string, roomId: string): LogMessage => ({
      message: `방 참여자가 아닌 사용자의 메시지 송신 시도: userId=${userId}, roomId=${roomId}`,
      level: 'warn',
    }),
    PARTICIPANTS_UPDATED: (roomId: string, currentParticipants: number): LogMessage => ({
      message: `글로벌 채팅 참여자 수 업데이트: roomId=${roomId}, 참여자 수: ${currentParticipants}`,
      level: 'log',
    }),
    BROADCAST_CLIENTS_COUNT: (roomId: string, eventType: string, clientsCount: number): LogMessage => ({
      message: `[${eventType}] roomId=${roomId}에 참여한 클라이언트 수: ${clientsCount}`,
      level: 'debug',
    }),
    BROADCAST_SENT: (roomId: string, eventType: string, userId: string, clientsCount: number): LogMessage => ({
      message: `[${eventType}] 브로드캐스트 전송 완료: roomId=${roomId}, userId=${userId}, room 참여 클라이언트 수: ${clientsCount}`,
      level: 'debug',
    }),
  },

  // 방 관련
  ROOM: {
    JOIN: (userId: string, roomId: string): LogMessage => ({
      message: `물리적 입장 - 사용자 방 입장: userId=${userId}, roomId=${roomId}`,
      level: 'log',
    }),
    LEAVE: (userId: string, roomId: string): LogMessage => ({
      message: `사용자 방 퇴장: userId=${userId}, roomId=${roomId}`,
      level: 'log',
    }),
    JOIN_SWITCH: (userId: string, oldRoomId: string, newRoomId: string): LogMessage => ({
      message: `기존 로컬 방 퇴장 후 새 방 입장: userId=${userId}, 기존방=${oldRoomId}, 새방=${newRoomId}`,
      level: 'log',
    }),
    UNAUTH_JOIN: (socketId: string): LogMessage => ({
      message: `인증되지 않은 사용자의 방 입장 시도: socketId=${socketId}`,
      level: 'warn',
    }),
    UNAUTH_LEAVE: (socketId: string): LogMessage => ({
      message: `인증되지 않은 사용자의 방 퇴장 시도: socketId=${socketId}`,
      level: 'warn',
    }),
    NO_PERMISSION: (userId: string, roomId: string): LogMessage => ({
      message: `방 입장 권한 없음: userId=${userId}, roomId=${roomId}`,
      level: 'warn',
    }),
    ALREADY_IN: (userId: string, roomId: string): LogMessage => ({
      message: `이미 참여 중인 방: userId=${userId}, roomId=${roomId}`,
      level: 'debug',
    }),
    NOT_IN: (userId: string, roomId: string): LogMessage => ({
      message: `참여하지 않은 방: userId=${userId}, roomId=${roomId}`,
      level: 'debug',
    }),
    USER_JOINED: (userId: string, roomId: string): LogMessage => ({
      message: `논리적 입장 - 사용자 ${userId}가 방 ${roomId}에 참여했습니다.`,
      level: 'log',
    }),
    USER_LEFT: (userId: string, roomId: string): LogMessage => ({
      message: `사용자 ${userId}가 방 ${roomId}에서 퇴장했습니다.`,
      level: 'log',
    }),
    PERMISSION_CHECK: (userId: string, roomId: string): LogMessage => ({
      message: `권한 검증: userId=${userId}, roomId=${roomId}`,
      level: 'debug',
    }),
    INITIALIZED: {
      message: `RoomService가 Redis 클라이언트와 함께 초기화되었습니다.`,
      level: 'log',
    },
    ERROR_INITIALIZING_GLOBAL_ROOM: (error: string): LogMessage => ({
      message: `글로벌 방 초기화 중 오류 발생: ${error}`,
      level: 'error',
    }),
    GLOBAL_ROOM_INITIALIZED: (roomId: string): LogMessage => ({
      message: `글로벌 방 초기화 완료: ${roomId}`,
      level: 'log',
    }),
    ROOM_TYPE_FETCH_ERROR: (roomId: string, error: string): LogMessage => ({
      message: `방 타입 조회 실패 (roomId: ${roomId}): ${error}`,
      level: 'error',
    }),
    ROOM_CREATED: (roomId: string, type: string): LogMessage => ({
      message: `방 생성 완료: roomId=${roomId}, type=${type}`,
      level: 'log',
    }),
    ROOM_UPDATED: (roomId: string): LogMessage => ({
      message: `방 정보 업데이트 완료: roomId=${roomId}`,
      level: 'log',
    }),
    ROOM_DELETED: (roomId: string, hostId: string): LogMessage => ({
      message: `방 삭제 완료: roomId=${roomId}, hostId=${hostId}`,
      level: 'log',
    }),
    PARTICIPANTS_UPDATE_ERROR: (roomId: string, error: string): LogMessage => ({
      message: `참여자 업데이트 실패 (roomId: ${roomId}): ${error}`,
      level: 'error',
    }),
    PARTICIPANTS_FETCH_ERROR: (roomId: string, error: string): LogMessage => ({
      message: `참여자 수 조회 실패 (roomId: ${roomId}): ${error}`,
      level: 'error',
    }),
    LOCAL_ROOMS_FETCH_ERROR: (error: string): LogMessage => ({
      message: `로컬 방 목록 조회 실패: ${error}`,
      level: 'error',
    }),
    LOCAL_ROOMS_SEARCH_ERROR: (error: string): LogMessage => ({
      message: `로컬 방 검색 실패: ${error}`,
      level: 'error',
    }),
    VALIDATION_START: (userId: string, roomId: string): LogMessage => ({
      message: `방 입장 검증 시작: userId=${userId}, roomId=${roomId}`,
      level: 'debug',
    }),
    VALIDATION_SUCCESS: (userId: string, roomId: string): LogMessage => ({
      message: `방 입장 검증 성공: userId=${userId}, roomId=${roomId}`,
      level: 'log',
    }),
    VALIDATION_ERROR: (userId: string, roomId: string, error: string): LogMessage => ({
      message: `방 입장 검증 실패: userId=${userId}, roomId=${roomId}, error=${error}`,
      level: 'warn',
    }),
    INTERNAL_VALIDATION_ERROR: (userId: string, roomId: string, error: string): LogMessage => ({
      message: `방 입장 검증 중 내부 서버 오류 발생: userId=${userId}, roomId=${roomId}, error=${error}`,
      level: 'error',
    }),
    UNAUTH_API_ACCESS_JOIN: (roomId: string): LogMessage => ({
      message: `인증되지 않은 사용자의 방 입장 검증 시도: roomId=${roomId}`,
      level: 'warn',
    }),
    INVALID_TOKEN_API_JOIN: (roomId: string): LogMessage => ({
      message: `유효하지 않은 토큰으로 방 입장 검증 시도: roomId=${roomId}`,
      level: 'warn',
    }),
    ROOM_MEMBERS_FETCH_ERROR: (roomId: string, error: string): LogMessage => ({
      message: `방 멤버 정보 조회 실패 (roomId: ${roomId}): ${error}`,
      level: 'error',
    }),
    ROOM_CREATE_ALREADY_IN_ROOM: (userId: string, roomId: string): LogMessage => ({
      message: `방 생성 실패 - 이미 참여 중인 방이 있음: userId=${userId}, roomId=${roomId}`,
      level: 'warn',
    }),
  },
} as const;

/**
 * Logger 헬퍼 함수
 * 로그 레벨에 따른 메서드 호출
 */
export function logMessage(logger: LoggerLike, logMsg: LogMessage): void {
  const { message, level } = logMsg;

  // prettier-ignore
  switch (level) {
    case 'log': return logger.log(message);
    case 'warn': return logger.warn(message);
    case 'debug': return logger.debug(message);
    case 'error': return logger.error(message);
  }
}
