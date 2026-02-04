'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ChatPanel from './ChatPanel';
import styles from './chat.module.css';
import AudioControlButtons from '@/app/features/voice/components/AudioControlButtons';
import { roomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { useRoomChat } from '../hooks/useRoomChat';
import { chatPanelStore } from '@/app/features/chat/stores/chatPanel';
import * as TextButton from '@/app/components/shared/button/TextButton';
import Avatar from '@/app/components/shared/profile/Avatar';
import { authStore } from '@/app/features/user/stores/auth';
import Icon from '@/app/components/shared/icon/Icon';
import roomService from '@/app/features/room/services/RoomService';
import { RoomConverter } from '@/app/features/room/dtos/converter';
import { useVoiceChat } from '@/app/features/voice/hooks/useVoiceChat';
import useNavigation from '@/app/hooks/useNavigation';
import { RoomParticipantData as PData } from '@/app/features/room/dtos/data';
import CSSUtil from '@/utils/css';
import { TextTooltip, TooltipTrigger } from '@/app/components/shared/tooltip/TextTooltip';

export default function LocalChatPanel() {
  const myId = authStore((state) => state.id);
  const roomId = roomStore((state) => state.id);
  const roomTitle = roomStore((state) => state.title);
  const participants = roomStore((state) => state.participants);
  const currentParticipants = roomStore((state) => state.currentParticipants);
  const isJoined = Boolean(roomId);
  const { users, isMyMicOn, masterMute, toggleMyMic, toggleUserSpeaker, toggleMasterMute } =
    useVoiceChat();
  const { gotoRoom } = useNavigation();
  const roomTitleText = roomTitle || '대화방';
  const [isUnread, setIsUnread] = useState(false);
  const showPanel = chatPanelStore((state) => state.show);

  const handleToggleSpeaker = useCallback(
    (userId: string) => toggleUserSpeaker(userId),
    [toggleUserSpeaker],
  );

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
  const myNickname = authStore((state) => state.nickname);
  const myProfileImage = authStore((state) => state.profileImage);

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
        <div className={styles.selfAvatar}>
          <Avatar nickname={myNickname ?? '나'} profileImage={myProfileImage} isActive />
        </div>
        <div className={styles.avatarDivider} aria-hidden="true" />
        <div className={styles.otherAvatarGroup}>
          {participantsList.map((participant: PData) => {
            const voiceInfo = users[participant.userId];
            const isMicOff = voiceInfo?.isMicOn === false;
            const isMutedByMe = voiceInfo?.mutedByMe ?? false;
            const showMutedOverlay = Boolean(isMicOff || isMutedByMe);
            const speakerOn = voiceInfo?.isSpeakerOn ?? true;
            const overlayIconName = isMutedByMe ? 'mute' : 'micoff';

            // 프로필을 눌러 상대를 음소거 할 수 있어요
            // 상대가 마이크를 껐어요
            // 상대를 음소거 했어요
            let label = '';
            if (isMutedByMe) {
              label = '상대를 음소거 했어요';
            } else if (isMicOff) {
              label = '상대가 마이크를 껐어요';
            } else {
              label = '프로필을 눌러 상대를 음소거 할 수 있어요';
            }

            const className = CSSUtil.buildCls(
              styles.avatarWrapper,
              showMutedOverlay && styles.muted,
            );

            return (
              <>
                <TooltipTrigger dataAnchor={`${participant.userId}-tooltip`}>
                  <button
                    key={participant.userId}
                    type="button"
                    className={className}
                    data-muted={showMutedOverlay ? 'true' : 'false'}
                    onClick={() => handleToggleSpeaker(participant.userId)}
                    aria-pressed={!speakerOn}
                    aria-label={label}
                  >
                    <Avatar
                      nickname={participant.nickname}
                      profileImage={participant.profileImage}
                      isActive={voiceInfo?.isSpeaking ?? false}
                    />
                    <div className={styles.overlay}>
                      <Icon name={overlayIconName} size="medium" />
                    </div>
                  </button>
                </TooltipTrigger>
                <TextTooltip text={label} anchorId={`${participant.userId}-tooltip`} />
              </>
            );
          })}
        </div>
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
