'use client';

import Dropdown from '@/app/components/shared/dropdown/Dropdown';
import { DropdownProps } from '@/app/components/shared/dropdown/type';
import GAMES from '@/app/shared/constant';
import styles from './gameDropdown.module.css';

const gameItems = GAMES.values().map((game) => ({ value: game.ID, label: game.TITLE }));

type BaseProps = Omit<DropdownProps, 'items'>;

export default function GameDropdown(props: BaseProps) {
  return (
    <div className={styles.gameDropdown}>
      <Dropdown items={gameItems} {...props} />
    </div>
  );
}
