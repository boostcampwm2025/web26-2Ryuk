'use client';

import styles from './heroSection.module.css';
import { LogoImage } from '@/app/components/sprite/logo/Logo';
import SpriteAnimation from '@/app/components/sprite/spriteAnimation/SpriteAnimation';
import Icon from '@/app/components/shared/icon/Icon';
import { PATCH_NOTE_LINK } from '@/app/shared/routes';
import Link from 'next/link';

// 빌드 시점에 next.config.mjs에서 주입된 버전
const version = process.env.APP_VERSION;

export default function HeroSection() {
  return (
    <div className={styles.heroSection}>
      <div className={styles.content}>
        <div className={styles.label}>
          <div className={styles.logo}>
            <LogoImage variant="default" size="medium" />
          </div>
          <span>MulBangool Talk</span>
        </div>

        <div className={styles.bottomSection}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>물방울톡</h1>
            <p className={styles.subtitle}>모여서 떨어진다! 물방울톡!</p>
          </div>

          <div className={styles.descriptionBox}>
            <p>다양한 게임과 함께하는 즐거운 음성 채팅!</p>
          </div>
        </div>
      </div>
      <div className={styles.imageWrapper}>
        <SpriteAnimation variant="default" size="medium" />
      </div>
      <div className={styles.patchNoteWapper}>
        <div className={styles.version}>
          <span>{version && `v${version}`}</span>
        </div>
        <Link
          className={`${styles.patchNoteButton} clickable`}
          href={PATCH_NOTE_LINK}
          target="_blank"
        >
          <Icon name="note" size="small" />
          <span>패치노트 보기</span>
        </Link>
      </div>
    </div>
  );
}
