'use client';

import { SecondaryChip } from '@/app/components/shared/chip/Chip';
import { RoomParticipantData as PData } from '@/app/features/room/dtos/data';
import { roomStore } from '@/app/features/room/stores/room';
import { AuthStore, authStore } from '@/app/features/user/stores/auth';
import { useVoiceChat } from '@/app/features/voice/hooks/useVoiceChat';
import { useEffect, useMemo, useState } from 'react';
import styles from './chat.module.css';
import VoiceParticipantCard from './VoiceParticipantCard';

export default function RoomVoiceChat() {
  const [isHydrated, setIsHydrated] = useState(false);

  const myId = authStore((state: AuthStore) => state.userId);
  const me = authStore((state: AuthStore) => state.user);
  const hostId = roomStore((s) => s.hostId);
  const roomParticipants = roomStore((s) => s.participants);
  const currentParticipants = roomStore((s) => s.currentParticipants);
  const maxParticipants = roomStore((s) => s.maxParticipants);
  const isMicAvailable = roomStore((s) => s.isMicAvailable ?? true);

  // 1. participants를 useMemo로 정의 (나를 제외한 목록)
  const participants = useMemo(() => {
    return roomParticipants?.filter((p: PData) => p.userId !== myId) ?? [];
  }, [roomParticipants, myId]);

  // 2. 위에서 메모이제이션된 participants를 사용하여 ID 문자열 생성
  const participantIds = useMemo(() => {
    return participants.map((p) => p.userId).join(',');
  }, [participants]);

  const showChip = currentParticipants || maxParticipants;
  const {
    users,
    isMyMicOn,
    masterMute, // 전체 음소거
    toggleMyMic,
    toggleUserSpeaker,
    setUserVolume,
    toggleMasterMute,
  } = useVoiceChat();
  const voiceControlsDisabled = !isMicAvailable;

  useEffect(() => {
    // mount/refresh 시 필요한 로직
  }, [participantIds]);

  useEffect(() => {
    if (isHydrated) return;

    const handleHydrated = () => {
      // persist 객체가 있는지 확인 후 호출
      const authReady = authStore.persist?.hasHydrated?.() ?? false;
      const roomReady = roomStore.persist?.hasHydrated?.() ?? false;

      if (authReady && roomReady) setIsHydrated(true);
    };

    handleHydrated();

    // 리스너 등록 시에도 옵셔널 체이닝 필수
    const unsubAuth = authStore.persist?.onFinishHydration?.(handleHydrated);
    const unsubRoom = roomStore.persist?.onFinishHydration?.(handleHydrated);

    return () => {
      unsubAuth?.();
      unsubRoom?.();
    };
  }, [isHydrated]);

  return (
    <div className={styles.roomVoiceChat}>
      <div className={styles.header}>
        <h3 className={styles.title}>참여자 목록</h3>
        <div className={styles.headerRight}>
          {showChip && (
            <SecondaryChip label={`${currentParticipants}/${maxParticipants}`} size="medium" />
          )}
        </div>
      </div>
      <div className={styles.content}>
        {!isHydrated ? (
          <div className={styles.emptyState}>참여자 정보를 불러오는 중...</div>
        ) : (
          <div className={styles.participantsList}>
            {me && (
              <VoiceParticipantCard
                userId={me.id}
                key="me"
                nickname={me.nickname}
                profileImage={me.profileImage}
                isMe
                micOn={isMyMicOn}
                speakerOn={!masterMute}
                onSpeakerChange={toggleMasterMute}
                onMicChange={toggleMyMic}
                active={myId ? (users[myId]?.isSpeaking ?? false) : false}
                isHost={hostId === me.id}
                disabled={voiceControlsDisabled}
              />
            )}
            {participants.map((p: PData) => {
              const voiceInfo = users[p.userId];
              const userVolume = voiceInfo?.volume ?? 0.5;

              return (
                <div key={p.userId}>
                  <VoiceParticipantCard
                    userId={p.userId}
                    nickname={p.nickname}
                    profileImage={p.profileImage}
                    micOn={voiceInfo?.isMicOn ?? false}
                    speakerOn={voiceInfo?.isSpeakerOn ?? true}
                    volume={userVolume}
                    onSliderChange={(val) => setUserVolume(p.userId, val)}
                    onSpeakerChange={() => toggleUserSpeaker(p.userId)}
                    active={voiceInfo?.isSpeaking ?? false}
                    mutedByMe={voiceInfo?.mutedByMe ?? false}
                    connected={Boolean(voiceInfo)}
                    isHost={hostId === p.userId}
                    disabled={voiceControlsDisabled}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
