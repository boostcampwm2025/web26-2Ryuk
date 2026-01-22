'use client';

import CSSUtil from '@/utils/css';
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
  isConnected,
}: RoomInfoProps) {
  const hasTags = tags.length > 0;
  const showStatus = isConnected !== undefined;
  return (
    <div className={styles.roomInfo}>
      <div className={styles.info}>
        <div className={styles.content}>
          <div className={styles.leftSection}>
            <Icon name={isMicAvailable ? 'voice' : 'message'} size="medium" />
            <div className={styles.titleContainer}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>{title}</h2>
                {isPrivate && <Icon name="lock" size="medium" />}
              </div>
              {showStatus && (
                <div
                  className={CSSUtil.buildCls(
                    styles.status,
                    isConnected ? styles.connected : styles.disconnected,
                  )}
                >
                  <span className={styles.onlineDot} />
                  <span className={!isConnected ? styles.connectionStatus : undefined}>
                    {isConnected ? '연결됨' : '연결 중...'}
                  </span>
                </div>
              )}
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
      <div>{isHost && <GhostIconButton name="pencil" size="medium" onClick={onEditClick} />}</div>
    </div>
  );
}
