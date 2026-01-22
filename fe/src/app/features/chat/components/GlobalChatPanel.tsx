'use client';

import { useEffect, useState, useCallback } from 'react';
import { globalChatService } from '@/app/features/chat/services/GlobalChatService';
import { ChatReceiveData } from '@/app/features/chat/dtos/data';
import { authStore, type AuthStore } from '@/app/features/user/stores/auth';
import ChatPanel from './ChatPanel';
import { Position } from '@/app/components/shared/floatingWidget/type';
import { PANEL_CONFIG } from './type';

/**
 * GlobalChat 클라이언트 컴포넌트
 * WebSocket 연결 및 메시지 관리 담당
 */
export default function GlobalChatPanel() {
  const [chats, setChats] = useState<ChatReceiveData[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const getInitialPosition = (): Position => {
    if (typeof window === 'undefined') return PANEL_CONFIG.DEFAULT_POSITION;
    const x = window.innerWidth - PANEL_CONFIG.WIDTH - PANEL_CONFIG.OFFSET;
    const y =
      window.innerHeight -
      PANEL_CONFIG.HEIGHT -
      PANEL_CONFIG.OFFSET -
      PANEL_CONFIG.HEIGHT -
      PANEL_CONFIG.GAP;
    return { x, y };
  };

  const [initialPosition] = useState<Position>(getInitialPosition());

  // WebSocket 연결 및 구독
  useEffect(() => {
    const subscribe = async () => {
      await globalChatService.subscribe();

      // 구독 완료 후 연결 상태 확인
      setIsConnected(globalChatService.isConnected());
    };

    subscribe();

    // recents 수신 콜백 등록 (초기 메시지 로드 시 배열 교체)
    const unsubscribeRecents = globalChatService.onRecents((messages) => setChats(messages));

    // 메시지 수신 콜백 등록 (새 메시지만 추가)
    const unsubscribeMessage = globalChatService.onMessage((message) =>
      setChats((prev) => [...prev, message]),
    );

    // 연결 상태 변경 콜백 등록
    const unsubscribeConnection = globalChatService.onConnectionChange((connected) =>
      setIsConnected(connected),
    );

    // 참여자 수 변경 콜백 등록 (브로드캐스트 받은 데이터로 업데이트)
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
      onMessageSubmit={handleMessageSubmit}
      isConnected={isConnected}
      disabled={!isConnected || !isAuthenticated}
      initialPosition={initialPosition}
    />
  );
}
