import { test } from '../helpers/fixtures';
import { io, Socket } from 'socket.io-client';
import * as fs from 'fs';
import * as path from 'path';

// ─── 설정 ────────────────────────────────────────────────────
const API_BASE = 'http://localhost:4000/api';
const WS_URL = 'http://localhost:4000';

const PLAYER_COUNT = 10;
const INPUTS_PER_SEC = 30;
const TEST_DURATION_SEC = 30;
const THROTTLE_INTERVAL_MS = 100;
const BEAKER_GAME_ID = '550e8400-e29b-41d4-a716-446655440001';
const GAME_START_DELAY_SEC = 5;

type RealtimeMode = 'no-throttle' | 'throttle-100ms';

function testerId(index: number): string {
  return `aaaaaaaa-bbbb-cccc-dddd-${String(index).padStart(12, '0')}`;
}

// ─── 이벤트 상수 ──────────────────────────────────────────────
const EV = {
  ROOM_JOIN: 'room:join',
  GAME_RECRUIT: 'game:recruit',
  GAME_JOIN: 'game:join',
  GAME_READY: 'game:ready',
  GAME_SELECT: 'game:select',
  GAME_START: 'game:start',
  GAME_REALTIME: 'game:realtime',
  PLAYER_START: 'game:player:start',
  PLAYER_REALTIME: 'game:player:realtime',
  ERROR: 'error',
} as const;

// ─── 유틸리티 ──────────────────────────────────────────────
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emitWithAck(socket: Socket, event: string, data: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`ACK timeout: ${event}`)), 10000);
    socket.emit(event, JSON.stringify(data), (response: unknown) => {
      clearTimeout(timeout);
      resolve(response);
    });
  });
}

// ─── 계측 ──────────────────────────────────────────────────
interface Metrics {
  emitCount: number;
  receiveCount: number;
  perSecEmit: number[];
  perSecReceive: number[];
}

function createMetrics(): Metrics {
  return { emitCount: 0, receiveCount: 0, perSecEmit: [], perSecReceive: [] };
}

function startSampling(m: Metrics): NodeJS.Timeout {
  return setInterval(() => {
    m.perSecEmit.push(m.emitCount);
    m.perSecReceive.push(m.receiveCount);
    const sec = m.perSecEmit.length;
    console.log(`  [${sec}s] emit=${m.emitCount}/s recv=${m.receiveCount}/s`);
    m.emitCount = 0;
    m.receiveCount = 0;
  }, 1000);
}

