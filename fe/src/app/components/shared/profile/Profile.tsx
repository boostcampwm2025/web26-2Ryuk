'use client';

import CSSUtil from '@/utils/css';
import Avatar from './Avatar';
import styles from './profile.module.css';
import { ProfileProps, type ProfileVariant } from './type';

function Profile({ nickname, profileImage, variant }: ProfileProps) {
  const className = CSSUtil.buildCls(styles.profile, styles[variant]);
  return (
    <div className={className}>
      <Avatar nickname={nickname} profileImage={profileImage} />
      <span className={styles.nickname}>{nickname}</span>
    </div>
  );
}

export function ProfileRow({ nickname, profileImage }: Omit<ProfileProps, 'variant'>) {
  return <Profile nickname={nickname} profileImage={profileImage} variant="row" />;
}

export function ProfileColumn({ nickname, profileImage }: Omit<ProfileProps, 'variant'>) {
  return <Profile nickname={nickname} profileImage={profileImage} variant="column" />;
}
