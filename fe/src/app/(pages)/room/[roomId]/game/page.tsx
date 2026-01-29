'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import GoBackButton from '@/app/components/shared/button/GoBackButton';
import GameCardGrid from '@/app/features/game/components/GameCardGrid';
import { GameListPageTitleSection } from '@/app/components/layout/pageTitleSection/PageTitleSection';
import useNavigation from '@/app/hooks/useNavigation';
import { useRoom } from '@/app/features/room/hooks/room';
import { loadingStore } from '@/app/features/loading/stores/loading';
import { gameService } from '@/app/features/game/services/GameService';
import type { GameData } from '@/app/features/game/dtos/data';

export default function GameListPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { game } = useRoom(roomId);
  const { handleGameSelect } = game;
  const { gotoRoomReplace } = useNavigation();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [games, setGames] = useState<GameData[]>([]);
  const { show, hide } = loadingStore();

  useEffect(() => {
    let alive = true;

    (async () => {
      show();
      const response = await gameService.getGameList();
      if (alive) setGames(response.games);
    })().then(hide);

    return () => {
      alive = false;
    };
  }, [show, hide]);

  const filteredGames = useMemo<GameData[]>(() => {
    if (!searchKeyword) return games;
    const normalized = searchKeyword.trim().toLowerCase();
    if (!normalized) return games;
    return games.filter((gameItem) => gameItem.title.toLowerCase().includes(normalized));
  }, [games, searchKeyword]);

  const handleSearch = (keyword?: string) => {
    setSearchKeyword(keyword ?? '');
  };

  const handleGameSelectCard = (gameId: string) => {
    const select = handleGameSelect;
    if (!roomId || !select) return;
    select(gameId);
    gotoRoomReplace(roomId);
  };

  return (
    <div className="content">
      <div className={styles.content}>
        <div className={styles.backButton}>
          <GoBackButton onClick={() => gotoRoomReplace(roomId)} />
        </div>
        <GameListPageTitleSection onSearch={handleSearch} />
        <div className={styles.gridWrapper}>
          <GameCardGrid
            games={filteredGames}
            viewRows={2}
            viewColumns={4}
            onSelect={handleGameSelectCard}
          />
        </div>
      </div>
    </div>
  );
}
