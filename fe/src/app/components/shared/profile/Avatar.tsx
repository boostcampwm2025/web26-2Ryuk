'use client';

import styles from './avatar.module.css';
import Paths from '@/app/shared/path';
import Image from 'next/image';
import { AvatarProps } from './type';
import CSSUtil from '@/utils/css';
import { useCallback } from 'react';

const DEFAULT_AVATAR = Paths.images('default_profile');
const DEFAULT_THEMES = ['primary', 'secondary', 'success', 'warning'];

export default function Avatar({ nickname, profileImage, isActive, onClick }: AvatarProps) {
  const getThemeIndex = useCallback((nickname?: string) => {
    if (!nickname) return 0;

    // FNV offset basis
    let hash = 2166136261;

    for (let i = 0; i < nickname.length; i++) {
      hash ^= nickname.charCodeAt(i);
      hash = Math.imul(hash, 16777619); // FNV prime
    }

    hash += hash << 13;
    hash ^= hash >>> 7;
    hash += hash << 3;
    hash ^= hash >>> 17;
    hash += hash << 5;

    return Math.abs(hash) % DEFAULT_THEMES.length;
  }, []);

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
