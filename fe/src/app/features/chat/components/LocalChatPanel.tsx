'use client';

import { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';
import styles from './chat.module.css';
import AudioControlButtons from '@/app/features/voice/components/AudioControlButtons';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { ChatReceiveData } from '@/app/features/chat/dtos/type';

export default function LocalChatPanel() {
  const roomId = roomStore((state: RoomStore) => state.roomId);
  const isJoined = roomStore((state: RoomStore) => state.isJoined);
  const [micState, setMicState] = useState(true);
  const [speakerState, setSpeakerState] = useState(true);
  const [chats, setChats] = useState<ChatReceiveData[]>([]);

  useEffect(() => {
    if (!roomId || !isJoined) return;

    const savedMessages = roomChatService.getMessages();
    if (savedMessages.length > 0) setChats(savedMessages);

    const unsubscribeMessage = roomChatService.onMessage((message) =>
      setChats((prev) => [...prev, message]),
    );

    return () => {
      unsubscribeMessage();
    };
  }, [roomId, isJoined]);

  const handleMicChange = (state: boolean) => setMicState(state);
  const handleSpeakerChange = (state: boolean) => setSpeakerState(state);
  const handleMessageSubmit = (message: string) => {
    roomChatService.sendMessage(message);
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
      participantCount={0}
      chats={chats}
      onMessageSubmit={handleMessageSubmit}
      headerChildren={headerChildren}
    />
  );
}
