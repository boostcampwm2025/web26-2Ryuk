'use client';

import styles from './room.module.css';
import { OutlineChip } from '@/app/components/shared/chip/Chip';
import StatusChip from '@/app/components/shared/chip/StatusChip';
import { SecondaryIconButton } from '@/app/components/shared/icon/IconButton';
import Avatars from '@/app/components/shared/profile/Avatars';
import { RoomCardProps } from '@/app/features/room/components/type';
import TextTooltip from '@/app/components/shared/tooltip/TextTooltip';
import Icon from '@/app/components/shared/icon/Icon';
import useNavigation from '@/app/hooks/useNavigation';
import { authStore } from '@/app/features/user/stores/auth';
import { roomStore } from '@/app/features/room/stores/room';

function RoomCard({
  id,
  title = '',
  tags = [],
  currentParticipants = 0,
  maxParticipants = 2,
  isMicAvailable = true,
  isPrivate = false,
  participants = [],
}: RoomCardProps) {
  const { goToRoom } = useNavigation();
  const remainingCount = maxParticipants - currentParticipants;
  const noRemain = remainingCount === 0;
  const isAuthenticated = authStore.getState().isAuthenticated;
  const profiles = participants.map((p) => ({
    nickname: p.nickname,
    profileImage: p.profileImage,
  }));
  const roomId = roomStore((state) => state.roomId);

  const getStatusChipStatus = (): 'success' | 'warning' | 'error' => {
    if (noRemain) return 'error'; // 풀방
    if (remainingCount === 1) return 'warning'; // 한 자리 남음
    return 'success';
  };

  const handleJoin = () => {
    if (noRemain || !isAuthenticated) return;
    goToRoom(id);
  };

  const anchorId = `room-title-${id}`;

  return (
    <div className={styles.roomCard}>
      <div className={styles.top}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <Icon name={isMicAvailable ? 'voice' : 'message'} size="medium" />
            <h3 className={styles.title} data-anchor={anchorId}>
              {title}
            </h3>
          </div>
          <TextTooltip text={title} anchorId={anchorId} />
          <StatusChip
            status={getStatusChipStatus()}
            label={`${currentParticipants}/${maxParticipants}`}
            size="small"
          />
        </div>
        <div className={styles.tagsAndIcons}>
          {tags.length > 0 && (
            <div className={styles.tags}>
              {tags.map((tag) => (
                <OutlineChip key={`key-${tag}`} label={tag} size="small" />
              ))}
            </div>
          )}
          <div className={styles.icons}>{isPrivate && <Icon name="lock" size="small" />}</div>
        </div>
      </div>
      <div className={styles.footer}>
        <Avatars profiles={profiles} />
        <SecondaryIconButton
          name="open"
          size="small"
          disabled={!isAuthenticated || (roomId === id && noRemain)}
          onClick={handleJoin}
        />
      </div>
    </div>
  );
}

export default RoomCard;
