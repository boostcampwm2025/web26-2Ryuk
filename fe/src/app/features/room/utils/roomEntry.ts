import roomService from '@/app/features/room/services/RoomService';
import { RoomConverter } from '@/app/features/room/dtos/converter';
import { RoomJoinInfoData } from '@/app/features/room/dtos/data';
import { roomStore } from '@/app/features/room/stores/room';

/**
 * 인증 전: 방 입장 가능 여부 조회 (getJoinInfo)
 */
export async function fetchRoomJoinInfo(roomId: string): Promise<RoomJoinInfoData> {
  const dto = await roomService.getRoomJoinInfo(roomId);
  return RoomConverter.toRoomJoinInfoData(dto);
}

/**
 * 비밀방 여부: 미소속이고 비공개면 비밀번호 입력 필요
 */
export function isPasswordRequiredForEntry(joinInfo: RoomJoinInfoData): boolean {
  if (joinInfo.isMember) return false;
  return joinInfo.isPrivate;
}

/**
 * 인증 후: 방 전체 정보만 동기화 (roomStore 갱신, 구독 없음)
 */
export async function syncRoomState(roomId: string): Promise<void> {
  const dto = await roomService.getRoom(roomId);
  const room = RoomConverter.toData(dto);
  roomStore.getState().replaceRoom(room);
}

/**
 * validate join 요청 후 성공 시에만 roomStore 동기화 (구독·라우팅 없음)
 */
export async function validateJoinAndSyncRoom(
  roomId: string,
  password: string = '',
): Promise<void> {
  await roomService.validateJoin(roomId, password);
  await syncRoomState(roomId);
}
