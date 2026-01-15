'use client';

import styles from './chat.module.css';
import { SecondaryChip } from '@/app/components/shared/chip/Chip';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import Avatar from '@/app/components/shared/profile/Avatar';

export default function RoomVoiceChat() {
  const roomData = roomStore((state: RoomStore) => state.roomData);
  const currentParticipants = roomData?.currentParticipants;
  const maxParticipants = roomData?.maxParticipants;
  const participants = roomData?.participants || [];
  const showChip = currentParticipants || maxParticipants;

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
        {participants.length === 0 ? (
          <div className={styles.emptyState}>참여자가 없습니다.</div>
        ) : (
          <div className={styles.participantsList}>
            {participants.map((participant) => (
              <div key={participant.userId} className={styles.participantItem}>
                <Avatar profileImage={participant.profileImage} />
                <span className={styles.nickname}>{participant.nickname}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
