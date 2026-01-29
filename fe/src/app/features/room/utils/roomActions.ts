import roomService from '@/app/features/room/services/RoomService';
import { roomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';

export async function leaveRoom() {
  await roomChatService.unsubscribe();
  roomStore.getState().leaveRoom();
}

export async function deleteRoom(roomId: string) {
  roomChatService.clearSubscriptionOnly();
  await roomService.deleteRoom(roomId);
  roomStore.getState().leaveRoom();
}
