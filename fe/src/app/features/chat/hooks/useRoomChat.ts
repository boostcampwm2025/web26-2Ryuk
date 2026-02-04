import { useState, useEffect } from 'react';
import { roomChatService } from '../services/RoomChatService';
import { roomStore } from '@/app/features/room/stores/room';
import { authStore } from '@/app/features/user/stores/auth';
import { ChatReceiveData } from '../dtos/data';
import type {
  RoomParticipantDeleteData,
  RoomParticipantJoinData,
  RoomParticipantLeaveData,
  RoomParticipantUpdateData,
} from '@/app/features/room/dtos/data';

export function useRoomChat(roomId?: string, isJoined?: boolean) {
  const [chats, setChats] = useState<ChatReceiveData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const storeRoomId = roomStore((s) => s.id);

  useEffect(() => {
    const isInvalid = !roomId || !isJoined || storeRoomId !== roomId;

    if (isInvalid) {
      setChats([]);
      setIsConnected(false);
      return;
    }

    const unsubscribeRecents = roomChatService.onRecents(setChats);
    const unsubscribeMessage = roomChatService.onMessage((message) =>
      setChats((prev) => [...prev, message]),
    );
    const unsubscribeConnection = roomChatService.onConnectionChange(setIsConnected);

    let unsubscribeJoin: (() => void) | undefined;
    let unsubscribeLeave: (() => void) | undefined;
    let unsubscribeUpdate: (() => void) | undefined;
    let unsubscribeDelete: (() => void) | undefined;
    let cancelled = false;

    const subscribe = async () => {
      try {
        await roomChatService.subscribe(roomId);
        if (cancelled) return;

        const { addParticipant, removeParticipant, updateRoom, resetRoom } = roomStore.getState();
        const myId = authStore.getState().id;

        unsubscribeJoin = roomChatService.onJoin((data: RoomParticipantJoinData) => {
          if (data.user.userId === myId) return;
          addParticipant(data.user);
        });

        unsubscribeLeave = roomChatService.onLeave((data: RoomParticipantLeaveData) => {
          removeParticipant(data.user.id);
        });

        unsubscribeUpdate = roomChatService.onUpdate((data: RoomParticipantUpdateData) => {
          updateRoom({
            maxParticipants: data.maxParticipants,
            currentParticipants: data.currentParticipants,
            participants: data.participants,
            title: data.title,
            tags: data.tags,
            hostId: data.hostId,
            isMicAvailable: data.isMicAvailable,
            isPrivate: data.isPrivate,
            createDate: data.createDate,
          });
        });

        unsubscribeDelete = roomChatService.onDelete((_: RoomParticipantDeleteData) => {
          resetRoom();
        });

        setChats(roomChatService.getMessages());
        setIsConnected(roomChatService.isConnected());
      } catch {
        setIsConnected(false);
      }
    };

    subscribe();

    return () => {
      cancelled = true;
      unsubscribeRecents();
      unsubscribeMessage();
      unsubscribeConnection();
      unsubscribeJoin?.();
      unsubscribeLeave?.();
      unsubscribeUpdate?.();
      unsubscribeDelete?.();
    };
  }, [roomId, isJoined, storeRoomId]);

  return { chats, isConnected };
}
