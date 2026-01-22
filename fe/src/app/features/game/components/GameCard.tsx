'use client';

import styles from './gameCard.module.css';
import Icon from '@/app/components/shared/icon/Icon';
import { PrimaryTextButton } from '@/app/components/shared/button/TextButton';
import { SecondaryChip } from '@/app/components/shared/chip/Chip';
import Image from 'next/image';
import Paths from '@/app/shared/path';
import { GameCardProps } from '@/app/features/game/components/type';
import CSSUtil from '@/utils/css';

export function EmptyGameCard() {
  const className = CSSUtil.buildCls(styles.card, styles.muted);

  return (
    <article className={className}>
      <div className={styles.hero}>
        <Icon name="clock" size="large" />
      </div>
      <div className={styles.info}>
        <div className={styles.meta} />
        <div className={styles.text}>
          <h3 className={styles.titleMuted}>Coming Soon</h3>
          <p className={styles.descriptionMuted}>새로운 게임이 곧 업데이트 됩니다.</p>
        </div>
      </div>
      <PrimaryTextButton text="게임 선택" size="medium" iconName="play" disabled />
    </article>
  );
}

export default function GameCard(game?: GameCardProps) {
  if (!game) return <EmptyGameCard />;

  const { id, title, description, type, minPlayers, maxPlayers, onSelect } = game;

  const typeLabel = type === 'cooperation' ? '협력' : '경쟁';
  const participantsLabel = `${minPlayers}-${maxPlayers}명`;

  return (
    <article className={styles.card}>
      <div className={styles.hero}>
        <Image
          src={Paths.games(id, 'thumbnail')}
          alt={`${title} 게임 이미지`}
          width={100}
          height={100}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.meta}>
          <SecondaryChip label={typeLabel} size="medium" />
          <span className={styles.participants}>
            <Icon name="group" size="small" />
            {participantsLabel}
          </span>
        </div>
        <div className={styles.text}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
      <PrimaryTextButton
        text="게임 선택"
        size="medium"
        iconName="play"
        onClick={() => onSelect?.(id)}
      />
    </article>
  );
}
