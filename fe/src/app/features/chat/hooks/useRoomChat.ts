import { useState, useEffect } from 'react';
import { roomChatService } from '../services/RoomChatService';
import { ChatReceiveData } from '../dtos/data';

export function useRoomChat(roomId: string | null, isJoined: boolean) {
  const [chats, setChats] = useState<ChatReceiveData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId || !isJoined) {
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
  }, [roomId, isJoined]);

  return { chats, isConnected };
}
