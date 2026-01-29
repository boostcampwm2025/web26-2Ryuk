/**
 * 인증 관련 이벤트
 */
export const WS_EVENTS_AUTH = {
  LOGOUT: 'auth:logout',
} as const;

/**
 * 채팅 관련 이벤트
 */
export const WS_EVENTS_CHAT = {
  // 수신 이벤트
  GLOBAL_JOIN: 'chat:global:join',
  GLOBAL_SEND: 'chat:global:send',
  ROOM_SEND: 'chat:room:send',

  // 송신 이벤트
  GLOBAL_RECENTS: 'chat:global:recents',
  GLOBAL_PARTICIPANTS_UPDATED: 'chat:global:participants-updated',
  GLOBAL_NEW_MESSAGE: 'chat:global:new-message',
  ROOM_NEW_MESSAGE: 'chat:room:new-message',
} as const;

/**
 * 방(Room) 관련 이벤트
 */
export const WS_EVENTS_ROOM = {
  // 수신 이벤트
  JOIN: 'room:join',
  LEAVE: 'room:leave',
  BAN: 'room:ban',

  // 송신 이벤트
  PARTICIPANT_JOIN: 'room:participant:join',
  PARTICIPANT_LEAVE: 'room:participant:leave',
  PARTICIPANT_DELETE: 'room:participant:delete',
} as const;

/**
 * 게임 관련 이벤트
 */
export const WS_EVENTS_GAME = {
  // 수신 이벤트
  RECRUIT: 'game:recruit',
  JOIN: 'game:join',
  SELECT: 'game:select',
  READY: 'game:ready',
  UNREADY: 'game:unready',
  START: 'game:start',
  CLOSE: 'game:close',
  LEAVE: 'game:leave',
  REALTIME: 'game:realtime',

  // 송신 이벤트
  PLAYER_RECRUIT: 'game:player:recruit',
  PLAYER_SELECT: 'game:player:select',
  PLAYER_JOIN: 'game:player:join',
  PLAYER_READY: 'game:player:ready',
  PLAYER_UNREADY: 'game:player:unready',
  PLAYER_START: 'game:player:start',
  PLAYER_CLOSE: 'game:player:close',
  PLAYER_LEAVE: 'game:player:leave',
  PLAYER_REALTIME: 'game:player:realtime',
  PLAYER_RESULT: 'game:player:result',
} as const;

/**
 * 에러 이벤트
 */
export const WS_EVENTS_ERROR = {
  ERROR: 'error',
} as const;
