'use client';

import { useEffect, useState, useRef } from 'react';
import ChatBubbles from '@/app/features/chat/components/ChatBubbles';
import MessageForm from '@/app/components/shared/form/message/MessageForm';
import styles from './chat.module.css';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { RoomChatReceiveData } from '@/app/features/chat/dtos/type';
import { ChatReceiveData } from '@/app/features/chat/dtos/type';

export default function RoomTextChat() {
  const roomId = roomStore((state: RoomStore) => state.roomId);
  const isJoined = roomStore((state: RoomStore) => state.isJoined);
  const [chats, setChats] = useState<ChatReceiveData[]>([]);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때 자동 스크롤
  useEffect(() => {
    if (!chatAreaRef.current) return;
    chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
  }, [chats]);

  useEffect(() => {
    if (!roomId || !isJoined) return;

    const subscribe = async () => {
      await roomChatService.subscribe(roomId);
      const savedMessages = roomChatService.getMessages();
      if (savedMessages.length > 0) {
        // RoomChatReceiveData를 ChatReceiveData로 변환
        const convertedChats: ChatReceiveData[] = savedMessages.map((msg) => ({
          id: msg.id,
          message: msg.message,
          sender: msg.sender,
          timestamp: msg.timestamp,
        }));
        setChats(convertedChats);
        // 초기 메시지 로드 후 스크롤
        setTimeout(() => {
          if (!chatAreaRef.current) return;
          chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }, 100);
      }
    };

    subscribe();

    const unsubscribeMessage = roomChatService.onMessage((message: RoomChatReceiveData) => {
      // RoomChatReceiveData를 ChatReceiveData로 변환
      const convertedMessage: ChatReceiveData = {
        id: message.id,
        message: message.message,
        sender: message.sender,
        timestamp: message.timestamp,
      };
      setChats((prev) => [...prev, convertedMessage]);
    });

    return () => {
      unsubscribeMessage();
      // 메시지 콜백만 해제 (실제 방 퇴장은 LeaveRoomButtonWithModal에서 처리)
    };
  }, [roomId, isJoined]);

  const handleMessageSubmit = (message: string) => {
    if (!message.trim()) return;
    roomChatService.sendMessage(message.trim());
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
            disabled={!isJoined}
          />
        </div>
      </div>
    </div>
  );
}
