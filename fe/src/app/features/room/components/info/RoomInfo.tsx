'use client';

import styles from './roomInfo.module.css';
import { SecondaryChip } from '@/app/components/shared/chip/Chip';
import { GhostIconButton } from '@/app/components/shared/icon/IconButton';
import Icon from '@/app/components/shared/icon/Icon';
import { RoomInfoProps } from '@/app/features/room/components/type';

export default function RoomInfo({
  title,
  tags,
  isHost,
  isMicAvailable,
  isPrivate,
  onEditClick,
}: RoomInfoProps) {
  const hasTags = tags.length > 0;
  return (
    <div className={styles.roomInfo}>
      <div className={styles.info}>
        <div className={styles.content}>
          <div className={styles.leftSection}>
            <Icon name={isMicAvailable ? 'voice' : 'message'} size="medium" />
            <div className={styles.titleContainer}>
              <h2 className={styles.title}>{title}</h2>
              {isPrivate && <Icon name="lock" size="medium" />}
            </div>
          </div>
        </div>
        {hasTags && (
          <div className={styles.tags}>
            {tags.map((tag) => (
              <SecondaryChip key={tag} label={`#${tag}`} size="medium" />
            ))}
          </div>
        )}
      </div>
      {isHost && <GhostIconButton name="pencil" size="medium" onClick={onEditClick} />}
    </div>
  );
}
