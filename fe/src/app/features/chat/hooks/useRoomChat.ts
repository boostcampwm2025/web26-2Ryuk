import { useState, useEffect } from 'react';
import { roomChatService } from '../services/RoomChatService';
import { roomStore } from '@/app/features/room/stores/room';
import { ChatReceiveData } from '../dtos/data';

export function useRoomChat(roomId?: string, isJoined?: boolean) {
  const [chats, setChats] = useState<ChatReceiveData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const storeRoomId = roomStore((s) => s.id);

  useEffect(() => {
    // 현재 소속된 방과 요청 roomId 가 다르면 구독하지 않음
    // (다른 방 URL 직접 접근 시 중복 구독/입장 방지)
    if (!roomId || !isJoined || storeRoomId !== roomId) {
      setIsConnected(false);
      setChats([]);
      return;
    }

    // 최근 메시지 교체 콜백
    const unsubscribeRecents = roomChatService.onRecents((messages: ChatReceiveData[]) => {
      setChats(messages);
    });

    // 메시지 수신 콜백 등록
    const unsubscribeMessage = roomChatService.onMessage((message: ChatReceiveData) => {
      setChats((prev) => [...prev, message]);
    });

    // 연결 상태 변경 콜백 등록
    const unsubscribeConnection = roomChatService.onConnectionChange(setIsConnected);

    const initializeRoomChat = async () => {
      try {
        await roomChatService.subscribe(roomId);
        // subscribe 중에 받은 recents가 콜백 등록 전에 전달됐을 수 있으므로 최신 상태를 한번 반영
        setChats(roomChatService.getMessages());
        setIsConnected(roomChatService.isConnected());
      } catch (error) {
        setIsConnected(false);
        throw error;
      }
    };

    initializeRoomChat().catch(() => setIsConnected(false));

    return () => {
      unsubscribeRecents();
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, [roomId, isJoined, storeRoomId]);

  return { chats, isConnected };
}
