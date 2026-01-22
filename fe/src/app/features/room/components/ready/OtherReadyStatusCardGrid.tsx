'use client';

import { GamePlayerData } from '@/app/features/game/dtos/data';
import OtherReadyStatusCard, { EmptyOtherReadyStatusCard } from './OtherReadyStatusCard';
import styles from './readyStatusCard.module.css';

interface OtherReadyStatusCardGridProps {
  players?: GamePlayerData[];
}

const TOTAL_SLOTS = 9;

export default function OtherReadyStatusCardGrid({ players = [] }: OtherReadyStatusCardGridProps) {
  const slots = [
    ...players.slice(0, TOTAL_SLOTS),
    ...Array(Math.max(0, TOTAL_SLOTS - players.length)).fill(null),
  ].slice(0, TOTAL_SLOTS);

  return (
    <div className={styles.otherGrid}>
      {slots.map((player, index) =>
        !player ? (
          <EmptyOtherReadyStatusCard key={`empty-ready-${index}`} />
        ) : (
          <OtherReadyStatusCard key={`other-ready-${player.nickname + index}`} {...player} />
        ),
      )}
    </div>
  );
}
