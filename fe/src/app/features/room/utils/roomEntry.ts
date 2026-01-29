import roomService from '@/app/features/room/services/RoomService';
import { RoomConverter } from '@/app/features/room/dtos/converter';
import { RoomJoinInfoData } from '@/app/features/room/dtos/data';
import { roomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';

/**
 * 인증 전: 방 입장 가능 여부 조회
 */
export async function fetchRoomJoinInfo(roomId: string): Promise<RoomJoinInfoData> {
  const dto = await roomService.getRoomJoinInfo(roomId);
  return RoomConverter.toRoomJoinInfoData(dto);
}

/**
 * 인증 후: 방 전체 정보 동기화
 */
export async function syncRoomState(roomId: string): Promise<void> {
  const dto = await roomService.getRoom(roomId);
  const room = RoomConverter.toData(dto);

  roomStore.getState().setIsGameRecruiting(room.isGameRecruiting ?? false);
  roomStore.getState().setRoomData(room);
}

/**
 * 방 세션 진입 (비밀번호 여부만 판단)
 */
export async function isPasswordRequired(
  roomId: string,
  joinInfo: RoomJoinInfoData,
): Promise<boolean> {
  // 방 소속이 아닌 경우
  if (!joinInfo.isMember) {
    // 비밀번호 인증 필요
    if (joinInfo.isPrivate) return true;
    await roomService.validateJoin(roomId);
  }

  // 방 전체 정보 동기화
  await syncRoomState(roomId);

  // 방 채팅 구독
  await roomChatService.subscribe(roomId);

  return false;
}

/**
 * 비밀번호 인증 후 진입
 */
export async function enterRoomWithPassword(roomId: string, password: string): Promise<void> {
  await roomService.validateJoin(roomId, password);

  await syncRoomState(roomId);
  await roomChatService.subscribe(roomId);
}
