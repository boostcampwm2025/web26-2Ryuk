'use client';

import styles from './chat.module.css';
import { SecondaryChip } from '@/app/components/shared/chip/Chip';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import { ParticipantData } from '@/app/features/room/dtos/data';
import { useEffect, useMemo, useState } from 'react';
import { AuthStore, authStore } from '@/app/features/user/stores/auth';
import VoiceParticipantCard from './VoiceParticipantCard';

export default function RoomVoiceChat() {
  const [isHydrated, setIsHydrated] = useState(
    authStore.persist.hasHydrated() && roomStore.persist.hasHydrated(),
  );
  const myId = authStore((state: AuthStore) => state.userId);
  const me = authStore((state: AuthStore) => state.user);
  const roomData = roomStore((state: RoomStore) => state.roomData);
  const currentParticipants = roomData?.currentParticipants;
  const maxParticipants = roomData?.maxParticipants;
  const participants =
    roomData?.participants?.filter((p: ParticipantData) => p.userId !== myId) ?? [];
  const showChip = currentParticipants || maxParticipants;
  const participantIds = useMemo(
    () => participants.map((p: ParticipantData) => p.userId).join(','),
    [participants],
  );

  useEffect(() => {
    // TODO: mount/refresh 시 BE 에서 ParticipantDetailData (mic/audio/speaking/role) 로드
    // TODO: WebRTC presence 와 연동, store 최신 상태 유지
  }, [participantIds]);

  useEffect(() => {
    if (isHydrated) return;
    const handleHydrated = () => {
      const hasHydrated = authStore.persist.hasHydrated() && roomStore.persist.hasHydrated();
      if (hasHydrated) setIsHydrated(true);
    };

    handleHydrated();
    const unsubAuth = authStore.persist.onFinishHydration(handleHydrated);
    const unsubRoom = roomStore.persist.onFinishHydration(handleHydrated);
    return () => {
      unsubAuth?.();
      unsubRoom?.();
    };
  }, [isHydrated]);

  if (!isHydrated) {
    return (
      <div className={styles.roomVoiceChat}>
        <div className={styles.header}>
          <h3 className={styles.title}>참여자 목록</h3>
        </div>
        <div className={styles.content}>
          <div className={styles.emptyState}>참여자 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

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
        <div className={styles.participantsList}>
          {me && (
            <VoiceParticipantCard
              key="me"
              nickname={me.nickname}
              profileImage={me.profileImage}
              isMe
              // TODO:
              active={false}
              isHost={roomData?.hostId === me.id}
            />
          )}
          {participants.map((p: ParticipantData) => (
            <VoiceParticipantCard
              key={p.userId}
              nickname={p.nickname}
              profileImage={p.profileImage}
              // TODO:
              active={false}
              isMe={false}
              isHost={roomData?.hostId === p.userId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
