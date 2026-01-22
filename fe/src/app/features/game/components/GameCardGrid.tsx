'use client';

import GameCard, { EmptyGameCard } from './GameCard';
import styles from './gameCardGrid.module.css';
import { GameData } from '@/app/features/game/dtos/data';
import { GameCardProps } from '@/app/features/game/components/type';
import { CSSProperties } from 'react';

interface GameCardGridProps {
  games: GameData[];
  viewRows: number;
  viewColumns: number;
  onSelect?: (id: string) => void;
}

export default function GameCardGrid({
  games,
  viewRows = 2,
  viewColumns = 4,
  onSelect,
}: GameCardGridProps) {
  const totalSlots = viewRows * viewColumns;

  const cardItems: (GameCardProps | undefined)[] = games.map((game) => ({
    id: game.id,
    title: game.title,
    description: game.description,
    type: game.type,
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    onSelect,
  }));

  if (games.length <= 7) cardItems.push(undefined);

  const visibleItems = cardItems.slice(0, totalSlots);
  const gridStyle = {
    '--grid-columns-count': viewColumns.toString(),
  } as CSSProperties;

  return (
    <div className={styles.grid} style={gridStyle}>
      {visibleItems.map((item, idx) => (
        <div key={idx} className={styles.cell}>
          {item ? <GameCard {...item} /> : <EmptyGameCard />}
        </div>
      ))}
    </div>
  );
}
