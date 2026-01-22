'use client';

import CSSUtil from '@/utils/css';
import styles from './readyStatusCard.module.css';
import { OtherReadyStatusCardProps } from '@/app/features/room/components/type';
import * as Chip from '@/app/components/shared/chip/Chip';
import { ProfileColumn } from '@/app/components/shared/profile/Profile';
import HostBadge from '@/app/components/shared/badge/HostBadge';
import Image from 'next/image';
import Paths from '@/app/shared/path';
import Avatar from '@/app/components/shared/profile/Avatar';

export function EmptyOtherReadyStatusCard() {
  return (
    <div className={styles.empty}>
      <Avatar profileImage={Paths.images('default_profile')} />
    </div>
  );
}

export default function OtherReadyStatusCard({
  nickname,
  profileImage,
  isHost,
  isReady,
}: OtherReadyStatusCardProps) {
  const className = CSSUtil.buildCls(
    styles.otherCard,
    isHost && styles.isHost,
    !isHost && isReady && styles.ready,
  );

  const readyChip = <Chip.SuccessPrimary label="READY" size="small" />;
  const waitChip = <Chip.Default label="대기 중" size="small" />;

  return (
    <div className={className}>
      <ProfileColumn nickname={nickname} profileImage={profileImage} />
      <div className={styles.tag}>
        {isHost && <HostBadge />}
        {!isHost && (isReady ? readyChip : waitChip)}
      </div>
    </div>
  );
}
