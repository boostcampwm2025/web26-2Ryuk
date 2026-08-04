'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { globalChatService } from '@/app/features/chat/services/GlobalChatService';
import { ChatReceiveData } from '@/app/features/chat/dtos/data';
import { authStore } from '@/app/features/user/stores/auth';
import { chatPanelStore } from '@/app/features/chat/stores/chatPanel';
import ChatPanel from './ChatPanel';

/**
 * 전체 채팅: 비로그인도 열람(수신) 가능, 전송만 로그인 필요.
 * 소켓 구독은 auth 완료를 기다리지 않고 마운트 즉시 시작.
 */
export default function GlobalChatPanel() {
  const [chats, setChats] = useState<ChatReceiveData[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [isUnread, setIsUnread] = useState(false);
  const showPanel = chatPanelStore((state) => state.show);
  const isExpanded = chatPanelStore((state) => state.global.isExpanded);
  const prevExpandedRef = useRef(isExpanded);
  const isAuthenticated = Boolean(authStore((state) => state.id));

  useEffect(() => showPanel('global'), [showPanel]);
  useEffect(() => globalChatService.onUnreadChange(setIsUnread), []);

  useEffect(() => {
    if (isExpanded) globalChatService.markAsRead();
    prevExpandedRef.current = isExpanded;
  }, [isExpanded]);

  // auth와 무관하게 즉시 구독 (열람). 전송은 disabled로 차단.
  useEffect(() => {
    const unsubscribeConnection = globalChatService.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) setConnectionFailed(false);
    });
    setIsConnected(globalChatService.isConnected());

    const unsubscribeRecents = globalChatService.onInit((count, messages) => {
      setCurrentParticipants(count);
      setChats(messages);
    });

    const unsubscribeMessage = globalChatService.onMessage((message) =>
      setChats((prev) => [...prev, message]),
    );

    const unsubscribeParticipants = globalChatService.onParticipantsChange((count) =>
      setCurrentParticipants(count),
    );

    (async () => {
      await globalChatService.subscribe();
      const ok = globalChatService.isConnected();
      setIsConnected(ok);
      setConnectionFailed(!ok);
    })();

    return () => {
      unsubscribeRecents();
      unsubscribeMessage();
      unsubscribeConnection();
      unsubscribeParticipants();
      // 패널이 언마운트될 때만 구독 해제. auth 변경으로 끊지 않음.
      globalChatService.unsubscribe().catch(console.error);
    };
  }, []);

  const handleMessageSubmit = useCallback(async (message: string) => {
    await globalChatService.sendMessage(message);
  }, []);

  return (
    <ChatPanel
      iconName="globe"
      type="global"
      participantCount={currentParticipants}
      chats={chats}
      isUnread={isUnread}
      onMessageSubmit={handleMessageSubmit}
      isConnected={isConnected}
      connectionFailed={connectionFailed}
      disabled={!isConnected || !isAuthenticated}
    />
  );
}
