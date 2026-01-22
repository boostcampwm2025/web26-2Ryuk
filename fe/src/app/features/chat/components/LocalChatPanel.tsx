'use client';

import { useEffect, useState } from 'react';
import ChatPanel from './ChatPanel';
import styles from './chat.module.css';
import AudioControlButtons from '@/app/features/voice/components/AudioControlButtons';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { useRoomChat } from '../hooks/useRoomChat';
import { Position } from '@/app/components/shared/floatingWidget/type';
import { PANEL_CONFIG } from './type';
import * as TextButton from '@/app/components/shared/button/TextButton';
import { useRouter } from 'next/navigation';
import Avatar from '@/app/components/shared/profile/Avatar';
import { AuthStore, authStore } from '@/app/features/user/stores/auth';
import roomService from '@/app/features/room/services/RoomService';
import { RoomConverter } from '@/app/features/room/dtos/converter';
import useNavigation from '@/app/hooks/useNavigation';
import { ParticipantData } from '@/app/features/room/dtos/data';

export default function LocalChatPanel() {
  const myId = authStore((state: AuthStore) => state.userId);
  const roomId = roomStore((state: RoomStore) => state.roomId);
  const isJoined = roomStore((state: RoomStore) => state.isJoined);
  const roomData = roomStore((state: RoomStore) => state.roomData);
  const [micState, setMicState] = useState(true);
  const [speakerState, setSpeakerState] = useState(true);
  const { goToRoom } = useNavigation();
  const roomTitle = roomData?.title || '대화방';

  // 초기 위치 계산: 오른쪽 하단
  const getInitialPosition = (): Position => {
    if (typeof window === 'undefined') return PANEL_CONFIG.DEFAULT_POSITION;
    const x = window.innerWidth - PANEL_CONFIG.WIDTH - PANEL_CONFIG.OFFSET;
    const y = window.innerHeight - PANEL_CONFIG.HEIGHT - PANEL_CONFIG.OFFSET;
    return { x, y };
  };

  const [initialPosition] = useState<Position>(getInitialPosition());

  // 채팅 구독, 메시지, 연결 상태를 자동으로 관리
  const { chats, isConnected } = useRoomChat(roomId, isJoined);

  const participantCount = roomData?.currentParticipants ?? 0;
  useEffect(() => {
    if (!roomId || !isJoined) return;
    if (roomData?.title) return;

    (async () => {
      const roomDto = await roomService.getRoom(roomId);
      const data = RoomConverter.toData(roomDto);
      roomStore.getState().setRoomData(data);
    })().catch();
  }, [roomId, isJoined, roomData?.title]);

  const handleMicChange = (state: boolean) => setMicState(state);
  const handleSpeakerChange = (state: boolean) => setSpeakerState(state);
  const handleMessageSubmit = async (message: string) => {
    if (!message.trim()) return;
    await roomChatService.sendMessage(message.trim());
  };

  const handleGoRoomClick = () => {
    if (roomId) goToRoom(roomId);
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

  const participants =
    roomData?.participants?.filter((p: ParticipantData) => p.userId !== myId) ?? [];

  const panelChildren = (
    <>
      <div className={styles.sectionTop}>
        <div className={styles.sectionTitleGroup}>
          <div className={styles.sectionTitle}>{roomTitle}</div>
        </div>
        <TextButton.Outline
          iconName="right"
          text="방으로"
          size="small"
          onClick={handleGoRoomClick}
        />
      </div>
      <div className={styles.sectionAvatars}>
        {participants.map((p: ParticipantData) => (
          <Avatar key={p.nickname} nickname={p.nickname} profileImage={p.profileImage} />
        ))}
      </div>
    </>
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
      disabled={!isJoined || !isConnected}
      initialPosition={initialPosition}
    >
      {panelChildren}
    </ChatPanel>
  );
}
