'use client';

import { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';
import styles from './chat.module.css';
import AudioControlButtons from '@/app/features/voice/components/AudioControlButtons';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { ChatReceiveData, RoomChatReceiveData } from '@/app/features/chat/dtos/type';

export default function LocalChatPanel() {
  const roomId = roomStore((state: RoomStore) => state.roomId);
  const isJoined = roomStore((state: RoomStore) => state.isJoined);
  const roomData = roomStore((state: RoomStore) => state.roomData);
  const [micState, setMicState] = useState(true);
  const [speakerState, setSpeakerState] = useState(true);
  const [chats, setChats] = useState<ChatReceiveData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // roomData 기반으로 참여자 수 가져오기
  const participantCount = roomData?.currentParticipants || 0;

  useEffect(() => {
    if (!roomId || !isJoined) {
      setIsConnected(false);
      return;
    }

    // 초기 연결 상태를 false로 설정 (구독 완료 전까지는 연결 중 상태)
    setIsConnected(false);

    const subscribe = async () => {
      try {
        // 구독 완료 대기
        await roomChatService.subscribe(roomId);

        // 구독 완료 후 연결 상태 확인 (약간의 지연 후 확인하여 콜백이 등록되도록)
        setTimeout(() => {
          setIsConnected(roomChatService.isConnected());
        }, 100);

        // 저장된 메시지 로드 및 변환
        const savedMessages = roomChatService.getMessages();
        if (savedMessages.length > 0) {
          const convertedChats: ChatReceiveData[] = savedMessages.map(
            (msg: RoomChatReceiveData) => ({
              id: msg.id,
              message: msg.message,
              sender: msg.sender,
              timestamp: msg.timestamp,
            }),
          );
          setChats(convertedChats);
        }
      } catch (error) {
        console.error('[LocalChatPanel] 구독 실패:', error);
        setIsConnected(false);
      }
    };

    subscribe();

    // 메시지 수신 콜백 등록
    const unsubscribeMessage = roomChatService.onMessage((message: RoomChatReceiveData) => {
      const convertedMessage: ChatReceiveData = {
        id: message.id,
        message: message.message,
        sender: message.sender,
        timestamp: message.timestamp,
      };
      setChats((prev) => [...prev, convertedMessage]);
    });

    // 연결 상태 변경 콜백 등록
    const unsubscribeConnection = roomChatService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, [roomId, isJoined]);

  const handleMicChange = (state: boolean) => setMicState(state);
  const handleSpeakerChange = (state: boolean) => setSpeakerState(state);
  const handleMessageSubmit = (message: string) => {
    if (!message.trim()) return;
    roomChatService.sendMessage(message.trim());
  };

  const headerChildren = (
    <div className={styles.roomChatHeaderControls}>
      <AudioControlButtons
        initialMicState={micState}
        initialSpeakerState={speakerState}
        onMicChange={handleMicChange}
        onSpeakerChange={handleSpeakerChange}
      />
    </div>
  );

  if (!roomId || !isJoined) return null;

  return (
    <ChatPanel
      iconName="voice"
      type="local"
      participantCount={participantCount}
      chats={chats}
      onMessageSubmit={handleMessageSubmit}
      headerChildren={headerChildren}
      isConnected={isConnected}
      disabled={!isJoined}
    />
  );
}
