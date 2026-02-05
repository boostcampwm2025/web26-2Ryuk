'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import PageIndicator from '@/app/components/shared/pageIndicator/PageIndicator';
import { RankingPageTitleSection } from '@/app/components/layout/pageTitleSection/PageTitleSection';
import { RankingPodiumRow } from '@/app/features/game/components/podium/RankingPodium';
import RankingTable from '@/app/features/game/components/ranking/RankingTable';
import { gameRecordService } from '@/app/features/game/services/GameRecordService';
import { GameRecordConverter } from '@/app/features/gameRecords/dtos/converter';
import type { GamePlayerResultItemData } from '@/app/features/game/dtos/data';
import GAMES from '@/app/shared/constant';
import { authStore } from '@/app/features/user/stores/auth';
import useNavigation from '@/app/hooks/useNavigation';

const GAME_META_LIST = [GAMES.BEAKER, GAMES.REFLEX];
const PAGE_LIMIT = 10;

export default function RankingPage() {
  const params = useParams();
  const routeGameId = params.gameId as string;

  const initialGameId = useMemo(() => {
    const matched = GAMES.fromId(routeGameId);
    return matched?.ID ?? GAME_META_LIST[0].ID;
  }, [routeGameId]);

  const [selectedGameId, setSelectedGameId] = useState(initialGameId);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [podium, setPodium] = useState<GamePlayerResultItemData[]>([]);
  const [rankings, setRankings] = useState<GamePlayerResultItemData[]>([]);
  const nickname = authStore((state) => state.nickname);

  const myId = authStore((state) => state.id);
  const requestIdRef = useRef(0);
  const { gotoRanking } = useNavigation();

  useEffect(() => {
    setSelectedGameId(initialGameId);
  }, [initialGameId]);

  const loadRecords = useCallback(
    async (gameId: string, page?: number) => {
      if (!gameId) return;
      const requestId = ++requestIdRef.current;

      const dto = await gameRecordService.getGameRecords(gameId, nickname, page, PAGE_LIMIT);
      if (requestIdRef.current !== requestId) return;

      const data = GameRecordConverter.toGameRecordListData(dto);
      setTotal(data.total);
      setPage(data.page);
      setPodium(data.podium);
      setRankings(data.rankings);
    },
    [nickname],
  );

  useEffect(() => {
    loadRecords(selectedGameId);
  }, [selectedGameId, loadRecords, nickname]);

  const handleGameChange = useCallback(
    (newGameId: string) => {
      if (newGameId === selectedGameId) return;
      setPage(1);
      setTotal(0);
      setPodium([]);
      setRankings([]);
      gotoRanking(newGameId);
    },
    [selectedGameId, gotoRanking],
  );

  const maxPage = useMemo(() => Math.max(1, Math.ceil(total / PAGE_LIMIT)), [total]);

  const handlePageSelect = useCallback(
    (nextPage: number) => {
      const normalized = Math.min(Math.max(nextPage, 1), maxPage);
      setPage(normalized);
      loadRecords(selectedGameId, normalized);
    },
    [loadRecords, maxPage, selectedGameId],
  );

  const highlightRow = useCallback(
    (row: GamePlayerResultItemData) => row.playerId === myId,
    [myId],
  );

  return (
    <div className={styles.wrapper}>
      <RankingPageTitleSection
        view="all"
        selectedGameId={selectedGameId}
        onDropdownChange={handleGameChange}
        radioDisabled
      />
      <div className={styles.panel}>
        <div className={styles.podiumWrapper}>
          <RankingPodiumRow players={podium} />
        </div>
        <div className={styles.tableWrapper}>
          <RankingTable data={rankings} highlightRow={highlightRow} />
        </div>
        <div className={styles.pagination}>
          <PageIndicator page={page} maxPage={maxPage} onPageSelect={handlePageSelect} />
        </div>
      </div>
    </div>
  );
}
