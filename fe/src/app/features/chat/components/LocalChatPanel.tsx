'use client';

import { useEffect, useState, useRef } from 'react';
import ChatPanel from './ChatPanel';
import styles from './chat.module.css';
import AudioControlButtons from '@/app/features/voice/components/AudioControlButtons';
import { roomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { useRoomChat } from '../hooks/useRoomChat';
import { chatPanelStore } from '@/app/features/chat/stores/chatPanel';
import * as TextButton from '@/app/components/shared/button/TextButton';
import Avatar from '@/app/components/shared/profile/Avatar';
import { AuthStore, authStore } from '@/app/features/user/stores/auth';
import roomService from '@/app/features/room/services/RoomService';
import { RoomConverter } from '@/app/features/room/dtos/converter';
import { useVoiceChat } from '@/app/features/voice/hooks/useVoiceChat';
import useNavigation from '@/app/hooks/useNavigation';
import { RoomParticipantData as PData } from '@/app/features/room/dtos/data';

export default function LocalChatPanel() {
  const myId = authStore((state: AuthStore) => state.userId);
  const roomId = roomStore((state) => state.id);
  const roomTitle = roomStore((state) => state.title);
  const participants = roomStore((state) => state.participants);
  const currentParticipants = roomStore((state) => state.currentParticipants);
  const isJoined = Boolean(roomId);
  const { isMyMicOn, masterMute, toggleMyMic, toggleMasterMute } = useVoiceChat();
  const { gotoRoom } = useNavigation();
  const roomTitleText = roomTitle || '대화방';
  const [isUnread, setIsUnread] = useState(false);
  const showPanel = chatPanelStore((state) => state.show);

  useEffect(() => {
    if (roomId && isJoined) showPanel('local');
  }, [roomId, isJoined]);

  useEffect(() => roomChatService.onUnreadChange(setIsUnread), []);
  const isExpanded = chatPanelStore((state) => state.local.isExpanded);
  const prevExpandedRef = useRef(isExpanded);
  useEffect(() => {
    if (!prevExpandedRef.current && isExpanded) {
      roomChatService.markAsRead();
    }
    prevExpandedRef.current = isExpanded;
  }, [isExpanded]);

  // 채팅 구독, 메시지, 연결 상태를 자동으로 관리
  const { chats, isConnected } = useRoomChat(roomId, isJoined);

  const participantCount = currentParticipants ?? 0;
  useEffect(() => {
    if (!roomId || !isJoined) return;
    if (roomTitle) return;

    (async () => {
      const roomDto = await roomService.getRoom(roomId);
      const data = RoomConverter.toData(roomDto);
      roomStore.getState().replaceRoom(data);
    })().catch();
  }, [roomId, isJoined, roomTitle]);

  const handleMessageSubmit = async (message: string) => {
    if (!message.trim()) return;
    await roomChatService.sendMessage(message.trim());
  };

  const handleGoRoomClick = () => {
    if (roomId) gotoRoom(roomId);
  };

  const headerChildren = (
    <div className={styles.roomChatHeaderControls}>
      <AudioControlButtons
        micOn={isMyMicOn}
        speakerOn={!masterMute}
        onMicChange={() => toggleMyMic()}
        onSpeakerChange={() => toggleMasterMute()}
      />
    </div>
  );

  const participantsList = participants?.filter((p: PData) => p.userId !== myId) ?? [];

  const panelChildren = (
    <>
      <div className={styles.sectionTop}>
        <div className={styles.sectionTitleGroup}>
          <div className={styles.sectionTitle}>{roomTitleText}</div>
        </div>
        <TextButton.Outline
          iconName="open"
          text="방으로"
          size="small"
          onClick={handleGoRoomClick}
        />
      </div>
      <div className={styles.sectionAvatars}>
        {participantsList.map((p: PData) => (
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
      isUnread={isUnread}
      onMessageSubmit={handleMessageSubmit}
      headerChildren={headerChildren}
      isConnected={isConnected}
      disabled={!isJoined || !isConnected}
    >
      {panelChildren}
    </ChatPanel>
  );
}
