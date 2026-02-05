/**
 * WebSocket 이벤트 이름 상수
 */
export const WS_EVENTS = {
  // Socket.io 기본 이벤트
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // 방 관련 이벤트
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_BAN: 'room:ban',
  ROOM_PARTICIPANT_LEAVE: 'room:participant:leave',
  ROOM_PARTICIPANT_JOIN: 'room:participant:join',
  ROOM_PARTICIPANT_UPDATE: 'room:participant:update',
  ROOM_PARTICIPANT_DELETE: 'room:participant:delete',

  // 방 채팅 이벤트
  CHAT_ROOM_SEND: 'chat:room:send',
  CHAT_ROOM_NEW_MESSAGE: 'chat:room:new-message',

  // 글로벌 채팅 이벤트
  CHAT_GLOBAL_SEND: 'chat:global:send',
  CHAT_GLOBAL_NEW_MESSAGE: 'chat:global:new-message',
  CHAT_GLOBAL_PARTICIPANTS_UPDATED: 'chat:global:participants-updated',
  CHAT_GLOBAL_INIT: 'chat:global:init',

  // 인증 이벤트
  AUTH_LOGOUT: 'auth:logout',

  // 게임 모집 이벤트
  GAME_RECRUIT: 'game:recruit',
  GAME_PLAYER_RECRUIT: 'game:player:recruit',
  GAME_JOIN: 'game:join',
  GAME_PLAYER_JOIN: 'game:player:join',
  GAME_LEAVE: 'game:leave',
  GAME_PLAYER_LEAVE: 'game:player:leave',
  GAME_SELECT: 'game:select',
  GAME_PLAYER_SELECT: 'game:player:select',
  GAME_READY: 'game:ready',
  GAME_PLAYER_READY: 'game:player:ready',
  GAME_UNREADY: 'game:unready',
  GAME_PLAYER_UNREADY: 'game:player:unready',
  GAME_START: 'game:start',
  GAME_PLAYER_START: 'game:player:start',
  GAME_CLOSE: 'game:close',
  GAME_PLAYER_CLOSE: 'game:player:close',
  GAME_REALTIME: 'game:realtime',
  GAME_PLAYER_REALTIME: 'game:player:realtime',
  GAME_RESULT: 'game:result',
  GAME_PLAYER_RESULT: 'game:player:result',

  // Voice (MediaSoup / WebRTC)
  VOICE_ROUTER_CAPABILITIES: 'voice:router:capabilities',
  VOICE_TRANSPORT_CREATE: 'voice:transport:create',
  VOICE_TRANSPORT_CONNECT: 'voice:transport:connect',
  VOICE_TRANSPORT_CLOSE: 'voice:transport:close',

  VOICE_PRODUCER_CREATE: 'voice:producer:create',
  VOICE_PRODUCER_CLOSE: 'voice:producer:close',
  VOICE_PRODUCER_PAUSE: 'voice:producer:pause',
  VOICE_PRODUCER_RESUME: 'voice:producer:resume',
  VOICE_PRODUCER_NEW: 'voice:producer:new',
  VOICE_PRODUCER_UPDATE: 'voice:producer:update',
  VOICE_PRODUCER_CLOSED: 'voice:producer:closed',

  VOICE_CONSUMER_CREATE: 'voice:consumer:create',
  VOICE_CONSUMER_PAUSE: 'voice:consumer:pause',
  VOICE_CONSUMER_RESUME: 'voice:consumer:resume',
  VOICE_CONSUMER_CLOSE: 'voice:consumer:close',

  VOICE_ROOM_PRODUCERS: 'voice:room:producers',
  VOICE_ROOM_LEAVE: 'voice:room:leave',
} as const;
