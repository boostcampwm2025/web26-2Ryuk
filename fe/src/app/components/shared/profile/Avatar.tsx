'use client';

import styles from './avatar.module.css';
import Paths from '@/app/shared/path';
import Image from 'next/image';
import { AvatarProps } from './type';
import CSSUtil from '@/utils/css';

const DEFAULT_AVATAR = Paths.images('default_profile');
const DEFAULT_THEMES = ['primary', 'secondary', 'success', 'warning'];

function getThemeIndex(nickname?: string) {
  if (!nickname) return 0;
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = (hash * 31 + nickname.charCodeAt(i)) >>> 0;
  }
  return hash % DEFAULT_THEMES.length;
}

export default function Avatar({ nickname, profileImage, isActive, onClick }: AvatarProps) {
  const index = getThemeIndex(nickname);

  const className = CSSUtil.buildCls(
    styles.avatar,
    isActive && styles.active,
    styles[DEFAULT_THEMES[index]],
  );
  const src = profileImage || DEFAULT_AVATAR;
  const char = nickname?.slice(0, 1) ?? '';

  return (
    <div className={className} onClick={onClick}>
      {profileImage ? (
        <Image
          src={src}
          alt="avatar"
          width={32}
          height={32}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== DEFAULT_AVATAR) target.src = DEFAULT_AVATAR;
          }}
        />
      ) : (
        <div className={styles.nickname}>{char}</div>
      )}
    </div>
  );
}
