'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import GameResultPodium from '@/app/features/game/components/podium/GameResultPodium';
import RankingTable from '@/app/features/game/components/ranking/RankingTable';
import { RankingPageTitleSection } from '@/app/components/layout/pageTitleSection/PageTitleSection';
import type { GamePlayerResultItemData } from '@/app/features/game/dtos/data';
import { RankingViewType } from '@/app/components/layout/pageTitleSection/type';
import { rankingStore } from '@/app/features/game/stores/ranking';
import { authStore } from '@/app/features/user/stores/auth';
import { loadingStore } from '@/app/features/loading/stores/loading';
import GoBackButton from '@/app/components/shared/button/GoBackButton';
import { gotoRoomReplace } from '@/app/hooks/useNavigation';
import { useParams } from 'next/navigation';
import { roomStore } from '@/app/features/room/stores/room';
import { gameRecordService } from '@/app/features/game/services/GameRecordService';
import { GameRecordConverter } from '@/app/features/gameRecords/dtos/converter';

export default function GameRankingPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const gameId = params.gameId as string;

  const [view, setView] = useState<RankingViewType>('group');
  const myId = authStore((s) => s.userId);
  const storedResult = rankingStore((state) => state.result);
  const { show, hide } = loadingStore();
  const players = storedResult?.results;
  const [recordPage, setRecordPage] = useState(1);
  const [recordRows, setRecordRows] = useState<GamePlayerResultItemData[]>([]);

  const highlightRow = (row: GamePlayerResultItemData) => row.playerId === myId;
  const setRoomIsGameRecruiting = roomStore((s) => s.setIsGameRecruiting);

  const handleGoBackClick = () => {
    if (!roomId) return;
    setRoomIsGameRecruiting(false);
    gotoRoomReplace(roomId);
  };

  const handleChangeViewType = (type: RankingViewType) => {
    setView(type);
    if (type === 'all') setRecordPage(1);
  };

  const fetchAllRankings = async (page: number) => {
    if (!gameId) return;
    const dto = await gameRecordService.getGameRecords(gameId, page);
    const data = GameRecordConverter.toGameRecordListData(dto);
    setRecordRows(data.rankings);
  };

  useEffect(() => {
    if (view === 'all') fetchAllRankings(recordPage);
  }, [view, gameId, recordPage]);

  useEffect(() => {
    if (players) hide();
    else show();
  }, [players, show, hide]);

  return (
    <div className="content">
      <div className={styles.content}>
        <div className={styles.backButton}>
          <GoBackButton onClick={handleGoBackClick} />
        </div>
        <RankingPageTitleSection view={view} onChange={handleChangeViewType} />
        <div className={styles.podiumWarpper}>
          <GameResultPodium players={players ?? []} />
        </div>
        <div className={styles.tableWrapper}>
          {view === 'group' && <RankingTable data={players ?? []} highlightRow={highlightRow} />}
          {view === 'all' && <RankingTable data={recordRows ?? []} highlightRow={highlightRow} />}
        </div>
      </div>
    </div>
  );
}
