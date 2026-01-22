'use client';

import HostBadge from '@/app/components/shared/badge/HostBadge';
import * as Chip from '@/app/components/shared/chip/Chip';
import styles from './readyStatusCard.module.css';
import { ProfileRow } from '@/app/components/shared/profile/Profile';
import CSSUtil from '@/utils/css';
import { MyReadyStatusCardProps } from '@/app/features/room/components/type';

export default function MyReadyStatusCard({
  nickname,
  profileImage,
  isHost,
  isReady,
}: MyReadyStatusCardProps) {
  const className = CSSUtil.buildCls(
    styles.myCard,
    isHost && styles.isHost,
    !isHost && isReady && styles.ready,
  );

  const readyChip = <Chip.SuccessPrimary label="READY" size="small" />;
  const waitChip = <Chip.Default label="대기 중" size="small" />;

  return (
    <div className={className}>
      <div className={styles.header}>
        <div className={styles.profile}>
          <ProfileRow nickname={nickname} profileImage={profileImage} />
        </div>
        {isHost && <HostBadge />}
        <Chip.Primary label="나" size="small" />
      </div>
      {!isHost && (isReady ? readyChip : waitChip)}
    </div>
  );
}
