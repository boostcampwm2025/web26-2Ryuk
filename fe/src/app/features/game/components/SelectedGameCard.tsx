'use client';

import Image from 'next/image';
import styles from './selectedGameCard.module.css';
import { PrimaryChip } from '@/app/components/shared/chip/Chip';
import Icon from '@/app/components/shared/icon/Icon';
import Paths from '@/app/shared/path';
import { GameData } from '@/app/features/game/dtos/data';
import GameSelectionButton from './GameSelectionButton';
import { SecondaryChipButton } from '@/app/components/shared/chip/ChipButton';

export interface SelectedGameCardProps {
  game?: GameData;
  onChange?: () => void;
  isHost?: boolean;
}

export default function SelectedGameCard({ game, onChange, isHost }: SelectedGameCardProps) {
  if (!game) return <GameSelectionButton disabled={!isHost} onChange={onChange} />;

  const typeLabel = game.type === 'cooperation' ? '협력' : '경쟁';
  const participantsLabel = `${game.minPlayers}-${game.maxPlayers}명`;

  return (
    <article className={styles.card} aria-label="선택된 게임">
      <div className={styles.hero}>
        <Image
          src={Paths.games(game.id, 'thumbnail')}
          alt={`${game.title} 이미지`}
          width={64}
          height={64}
          className={styles.image}
          priority
        />
      </div>
      <div className={styles.body}>
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{game.title}</h3>
            <PrimaryChip label={typeLabel} size="small" />
          </div>
          <p className={styles.description}>{game.description}</p>
        </div>
        <div className={styles.actions}>
          {!isHost ? (
            <div />
          ) : (
            <SecondaryChipButton label="변경" icon="refresh" size="small" onClick={onChange} />
          )}
          <span className={styles.participants}>
            <Icon name="group" size="small" />
            {participantsLabel}
          </span>
        </div>
      </div>
    </article>
  );
}