function saveResults(m: Metrics, label: string): string {
  const outDir = path.resolve(process.cwd(), 'e2e', 'metrics-output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const prefix = `${label}-${ts}`;
  const len = m.perSecEmit.length || 1;
  const totalEmit = m.perSecEmit.reduce((a, b) => a + b, 0);
  const totalRecv = m.perSecReceive.reduce((a, b) => a + b, 0);

  // CSV
  const csv = [
    'second,emit_per_sec,receive_per_sec',
    ...m.perSecEmit.map((e, i) => `${i + 1},${e},${m.perSecReceive[i] ?? 0}`),
  ].join('\n');
  fs.writeFileSync(path.join(outDir, `${prefix}.csv`), csv);

  // JSON
  const json = {
    label,
    config: { PLAYER_COUNT, INPUTS_PER_SEC, TEST_DURATION_SEC },
    summary: {
      totalEmit,
      totalReceive: totalRecv,
      avgEmitPerSec: +(totalEmit / len).toFixed(1),
      avgReceivePerSec: +(totalRecv / len).toFixed(1),
      estimatedServerInboundPerSec: +(totalEmit / len).toFixed(1),
      estimatedBroadcastPerSec: +(totalRecv / len / PLAYER_COUNT).toFixed(1),
    },
    samples: m.perSecEmit.map((e, i) => ({
      second: i + 1,
      emitPerSec: e,
      receivePerSec: m.perSecReceive[i] ?? 0,
    })),
  };
  fs.writeFileSync(path.join(outDir, `${prefix}.json`), JSON.stringify(json, null, 2));

  return path.join(outDir, prefix);
}

function printSummary(m: Metrics, label: string): void {
  const len = m.perSecEmit.length || 1;
  const totalEmit = m.perSecEmit.reduce((a, b) => a + b, 0);
  const totalRecv = m.perSecReceive.reduce((a, b) => a + b, 0);

  console.log(`\n=== ${label} RESULT ===`);
  console.log(`  Client emit avg/sec:            ${(totalEmit / len).toFixed(1)}`);
  console.log(`  Client receive avg/sec:          ${(totalRecv / len).toFixed(1)}`);
  console.log(`  Estimated server inbound avg/sec:${(totalEmit / len).toFixed(1)}`);
  console.log(`  Estimated broadcast/sec:         ${(totalRecv / len / PLAYER_COUNT).toFixed(1)}`);
  console.log(`  Total emits:                     ${totalEmit}`);
  console.log(`  Total receives:                  ${totalRecv}`);
  console.log('========================\n');
}

// ─── 소켓 헬퍼 ───────────────────────────────────────────────
async function mockLogin(userId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/mock/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`mock/login failed for ${userId}: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function connectSocket(token: string): Socket {
  return io(WS_URL, { auth: { token }, transports: ['websocket'], forceNew: true });
}

async function waitConnected(socket: Socket): Promise<void> {
  if (socket.connected) return;
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', (err) => reject(err));
  });
}

// ─── 게임 플로우 실행 ─────────────────────────────────────────
async function runGameFlow(
  sockets: Socket[],
  tokens: string[],
  m: Metrics,
  mode: RealtimeMode,
): Promise<void> {
  // 방 생성 (HTTP)
  const roomRes = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens[0]}` },
    body: JSON.stringify({
      title: `Load Test ${Date.now()}`,
      tags: ['load-test'],
      max_participants: PLAYER_COUNT + 1,
      is_mic_available: false,
      is_private: false,
    }),
  });
  if (!roomRes.ok) throw new Error(`Room creation failed: ${roomRes.status}`);
  const roomData = (await roomRes.json()) as { data: { id: string } };
  const roomId = roomData.data.id;
  console.log(`  Room: ${roomId}`);

  // 방 입장
  for (const socket of sockets) {
    await emitWithAck(socket, EV.ROOM_JOIN, { room_id: roomId });
    await delay(100);
  }

  // 게임 모집
  await emitWithAck(sockets[0], EV.GAME_RECRUIT, { room_id: roomId });
  await delay(500);

  // 게임 참가
  for (const socket of sockets) {
    await emitWithAck(socket, EV.GAME_JOIN, { room_id: roomId });
    await delay(100);
  }
  await delay(300);

  // 게임 선택
  sockets[0].emit(EV.GAME_SELECT, JSON.stringify({ room_id: roomId, game_id: BEAKER_GAME_ID }));
  await delay(500);

  // 레디
  for (const socket of sockets) {
    socket.emit(EV.GAME_READY, JSON.stringify({ room_id: roomId }));
    await delay(100);
  }
  await delay(500);

  // realtime 수신 카운트 등록
  for (const socket of sockets) {
    socket.on(EV.PLAYER_REALTIME, () => { m.receiveCount++; });
  }

  // 게임 시작
  const startPromise = new Promise<void>((resolve) => {
    sockets[0].once(EV.PLAYER_START, () => resolve());
  });
  sockets[0].emit(EV.GAME_START, JSON.stringify({ room_id: roomId }));
  await startPromise;
  console.log(`  Waiting ${GAME_START_DELAY_SEC}s start delay...`);
  await delay(GAME_START_DELAY_SEC * 1000);

  // realtime 스팸
  console.log(`  Spamming for ${TEST_DURATION_SEC}s... (${mode})`);
  const samplingTimer = startSampling(m);
  const intervalMs = 1000 / INPUTS_PER_SEC;
  const spamTimers: NodeJS.Timeout[] = [];

  if (mode === 'no-throttle') {
    for (const socket of sockets) {
      const timer = setInterval(() => {
        socket.emit(EV.GAME_REALTIME, JSON.stringify({ room_id: roomId, delta: '1' }));
        m.emitCount++;
      }, intervalMs);
      spamTimers.push(timer);
    }
  } else {
    // 실제 FE 경로처럼 입력은 누적하고, 100ms마다 delta를 묶어 전송
    for (const socket of sockets) {
      let delta = 0;

      const inputTimer = setInterval(() => {
        delta += 1;
      }, intervalMs);

      const flushTimer = setInterval(() => {
        if (delta <= 0) return;
        socket.emit(EV.GAME_REALTIME, JSON.stringify({ room_id: roomId, delta: String(delta) }));
        m.emitCount++;
        delta = 0;
      }, THROTTLE_INTERVAL_MS);

      spamTimers.push(inputTimer, flushTimer);
    }
  }

  await delay(TEST_DURATION_SEC * 1000);

  spamTimers.forEach((t) => clearInterval(t));
  clearInterval(samplingTimer);
}

// ─── Playwright 테스트 ─────────────────────────────────────
test.describe('beaker-load-test', () => {
  test.setTimeout(180_000);

  async function runLoadTest(label: string, mode: RealtimeMode): Promise<void> {
    console.log(`\n=== ${label.toUpperCase()} TEST ===`);
    console.log(`  Players: ${PLAYER_COUNT}, Input/sec/player: ${INPUTS_PER_SEC}, Duration: ${TEST_DURATION_SEC}s\n`);

    const tokens: string[] = [];
    for (let i = 1; i <= PLAYER_COUNT; i++) {
      tokens.push(await mockLogin(testerId(i)));
    }
    console.log(`  ${PLAYER_COUNT} testers logged in.`);

    const sockets = tokens.map((t) => connectSocket(t));
    await Promise.all(sockets.map(waitConnected));
    console.log(`  ${PLAYER_COUNT} sockets connected.`);

    const m = createMetrics();

    try {
      await runGameFlow(sockets, tokens, m, mode);
    } finally {
      sockets.forEach((s) => s.disconnect());
    }

    printSummary(m, label);
    const outPath = saveResults(m, label);
    console.log(`  Saved: ${outPath}.*`);
  }

  test('no-throttle', async () => {
    await runLoadTest('no-throttle', 'no-throttle');
  });

  test('throttle-100ms', async () => {
    await runLoadTest('throttle-100ms', 'throttle-100ms');
  });
});
