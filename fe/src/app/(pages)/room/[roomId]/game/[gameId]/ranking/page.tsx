'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';
import { RankingPodiumRow } from '@/app/features/game/components/podium/RankingPodium';
import RankingTable from '@/app/features/game/components/ranking/RankingTable';
import { RankingPageTitleSection } from '@/app/components/layout/pageTitleSection/PageTitleSection';
import type { GamePlayerResultItemData } from '@/app/features/game/dtos/data';
import { RankingViewType } from '@/app/components/layout/pageTitleSection/type';
import { rankingStore } from '@/app/features/game/stores/ranking';
import { authStore } from '@/app/features/user/stores/auth';
import { loadingStore } from '@/app/features/loading/stores/loading';
import GoBackButton from '@/app/components/shared/button/GoBackButton';
import useNavigation from '@/app/hooks/useNavigation';
import { useParams } from 'next/navigation';
import { roomStore } from '@/app/features/room/stores/room';
import { modalStore } from '@/app/components/shared/modal/modal.store';
import { gameRecordService } from '@/app/features/game/services/GameRecordService';
import { GameRecordConverter } from '@/app/features/gameRecords/dtos/converter';
import PageIndicator from '@/app/components/shared/pageIndicator/PageIndicator';

export default function GameRankingPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const gameId = params.gameId as string;
  const { gotoRoomReplace, refresh } = useNavigation();

  const [view, setView] = useState<RankingViewType>('group');
  const myId = authStore((s) => s.userId);
  const storedResult = rankingStore((state) => state.result);
  const { show, hide } = loadingStore();
  const players = storedResult?.results;
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const nickname = authStore((state) => state.user?.nickname);
  const [allPage, setAllPage] = useState(1);
  const [allTotal, setAllTotal] = useState(0);
  const [allRankings, setAllRankings] = useState<GamePlayerResultItemData[]>([]);
  const [allPodium, setAllPodium] = useState<GamePlayerResultItemData[]>([]);
  const requestIdRef = useRef(0);
  const LIMIT = 10;

  const highlightRow = (row: GamePlayerResultItemData) => row.playerId === myId;

  const handleGoBackClick = () => {
    if (!roomId) return;
    roomStore.getState().updateRoom({ isGameRecruiting: false });
    modalStore.getState().closeModal('game-ready');
    gotoRoomReplace(roomId);
    refresh();
  };

  const handleChangeViewType = (type: RankingViewType) => {
    setView(type);
    if (type === 'all') setAllPage(1);
  };

  const loadAllRankings = useCallback(
    async (page?: number) => {
      if (!gameId) return;
      const requestId = ++requestIdRef.current;
      show();

      const dto = await gameRecordService.getGameRecords(gameId, nickname, page, LIMIT);
      if (requestIdRef.current !== requestId) return;
      const data = GameRecordConverter.toGameRecordListData(dto);
      setAllTotal(data.total);
      setAllPage(data.page);
      setAllRankings(data.rankings);
      setAllPodium(data.podium);

      hide();
    },
    [gameId, hide, nickname, show],
  );

  useEffect(() => {
    if (view === 'all') {
      const pageParam = isAuthenticated ? undefined : 1;
      loadAllRankings(pageParam);
    }
  }, [view, isAuthenticated, loadAllRankings]);

  const maxPage = useMemo(() => Math.max(1, Math.ceil(allTotal / LIMIT)), [allTotal, LIMIT]);

  useEffect(() => {
    if (players) hide();
    else show();
  }, [players, show, hide]);

  const handlePageSelect = (selectedPage: number) => {
    const normalized = Math.min(Math.max(selectedPage, 1), maxPage);
    setAllPage(normalized);
    loadAllRankings(normalized);
  };

  const displayPodium = view === 'group' ? (players ?? []) : allPodium;

  return (
    <div className="content">
      <div className={styles.content}>
        <div className={styles.backButton}>
          <GoBackButton onClick={handleGoBackClick} />
        </div>
        <RankingPageTitleSection
          view={view}
          selectedGameId={gameId}
          onChange={handleChangeViewType}
          dropdownDisabled
        />
        <div className={styles.podiumWrapper}>
          <RankingPodiumRow players={displayPodium} />
        </div>
        <div className={styles.tableWrapper}>
          {view === 'group' && <RankingTable data={players ?? []} highlightRow={highlightRow} />}
          {view === 'all' && (
            <>
              <RankingTable data={allRankings} highlightRow={highlightRow} />
              <div className={styles.pagination}>
                <PageIndicator page={allPage} maxPage={maxPage} onPageSelect={handlePageSelect} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
