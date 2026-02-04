'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { globalChatService } from '@/app/features/chat/services/GlobalChatService';
import { ChatReceiveData } from '@/app/features/chat/dtos/data';
import { authStore } from '@/app/features/user/stores/auth';
import { chatPanelStore } from '@/app/features/chat/stores/chatPanel';
import ChatPanel from './ChatPanel';

export default function GlobalChatPanel() {
  const [chats, setChats] = useState<ChatReceiveData[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isUnread, setIsUnread] = useState(false);
  const showPanel = chatPanelStore((state) => state.show);
  const isExpanded = chatPanelStore((state) => state.global.isExpanded);
  const prevExpandedRef = useRef(isExpanded);
  const sessionRestored = authStore((state) => state.sessionRestored);
  const authInitDone = authStore((state) => state.authInitDone);

  useEffect(() => showPanel('global'), []);
  useEffect(() => globalChatService.onUnreadChange(setIsUnread), []);

  useEffect(() => {
    if (isExpanded) globalChatService.markAsRead();
    prevExpandedRef.current = isExpanded;
  }, [isExpanded]);

  // WebSocket 연결 및 구독
  useEffect(() => {
    if (!sessionRestored && !authInitDone) {
      setIsConnected(false);
      return;
    }

    const unsubscribeConnection = globalChatService.onConnectionChange((connected) =>
      setIsConnected(connected),
    );
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
      setIsConnected(globalChatService.isConnected());
    })();

    return () => {
      unsubscribeRecents();
      unsubscribeMessage();
      unsubscribeConnection();
      unsubscribeParticipants();
      globalChatService.unsubscribe().catch(console.error);
    };
  }, [sessionRestored, authInitDone]);

  // 메시지 전송 핸들러
  const handleMessageSubmit = useCallback(async (message: string) => {
    await globalChatService.sendMessage(message);
  }, []);

  const isAuthenticated = Boolean(authStore((state) => state.id));

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
