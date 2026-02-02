/**
 * 로그 메시지 중앙 관리
 */

type LogLevel = 'log' | 'warn' | 'debug' | 'error';

interface LoggerLike {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

interface LogMessage {
  message: string;
  level: LogLevel;
}

export const LOG = {
  // WebSocket 연결 관련
  WS: {
    CONNECT: (socketId: string, userId?: string): LogMessage => ({
      message: `클라이언트 연결: socketId=${socketId}, userId=${userId ?? 'anonymous'}`,
      level: 'log',
    }),
    DISCONNECT: (socketId: string, userId?: string): LogMessage => ({
      message: `클라이언트 연결 해제: socketId=${socketId}, userId=${userId ?? 'anonymous'}`,
      level: 'log',
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
    VOICE_HANDLE_ERROR: (error: string, stack?: string): LogMessage => ({
      message: `Voice Gateway 처리 중 에러 발생: ${error}${stack ? `\n${stack}` : ''}`,
      level: 'error',
    }),
    CLEANUP_STALE_SESSION: (userId: string): LogMessage => ({
      message: `만료된 JWT로 인한 유령 세션 정리: userId=${userId}`,
      level: 'warn',
    }),
  },

  // AUTH 관련
  AUTH: {
    GITHUB_EMAIL_FETCH_FAILED: (userId: string, error: string): LogMessage => ({
      message: `GitHub 이메일 가져오기 실패: userId=${userId}, error=${error}`,
      level: 'error',
    }),
    TEMP_EMAIL_GENERATED: (userId: string, tempEmail: string): LogMessage => ({
      message: `GitHub 이메일 부재로 임시 이메일 생성: userId=${userId}, tempEmail=${tempEmail}`,
      level: 'warn',
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
    USER_BAN: (roomId: string, userId: string, targetNickname: string): LogMessage => ({
      message: `사용자 강제 퇴장: roomId=${roomId}, userId=${userId}, targetNickname=${targetNickname}`,
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
    USER_KICKED: (userId: string, roomId: string): LogMessage => ({
      message: `사용자 ${userId}가 방 ${roomId}에서 강제 퇴장당했습니다.`,
      level: 'log',
    }),
    HOST_CHANGED: (roomId: string, newHostId: string): LogMessage => ({
      message: `방장 변경: roomId=${roomId}, newHostId=${newHostId}`,
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
    ROOM_DELETE_ERROR: (roomId: string, error: string): LogMessage => ({
      message: `방 삭제 실패: roomId=${roomId}, error=${error}`,
      level: 'error',
    }),
    ROOM_DELETE_FORCE_ERROR: (roomId: string, error: string): LogMessage => ({
      message: `방 강제 삭제 실패: roomId=${roomId}, error=${error}`,
      level: 'error',
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
    CLEANUP_STALE_GLOBAL_MEMBERS: (roomId: string, count: number): LogMessage => ({
      message: `글로벌 방(${roomId}) 초기화 중 유령 멤버 데이터 ${count}개 정리.`,
      level: 'warn',
    }),
  },

  // 게임 관련
  GAME: {
    RECRUIT_STARTED: (roomId: string, userId: string): LogMessage => ({
      message: `게임 모집 시작: roomId=${roomId}, userId=${userId}`,
      level: 'log',
    }),
    JOIN_REQUEST: (roomId: string, userId: string): LogMessage => ({
      message: `게임 참가 요청: roomId=${roomId}, userId=${userId}`,
      level: 'debug',
    }),
    SELECT: (roomId: string, userId: string, gameId: string): LogMessage => ({
      message: `게임 선택: roomId=${roomId}, userId=${userId}, gameId=${gameId}`,
      level: 'log',
    }),
    READY: (roomId: string, userId: string): LogMessage => ({
      message: `게임 준비 완료: roomId=${roomId}, userId=${userId}`,
      level: 'log',
    }),
    UNREADY: (roomId: string, userId: string): LogMessage => ({
      message: `게임 준비 취소: roomId=${roomId}, userId=${userId}`,
      level: 'log',
    }),
    START: (roomId: string, userId: string, startTime: string): LogMessage => ({
      message: `게임 시작 카운트다운: roomId=${roomId}, userId=${userId}, startTime=${startTime}`,
      level: 'log',
    }),
    GAME_STATE_FETCH_ERROR: (roomId: string, error: string): LogMessage => ({
      message: `게임 상태 조회 실패: roomId=${roomId}, error=${error}`,
      level: 'error',
    }),
    LEAVE: (roomId: string, userId: string): LogMessage => ({
      message: `게임 참가 취소: roomId=${roomId}, userId=${userId}`,
      level: 'log',
    }),
    CLOSE: (roomId: string, userId: string): LogMessage => ({
      message: `게임 모집 닫기: roomId=${roomId}, userId=${userId}`,
      level: 'log',
    }),
    REALTIME_INPUT: (roomId: string, userId: string, delta: string): LogMessage => ({
      message: `게임 실시간 입력: roomId=${roomId}, userId=${userId}, delta=${delta}`,
      level: 'debug',
    }),
    REALTIME_INPUT_ERROR: (roomId: string, userId: string, error: string): LogMessage => ({
      message: `게임 실시간 입력 처리 실패: roomId=${roomId}, userId=${userId}, error=${error}`,
      level: 'error',
    }),
    REALTIME_BROADCAST: (roomId: string, highestScore: number, averageScore: string, ranks: string[]): LogMessage => ({
      message: `게임 실시간 상태 브로드캐스트: roomId=${roomId}, highest_score=${highestScore}, average_score=${averageScore}, ranks_count=${ranks.length}`,
      level: 'debug',
    }),
    REALTIME_BROADCAST_STOPPED: (roomId: string): LogMessage => ({
      message: `게임 실시간 브로드캐스트 중지: roomId=${roomId}`,
      level: 'log',
    }),
    RESULT_BROADCAST: (
      roomId: string,
      results: Array<{ player_id: string; score: number; rank: number }>,
    ): LogMessage => ({
      message: `게임 결과 브로드캐스트: roomId=${roomId}, participants=${results.length}`,
      level: 'log',
    }),
  },

  // 음성 관련
  VOICE: {
    CREATING_WORKER: {
      message: `mediasoup Worker 생성 중...`,
      level: 'log',
    },
    WORKER_CREATED: (pid: number): LogMessage => ({
      message: `Mediasoup Worker 생성: pid=${pid}`,
      level: 'log',
    }),
    WORKER_DIED: {
      message: `Mediasoup Worker가 예기치 않게 종료됨`,
      level: 'error',
    },
    ROUTER_CREATED: (routerId: string, roomId: string): LogMessage => ({
      message: `Mediasoup Router 생성: roomId=${roomId}, routerId=${routerId}`,
      level: 'log',
    }),
    ROUTER_CLOSED: (routerId: string, roomId: string): LogMessage => ({
      message: `Mediasoup Router 종료: roomId=${roomId}, routerId: ${routerId}`,
      level: 'log',
    }),
    TRANSPORT_CREATED: (transportId: string, roomId: string, producing: boolean): LogMessage => ({
      message: `WebRTC Transport 생성: transportId=${transportId}, roomId=${roomId}, producing=${producing}`,
      level: 'log',
    }),
    TRANSPORT_CREATE_ERROR: (roomId: string, producing: boolean, error: string): LogMessage => ({
      message: `WebRTC Transport 생성 실패: roomId=${roomId}, producing=${producing}, error=${error}`,
      level: 'error',
    }),
    TRANSPORT_SET_MAX_BITRATE_ERROR: (roomId: string, error: string): LogMessage => ({
      message: `Transport 최대 비트레이트 설정 실패: roomId=${roomId}, error=${error}`,
      level: 'warn',
    }),
    TRANSPORT_DTLS_FAILED: (transportId: string, dtlsState: string): LogMessage => ({
      message: `Transport DTLS 연결 실패: transportId=${transportId}, state=${dtlsState}`,
      level: 'warn',
    }),
    TRANSPORT_CONNECTED: (transportId: string): LogMessage => ({
      message: `WebRTC Transport 연결 성공: transportId=${transportId}`,
      level: 'log',
    }),
    TRANSPORT_ICE_CANDIDATE: (transportId: string, candidate: string): LogMessage => ({
      message: `ICE 후보 수신: transportId=${transportId}, candidate=${candidate}`,
      level: 'debug',
    }),
    TRANSPORT_CLOSED: (transportId: string): LogMessage => ({
      message: `WebRTC Transport 종료: transportId=${transportId}`,
      level: 'log',
    }),
    TRANSPORT_NOT_FOUND: (transportId: string): LogMessage => ({
      message: `WebRTC Transport를 찾을 수 없음: transportId=${transportId}`,
      level: 'warn',
    }),
    TRANSPORT_ROOM_MISMATCH: (transportId: string, actualRoomId: string, requestedRoomId: string): LogMessage => ({
      message: `Transport 방 불일치: transportId=${transportId}, 실제 방=${actualRoomId}, 요청 방=${requestedRoomId}`,
      level: 'warn',
    }),
    ROUTER_IN_REDIS_NOT_IN_MEMORY: (routerId: string, roomId: string): LogMessage => ({
      message: `Redis에는 있지만 메모리에 없는 Router 발견: routerId=${routerId}, roomId=${roomId}. 새 Router를 생성합니다.`,
      level: 'warn',
    }),
    TRANSPORT_IN_REDIS_NOT_IN_MEMORY: (transportId: string): LogMessage => ({
      message: `Redis에는 있지만 현재 서버 인스턴스의 메모리에 없는 Transport: transportId=${transportId}`,
      level: 'error',
    }),
    MEDIASOUP_CONFIG_ERROR: {
      message: `Mediasoup 환경 변수(RTC 포트, 리슨 IP, 공지 IP)가 완전히 구성되지 않았습니다.`,
      level: 'error',
    },
    TRANSPORT_NOT_FOUND_REDIS: (transportId: string): LogMessage => ({
      message: `Redis에서 ID "${transportId}"를 가진 Transport를 찾을 수 없습니다.`,
      level: 'warn',
    }),
    TRANSPORT_ROOM_FORBIDDEN: (transportId: string, roomId: string): LogMessage => ({
      message: `ID "${transportId}"를 가진 Transport는 방 "${roomId}"에 속하지 않습니다.`,
      level: 'warn',
    }),
    REDIS_CLEANUP_ERROR: (objectId: string, error: string): LogMessage => ({
      message: `Redis에서 객체 ${objectId} 정리 실패: ${error}`,
      level: 'error',
    }),
    TRANSPORT_NOT_FOR_PRODUCING: (transportId: string): LogMessage => ({
      message: `Transport ${transportId}는 producing용으로 생성되지 않았습니다.`,
      level: 'warn',
    }),
    PRODUCER_CREATED: (producerId: string, transportId: string, userId: string): LogMessage => ({
      message: `Producer 생성: producerId=${producerId}, transportId=${transportId}, userId=${userId}`,
      level: 'log',
    }),
    PRODUCER_NOT_FOUND: (producerId: string): LogMessage => ({
      message: `메모리에서 Producer를 찾을 수 없음: producerId=${producerId}`,
      level: 'warn',
    }),
    PRODUCER_OWNERSHIP_MISMATCH: (producerId: string, actualUserId: string, requestedUserId: string): LogMessage => ({
      message: `Producer 소유권 불일치: producerId=${producerId}, 실제 소유자=${actualUserId}, 요청자=${requestedUserId}`,
      level: 'warn',
    }),
    PRODUCER_PAUSED: (producerId: string, userId: string): LogMessage => ({
      message: `Producer 일시 중지: producerId=${producerId}, userId=${userId}`,
      level: 'log',
    }),
    PRODUCER_RESUMED: (producerId: string, userId: string): LogMessage => ({
      message: `Producer 재개: producerId=${producerId}, userId=${userId}`,
      level: 'log',
    }),
    PRODUCER_CLOSED: (producerId: string, userId: string): LogMessage => ({
      message: `Producer 종료: producerId=${producerId}, userId=${userId}`,
      level: 'log',
    }),
    PRODUCERS_FOR_ROOM_FETCHED: (roomId: string, count: number): LogMessage => ({
      message: `방의 Producer 목록 조회: roomId=${roomId}, count=${count}`,
      level: 'log',
    }),
    CONSUMER_NOT_FOUND: (consumerId: string): LogMessage => ({
      message: `메모리에서 Consumer를 찾을 수 없음: consumerId=${consumerId}`,
      level: 'warn',
    }),
    CONSUMER_OWNERSHIP_MISMATCH: (consumerId: string, actualUserId: string, requestedUserId: string): LogMessage => ({
      message: `Consumer 소유권 불일치: consumerId=${consumerId}, 실제 소유자=${actualUserId}, 요청자=${requestedUserId}`,
      level: 'warn',
    }),
    CONSUMER_PAUSED: (consumerId: string, userId: string): LogMessage => ({
      message: `Consumer 일시 중지: consumerId=${consumerId}, userId=${userId}`,
      level: 'log',
    }),
    CONSUMER_RESUMED: (consumerId: string, userId: string): LogMessage => ({
      message: `Consumer 재개: consumerId=${consumerId}, userId=${userId}`,
      level: 'log',
    }),
    PRODUCER_NOT_FOUND_REDIS: (producerId: string): LogMessage => ({
      message: `Redis에서 ID "${producerId}"를 가진 Producer를 찾을 수 없습니다.`,
      level: 'warn',
    }),
    CONSUMER_TRANSPORT_NOT_FOR_CONSUMING: (transportId: string): LogMessage => ({
      message: `Transport ${transportId}는 consuming용으로 생성되지 않았습니다.`,
      level: 'warn',
    }),
    PRODUCER_TRANSPORT_ROOM_MISMATCH: (
      producerId: string,
      transportId: string,
      producerRoomId: string,
      transportRoomId: string,
    ): LogMessage => ({
      message: `Producer ${producerId}(${producerRoomId})와 Transport ${transportId}(${transportRoomId})가 서로 다른 방에 속해있습니다.`,
      level: 'warn',
    }),
    PRODUCER_PAUSED_CANNOT_CONSUME: (producerId: string): LogMessage => ({
      message: `Producer ${producerId}가 일시 중지 상태이므로 소비할 수 없습니다.`,
      level: 'warn',
    }),
    ROUTER_CANNOT_CONSUME: (producerId: string, transportId: string): LogMessage => ({
      message: `Router가 이 Producer를 소비할 수 없음: producerId=${producerId}, transportId=${transportId}`,
      level: 'error',
    }),
    CONSUMER_CREATED: (consumerId: string, producerId: string, userId: string): LogMessage => ({
      message: `Consumer 생성: consumerId=${consumerId}, producerId=${producerId}, userId=${userId}`,
      level: 'log',
    }),
    TRANSPORT_OWNERSHIP_MISMATCH: (transportId: string, actualUserId: string, requestedUserId: string): LogMessage => ({
      message: `Transport ${transportId}는 사용자 ${requestedUserId}의 소유가 아닙니다. 실제 소유자: ${actualUserId}`,
      level: 'warn',
    }),
    MEDIASOUP_OBJECT_NOT_IN_MEMORY: {
      message: `Mediasoup 객체가 Redis에는 존재하지만 현재 서버 메모리에는 없습니다. 서버 상태를 확인하세요.`,
      level: 'error',
    },
    CONSUMER_CLOSED: (consumerId: string, userId: string): LogMessage => ({
      message: `Consumer 종료: consumerId=${consumerId}, userId=${userId}`,
      level: 'log',
    }),
    VOICE_LEAVE_ROOM: (userId: string, roomId: string): LogMessage => ({
      message: `음성 채팅방 퇴장 및 리소스 정리 시작: userId=${userId}, roomId=${roomId}`,
      level: 'log',
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
