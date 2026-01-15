'use client';

import { useEffect, useState } from 'react';
import ChatBubbles from '@/app/features/chat/components/ChatBubbles';
import MessageForm from '@/app/components/shared/form/message/MessageForm';
import styles from './chat.module.css';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { ChatReceiveData } from '@/app/features/chat/dtos/type';

export default function RoomTextChat() {
  const roomId = roomStore((state: RoomStore) => state.roomId);
  const isJoined = roomStore((state: RoomStore) => state.isJoined);
  const [chats, setChats] = useState<ChatReceiveData[]>([]);

  useEffect(() => {
    if (!roomId || !isJoined) return;

    const subscribe = async () => {
      await roomChatService.subscribe(roomId);
      const savedMessages = roomChatService.getMessages();
      if (savedMessages.length > 0) setChats(savedMessages);
    };

    subscribe();

    const unsubscribeMessage = roomChatService.onMessage((message) =>
      setChats((prev) => [...prev, message]),
    );

    return () => unsubscribeMessage();
  }, [roomId, isJoined]);

  const handleMessageSubmit = (message: string) => {
    roomChatService.sendMessage(message);
  };

  return (
    <div className={styles.roomTextChat}>
      <div className={styles.content}>
        <div className={styles.chattingArea}>
          <ChatBubbles chats={chats} />
        </div>
        <div className={styles.messageForm}>
          <MessageForm
            placeholder="메시지를 입력하세요..."
            onSubmit={handleMessageSubmit}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
}
