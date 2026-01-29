'use client';

import CSSUtil from '@/utils/css';
import Avatar from './Avatar';
import styles from './profile.module.css';
import { ProfileProps } from './type';

function Profile({ nickname, profileImage, variant }: ProfileProps) {
  const className = CSSUtil.buildCls(styles.profile, styles[variant]);
  // nickname이 없거나 빈 문자열이면 렌더링하지 않음
  if (!nickname || nickname.trim() === '') return null;

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
