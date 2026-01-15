/**
 * Redis에 방 더미 데이터를 생성하는 스크립트. 존재할 시 삭제하고 새로 생성
 * 실행: pnpm ts-node src/scripts/seed-rooms.ts
 * 
 5개의 로컬 방이 생성되었습니다:
노래 부를 사람~ (5명/10명) - 태그: 노래, 잡담
재밌게 게임해요! (3명/6명) - 태그: 게임
밤새 수다 떨 사람 (2명/8명) - 태그: 잡담, 수다
코딩 스터디 (4명/12명) - 태그: 코딩, 스터디
비밀 방 (비공개) (1명/4명) - 태그: 비밀
각 방에는 멤버 정보(프로필 이미지, 마이크 상태 등)와 태그가 포함되어 있습니다. 
 */

import { createClient, RedisClientType } from 'redis';
import { loadEnv } from '../config/env';
import { ROOM_TYPE } from '../modules/room/room.type';
import { toUuid } from '@src/common/utils/user-id';

loadEnv();

interface RoomData {
  id: string;
  title: string;
  hostId: string;
  type: string;
  maxParticipants: number;
  isPrivate: boolean;
  isMicAvailable: boolean;
  tags: string[];
  members: Array<{
    userId: string;
    nickname: string;
    profileImage: string;
    isMicOn: boolean;
  }>;
}

const dummyRooms: RoomData[] = [
  {
    id: '3f1c8c6a-7a4a-4a6c-9b7e-0b5c7f3a9f21',
    title: '노래 부를 사람~',
    hostId: 'J001',
    type: ROOM_TYPE.LOCAL,
    maxParticipants: 10,
    isPrivate: false,
    isMicAvailable: true,
    tags: ['노래', '잡담'],
    members: [
      {
        userId: 'J001',
        nickname: 'J001',
        profileImage: 'https://i.pravatar.cc/150?img=1',
        isMicOn: true,
      },
      {
        userId: 'J002',
        nickname: 'J002',
        profileImage: 'https://i.pravatar.cc/150?img=2',
        isMicOn: true,
      },
      {
        userId: 'J003',
        nickname: 'J003',
        profileImage: 'https://i.pravatar.cc/150?img=3',
        isMicOn: false,
      },
      {
        userId: 'J004',
        nickname: 'J004',
        profileImage: 'https://i.pravatar.cc/150?img=4',
        isMicOn: true,
      },
      {
        userId: 'J005',
        nickname: 'J005',
        profileImage: 'https://i.pravatar.cc/150?img=5',
        isMicOn: false,
      },
    ],
  },
  {
    id: '1a8b0c2d-55e4-4e2a-9e2a-9b4a12345678',
    title: '재밌게 게임해요!',
    hostId: 'J006',
    type: ROOM_TYPE.LOCAL,
    maxParticipants: 6,
    isPrivate: false,
    isMicAvailable: true,
    tags: ['게임'],
    members: [
      {
        userId: 'J006',
        nickname: 'J006',
        profileImage: 'https://i.pravatar.cc/150?img=3',
        isMicOn: true,
      },
      {
        userId: 'J007',
        nickname: 'J007',
        profileImage: 'https://i.pravatar.cc/150?img=4',
        isMicOn: true,
      },
      {
        userId: 'J008',
        nickname: 'J008',
        profileImage: 'https://i.pravatar.cc/150?img=5',
        isMicOn: false,
      },
    ],
  },
  {
    id: '2b9c1d3e-66f5-5f3b-0f3b-0c5b23456789',
    title: '밤새 수다 떨 사람',
    hostId: 'J009',
    type: ROOM_TYPE.LOCAL,
    maxParticipants: 8,
    isPrivate: false,
    isMicAvailable: true,
    tags: ['잡담', '수다'],
    members: [
      {
        userId: 'J009',
        nickname: 'J009',
        profileImage: 'https://i.pravatar.cc/150?img=6',
        isMicOn: true,
      },
      {
        userId: 'J010',
        nickname: 'J010',
        profileImage: 'https://i.pravatar.cc/150?img=7',
        isMicOn: true,
      },
    ],
  },
  {
    id: '3c0d2e4f-77g6-6g4c-1g4c-1d6c34567890',
    title: '코딩 스터디',
    hostId: 'J011',
    type: ROOM_TYPE.LOCAL,
    maxParticipants: 12,
    isPrivate: false,
    isMicAvailable: false,
    tags: ['코딩', '스터디'],
    members: [
      {
        userId: 'J011',
        nickname: 'J011',
        profileImage: 'https://i.pravatar.cc/150?img=8',
        isMicOn: false,
      },
      {
        userId: 'J012',
        nickname: 'J012',
        profileImage: 'https://i.pravatar.cc/150?img=9',
        isMicOn: false,
      },
      {
        userId: 'J013',
        nickname: 'J013',
        profileImage: 'https://i.pravatar.cc/150?img=10',
        isMicOn: true,
      },
      {
        userId: 'J014',
        nickname: 'J014',
        profileImage: 'https://i.pravatar.cc/150?img=11',
        isMicOn: false,
      },
    ],
  },
  {
    id: '4d1e3f5g-88h7-7h5d-2h5d-2e7d45678901',
    title: '비밀 방 (비공개)',
    hostId: 'J015',
    type: ROOM_TYPE.LOCAL,
    maxParticipants: 4,
    isPrivate: true,
    isMicAvailable: true,
    tags: ['비밀'],
    members: [
      {
        userId: 'J015',
        nickname: 'J015',
        profileImage: 'https://i.pravatar.cc/150?img=12',
        isMicOn: true,
      },
    ],
  },
];

