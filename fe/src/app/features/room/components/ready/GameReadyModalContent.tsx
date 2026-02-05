'use client';

import styles from './gameReadyModalContent.module.css';
import * as IconCircle from '@/app/components/shared/icon/IconCircle';
import MyReadyStatusCard from './MyReadyStatusCard';
import OtherReadyStatusCardGrid from './OtherReadyStatusCardGrid';
import SelectedGameCard from '@/app/features/game/components/SelectedGameCard';
import { GameData, GamePlayerData } from '@/app/features/game/dtos/data';
import * as TextButton from '@/app/components/shared/button/TextButton';
import { useEffect, useState } from 'react';

interface GameReadyModalContentProps {
  myStatus: GamePlayerData;
  players: GamePlayerData[];
  selectedGame?: GameData;
  maxPlayers?: number;
  onChangeGame?: () => void;
  onReadyChange?: (value: boolean) => void;
  onStart?: () => void;
}

export default function GameReadyModalContent({
  myStatus,
  players,
  maxPlayers,
  selectedGame,
  onChangeGame,
  onReadyChange,
  onStart,
}: GameReadyModalContentProps) {
  const currentPlayers = players.length + 1;
  const title = myStatus.isHost ? '게임 참가자 모집 중' : '게임에 참가하시겠어요?';
  const [isStartButtonClicked, setIsStartButtonClicked] = useState(false);

  // 게임이 변경되면 시작 버튼 클릭 상태 리셋
  useEffect(() => {
    setIsStartButtonClicked(false);
  }, [selectedGame]);

  const gridPlayers = players.filter((p) => p.playerId !== myStatus.playerId);

  const handleStartButtonClick = () => {
    setIsStartButtonClicked(true);
    onStart?.();
  };

  const handleReadyChange = (isReady: boolean) => {
    if (myStatus.isHost) return;
    onReadyChange?.(isReady);
  };

  // 게임 시작 버튼 활성화 조건
  const allPlayers = [myStatus, ...players];
  const readyPlayers = allPlayers.filter((p) => p.isReady);
  const readyCount = readyPlayers.length;
  const isGameStartEnabled =
    selectedGame !== undefined &&
    readyCount >= selectedGame.minPlayers &&
    readyCount <= selectedGame.maxPlayers;

  return (
    <div className={styles.modal}>
      <div className={styles.header}>
        <IconCircle.Secondary name="game" size="medium" />
        <div className={styles.text}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>
            참가자 현황 ({currentPlayers}/{maxPlayers})
          </p>
        </div>
      </div>
      <div className={styles.section}>
        <MyReadyStatusCard {...myStatus} />
      </div>
      <div className={styles.section}>
        <OtherReadyStatusCardGrid players={gridPlayers} />
      </div>
      <div className={styles.section}>
        <SelectedGameCard game={selectedGame} isHost={myStatus.isHost} onChange={onChangeGame} />
      </div>
      <div className={styles.footer}>
        {myStatus.isHost && (
          <TextButton.Primary
            text="게임 시작"
            iconName="play"
            size="medium"
            onClick={handleStartButtonClick}
            disabled={!isGameStartEnabled || isStartButtonClicked}
          />
        )}
        {!myStatus.isHost && myStatus.isReady && (
          <TextButton.SuccessSecondary
            iconName="check"
            text="준비 완료"
            size="medium"
            onClick={() => handleReadyChange(false)}
          />
        )}
        {!myStatus.isHost && !myStatus.isReady && (
          <TextButton.SuccessPrimary
            text="준비"
            size="medium"
            onClick={() => handleReadyChange(true)}
          />
        )}
        <p className={styles.notice}>게임 참여 여부와 관계없이 음성채팅은 지속됩니다</p>
      </div>
    </div>
  );
}
