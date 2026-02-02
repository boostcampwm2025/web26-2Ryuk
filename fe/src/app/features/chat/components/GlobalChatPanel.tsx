'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { globalChatService } from '@/app/features/chat/services/GlobalChatService';
import { ChatReceiveData } from '@/app/features/chat/dtos/data';
import { authStore, type AuthStore } from '@/app/features/user/stores/auth';
import { chatPanelStore } from '@/app/features/chat/stores/chatPanel';
import ChatPanel from './ChatPanel';

/**
 * GlobalChat 클라이언트 컴포넌트
 * WebSocket 연결 및 메시지 관리 담당
 */
export default function GlobalChatPanel() {
  const [chats, setChats] = useState<ChatReceiveData[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isUnread, setIsUnread] = useState(false);
  const showPanel = chatPanelStore((state) => state.show);
  const isExpanded = chatPanelStore((state) => state.global.isExpanded);
  const prevExpandedRef = useRef(isExpanded);

  useEffect(() => showPanel('global'), []);
  useEffect(() => globalChatService.onUnreadChange(setIsUnread), []);

  useEffect(() => {
    if (isExpanded) globalChatService.markAsRead();
    prevExpandedRef.current = isExpanded;
  }, [isExpanded]);

  // WebSocket 연결 및 구독
  useEffect(() => {
    const subscribe = async () => {
      await globalChatService.subscribe();

      // 구독 완료 후 연결 상태 확인
      setIsConnected(globalChatService.isConnected());
    };

    subscribe();

    // recents 수신 콜백 등록
    const unsubscribeRecents = globalChatService.onInit((count, messages) => {
      setCurrentParticipants(count);
      setChats(messages);
    });

    // 메시지 수신 콜백 등록
    const unsubscribeMessage = globalChatService.onMessage((message) =>
      setChats((prev) => [...prev, message]),
    );

    // 연결 상태 변경 콜백 등록
    const unsubscribeConnection = globalChatService.onConnectionChange((connected) =>
      setIsConnected(connected),
    );

    // 참여자 수 변경 콜백 등록
    const unsubscribeParticipants = globalChatService.onParticipantsChange((count) =>
      setCurrentParticipants(count),
    );

    // 정리 함수
    return () => {
      unsubscribeRecents();
      unsubscribeMessage();
      unsubscribeConnection();
      unsubscribeParticipants();
      globalChatService.unsubscribe().catch(console.error);
    };
  }, []);

  // 메시지 전송 핸들러
  const handleMessageSubmit = useCallback(async (message: string) => {
    await globalChatService.sendMessage(message);
  }, []);

  const isAuthenticated = authStore((state: AuthStore) => state.isAuthenticated);

  return (
    <ChatPanel
      iconName="globe"
      type="global"
      participantCount={currentParticipants}
      chats={chats}
      isUnread={isUnread}
      onMessageSubmit={handleMessageSubmit}
      isConnected={isConnected}
      disabled={!isConnected || !isAuthenticated}
    />
  );
}