/**
 * 방과 관련된 모든 Redis 데이터 삭제
 */
async function deleteRoom(client: RedisClientType, roomId: string): Promise<void> {
  // 1. 방 메타데이터 삭제
  await client.del(`room:${roomId}`);

  // 2. 태그 Set 삭제
  await client.del(`room:${roomId}:tags`);

  // 3. 멤버 목록 조회
  const memberUserIds = await client.hKeys(`room:${roomId}:members`);

  // 4. 각 멤버의 상세 정보 삭제 및 사용자 방 목록에서 제거
  for (const userId of memberUserIds) {
    await client.del(`room:${roomId}:members:${userId}`);
    await client.sRem(`user:${userId}:rooms`, roomId);
  }

  // 5. 방 멤버 목록 Hash 삭제
  await client.del(`room:${roomId}:members`);
}

async function seedRooms() {
  // 로컬 실행 시 localhost 사용, Docker 환경에서는 환경 변수 사용
  const host = process.env.REDIS_HOST === 'redis' ? 'localhost' : process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';

  const url = `redis://${host}:${port}`;
  console.log(`Redis 연결 시도: ${url}`);

  const client = createClient({ url }) as RedisClientType;

  client.on('error', (err) => console.error('Redis 연결 에러:', err));
  client.on('connect', () => console.log('Redis 연결 성공'));

  try {
    await client.connect();

    // 기존 사용자별 방 목록 키 정리 (J001 형식으로 저장된 오래된 데이터)
    console.log('\n=== 기존 사용자별 방 목록 키 정리 ===');
    const userKeys = await client.keys('user:*:rooms');
    const oldFormatKeys = userKeys.filter((key) => {
      // J001, J002 같은 형식의 키만 필터링 (UUID 형식이 아닌 것)
      const match = key.match(/^user:(.+):rooms$/);
      if (!match) return false;
      const userId = match[1];
      // UUID 형식이 아니면 (하이픈이 없거나 J로 시작하면) 오래된 형식
      return !userId.includes('-') || userId.startsWith('J');
    });

    if (oldFormatKeys.length > 0) {
      console.log(`⚠️  오래된 형식의 사용자 키 ${oldFormatKeys.length}개 발견: ${oldFormatKeys.join(', ')}`);
      console.log('오래된 형식의 키를 삭제합니다...');
      await Promise.all(oldFormatKeys.map((key) => client.del(key)));
      console.log(`✅ ${oldFormatKeys.length}개의 오래된 키 삭제 완료\n`);
    } else {
      console.log('✅ 오래된 형식의 키가 없습니다.\n');
    }

    console.log('=== 방 더미 데이터 생성 시작 ===\n');

    for (const room of dummyRooms) {
      const roomKey = `room:${room.id}`;

      // 기존 방이 있는지 확인
      const exists = await client.exists(roomKey);
      if (exists) {
        console.log(`⚠️  기존 방 삭제 중: ${room.title} (${room.id})`);
        await deleteRoom(client, room.id);
        console.log(`✅ 기존 방 삭제 완료: ${room.title} (${room.id})\n`);
      }

      // hostId를 UUID로 변환
      const hostUuid = toUuid(room.hostId);

      // 방 메타데이터 저장
      await client.hSet(roomKey, {
        title: room.title,
        host_id: hostUuid,
        type: room.type,
        max_participants: room.maxParticipants.toString(),
        current_participants: room.members.length.toString(),
        is_private: room.isPrivate ? '1' : '0',
        is_mic_available: room.isMicAvailable ? '1' : '0',
        password: '',
        create_date: new Date().toISOString(),
      });

      // 태그 저장
      if (room.tags.length > 0) {
        await client.sAdd(`room:${room.id}:tags`, room.tags);
      }

      // 멤버 정보 저장
      for (const member of room.members) {
        // Mock ID('J001' 형식)를 UUID로 변환
        const memberUuid = toUuid(member.userId);

        // room:{roomId}:members Hash에 UUID 추가 (참여 시간)
        await client.hSet(`room:${room.id}:members`, memberUuid, Date.now().toString());

        // room:{roomId}:members:{uuid} Hash에 멤버 상세 정보 저장
        await client.hSet(`room:${room.id}:members:${memberUuid}`, {
          nickname: member.nickname,
          profile_image: member.profileImage,
          role: 'USER',
          is_mic_on: member.isMicOn ? '1' : '0',
          is_audio_on: '1',
          is_speaking: '0',
          join_date: new Date().toISOString(),
        });

        // user:{uuid}:rooms Set에 방 ID 추가
        await client.sAdd(`user:${memberUuid}:rooms`, room.id);
      }

      console.log(`✅ 방 생성 완료: ${room.title} (${room.id})`);
      console.log(`   - 멤버 수: ${room.members.length}/${room.maxParticipants}`);
      console.log(`   - 태그: ${room.tags.join(', ')}`);
      console.log(`   - 비공개: ${room.isPrivate ? '예' : '아니오'}\n`);
    }

    console.log('=== 방 더미 데이터 생성 완료 ===\n');
  } catch (error) {
    console.error('에러 발생:', error);
    throw error;
  } finally {
    await client.quit();
    console.log('Redis 연결 종료');
  }
}

seedRooms()
  .then(() => {
    console.log('스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  });
