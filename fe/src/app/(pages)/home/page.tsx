import HomePageClient from './HomePageClient';
import GAMES from '@/app/shared/constant';
import { RoomListDto } from '@/app/features/room/dtos/dto';
import { GameRecordListDto } from '@/app/features/gameRecords/dtos/dto';
import { RoomConverter } from '@/app/features/room/dtos/converter';
import { GameRecordConverter } from '@/app/features/gameRecords/dtos/converter';
import { RoomData } from '@/app/features/room/dtos/data';
import { GameRecordListData } from '@/app/features/gameRecords/dtos/data';

// 서버 컴포넌트에서 사용하는 내부 API 주소 (Docker 네트워크)
const INTERNAL_API_BASE = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api`;
const defaultGameId = GAMES.BEAKER.ID;

async function getRooms(): Promise<RoomData[]> {
  try {
    const res = await fetch(`${INTERNAL_API_BASE}/rooms/all`, {
      next: { revalidate: 0 }, // 매 요청마다 재검증
    });
    if (!res.ok) return [];
    const data = await res.json();
    const roomListDto: RoomListDto = data?.data ?? { rooms: [] };
    return roomListDto.rooms.map(RoomConverter.toData);
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return [];
  }
}

async function getGameRecords(): Promise<GameRecordListData> {
  const emptyData = { total: 0, page: 1, podium: [], rankings: [] };
  try {
    const res = await fetch(`${INTERNAL_API_BASE}/game-records/${defaultGameId}?page=1&limit=3`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return emptyData;
    const data = await res.json();
    const gameRecordListDto: GameRecordListDto = data?.data ?? emptyData;
    return GameRecordConverter.toGameRecordListData(gameRecordListDto);
  } catch (error) {
    console.error('Failed to fetch game records:', error);
    return emptyData;
  }
}

export default async function HomePage() {
  // 병렬로 데이터 가져오기
  const [rooms, ranking] = await Promise.all([getRooms(), getGameRecords()]);

  return <HomePageClient initialRooms={rooms} initialRanking={ranking} />;
}
