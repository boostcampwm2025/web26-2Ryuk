'use client';

import { useEffect, useRef } from 'react';
import ChatBubbles from '@/app/features/chat/components/ChatBubbles';
import MessageForm from '@/app/components/shared/form/message/MessageForm';
import styles from './chat.module.css';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { useRoomChat } from '@/app/features/chat/hooks/useRoomChat';

export default function RoomTextChat() {
  const roomId = roomStore((state: RoomStore) => state.roomId);
  const isJoined = roomStore((state: RoomStore) => state.isJoined);
  const { chats, isConnected } = useRoomChat(roomId, isJoined);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때 자동 스크롤
  useEffect(() => {
    if (!chatAreaRef.current) return;
    chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
  }, [chats]);

  const handleMessageSubmit = async (message: string) => {
    if (!message.trim()) return;
    await roomChatService.sendMessage(message.trim());
  };

  return (
    <div className={styles.roomTextChat}>
      <div className={styles.content}>
        <div ref={chatAreaRef} className={styles.chattingArea}>
          <ChatBubbles chats={chats} />
        </div>
        <div className={styles.messageForm}>
          <MessageForm
            placeholder="메시지를 입력하세요..."
            onSubmit={handleMessageSubmit}
            disabled={!isJoined || !isConnected}
          />
        </div>
      </div>
    </div>
  );
}
