'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './rankingSection.module.css';
import * as IconCircle from '@/app/components/shared/icon/IconCircle';
import * as IconButton from '@/app/components/shared/icon/IconButton';
import GameDropdown from '@/app/features/game/components/GameDropdown';
import { RankingPodiumColumn } from '@/app/features/game/components/podium/RankingPodium';
import GAMES from '@/app/shared/constant';
import { gameRecordService } from '@/app/features/game/services/GameRecordService';
import { GameRecordConverter } from '@/app/features/gameRecords/dtos/converter';
import { GamePlayerResultItemData } from '@/app/features/game/dtos/data';
import { GameRecordListData } from '../dtos/data';
import useNavigation from '@/app/hooks/useNavigation';

const defaultGameId = GAMES.BEAKER.ID;
const gameMetaList = [GAMES.BEAKER, GAMES.REFLEX];

export default function RankingSection({ initialRanking }: { initialRanking: GameRecordListData }) {
  const [selectedGameId, setSelectedGameId] = useState(defaultGameId);
  const [podium, setPodium] = useState<GamePlayerResultItemData[]>(initialRanking.podium);
  const { gotoRanking } = useNavigation();

  const fetchPodium = async (gameId: string) => {
    const dto = await gameRecordService.getGameRecords(gameId, undefined, 1, 3);
    const data = GameRecordConverter.toGameRecordListData(dto);
    setPodium(data.podium);
  };

  useEffect(() => {
    fetchPodium(selectedGameId);
  }, [selectedGameId]);

  const selectedGameTitle = useMemo(() => {
    const entry = gameMetaList.find((game) => game.ID === selectedGameId);
    return entry?.TITLE ?? '게임 선택';
  }, [selectedGameId]);

  const handleActionClick = () => {
    gotoRanking(selectedGameId);
  };

  return (
    <div className={styles.rankingSection}>
      <div className={styles.rankingHeader}>
        <div className={styles.rankingTitle}>
          <IconCircle.Secondary name="trophy" size="medium" />
          <div className={styles.dropdownWrapper}>
            <GameDropdown
              value={selectedGameId}
              onChange={setSelectedGameId}
              placeholder={selectedGameTitle}
            />
          </div>
        </div>
        <div className={styles.rankingActions}>
          <IconButton.Ghost name="right" size="medium" onClick={handleActionClick} />
        </div>
      </div>
      <div className={styles.podiumWrapper}>
        <RankingPodiumColumn players={podium} />
      </div>
    </div>
  );
}
