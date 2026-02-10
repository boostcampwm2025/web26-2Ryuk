'use client';

import { useEffect } from 'react';
import useResponsive from '@/app/hooks/useResponsive';
import '@/app/page.css';
import styles from './page.module.css';
import RoomInfoWithModal from '@/app/features/room/components/info/RoomInfoWithModal';
import RoomTextChat from '@/app/features/room/components/chat/RoomTextChat';
import RoomVoiceChat from '@/app/features/room/components/chat/RoomVoiceChat';
import PasswordAuthDialog from '@/app/features/room/components/PasswordAuthDialog';
import LeaveRoomButtonWithModal from '@/app/features/room/components/LeaveRoomButtonWithModal';
import DeleteRoomButtonWithModal from '@/app/features/room/components/DeleteRoomButtonWithModal';
import GameStartButton from '@/app/features/room/components/GameStartButton';
import { useParams } from 'next/navigation';
import { useRoom } from '@/app/features/room/hooks/room';
import Modal from '@/app/components/shared/modal/Modal';
import GameReadyModalContent from '@/app/features/room/components/ready/GameReadyModalContent';
import LoginOptionsModalContent from '@/app/components/layout/header/LoginOptionsModalContent';
import useNavigation from '@/app/hooks/useNavigation';
import { authStore } from '@/app/features/user/stores/auth';
import { roomStore } from '@/app/features/room/stores/room';
import { modalStore } from '@/app/components/shared/modal/modal.store';

export default function RoomContent() {
  const params = useParams();
  const roomId = params.roomId as string;

  const myId = authStore((s) => s.id);
  const { status } = useResponsive();

  const { entry, game } = useRoom(roomId);
  const storedHostId = roomStore((state) => state.hostId);
  const storedTitle = roomStore((state) => state.title);
  const storedTags = roomStore((state) => state.tags);
  const storedIsMicAvailable = roomStore((state) => state.isMicAvailable);
  const storedIsPrivate = roomStore((state) => state.isPrivate);
  const storedMaxParticipants = roomStore((state) => state.maxParticipants);

  const {
    isGameRecruiting,
    myStatus,
    gamePlayers,
    selectedGame,
    handleGameRecruit,
    handleGameJoin,
    handleReadyChange,
    handleLeaveGame,
    handleCloseGame,
    handleGameStartButtonClick,
  } = game;

  const { goHome, gotoRoomGameList } = useNavigation();

  const isHost = storedHostId === myId;
  const isGameButtonEnabled = isHost || isGameRecruiting;

  const ROOM_LOGIN_MODAL_ID = 'room-login-required';
  useEffect(() => {
    if (entry.status === 'need-login') {
      modalStore.getState().openModal(ROOM_LOGIN_MODAL_ID);
    }
  }, [entry.status]);

  return (
    <>
      {isHost ? <DeleteRoomButtonWithModal /> : <LeaveRoomButtonWithModal />}

      <div className={styles[status]}>
        <div className="content">
          <div className={styles.content}>
            <div className={styles.left}>
              <RoomInfoWithModal
                roomId={roomId}
                title={storedTitle ?? entry.joinInfo?.title}
                tags={storedTags ?? entry.joinInfo?.tags}
                isHost={isHost}
                isMicAvailable={storedIsMicAvailable ?? entry.joinInfo?.isMicAvailable}
                isPrivate={storedIsPrivate ?? entry.joinInfo?.isPrivate}
                maxParticipants={storedMaxParticipants}
              />
              <RoomTextChat />
            </div>

            <div className={styles.right}>
              <RoomVoiceChat />
              <GameStartButton
                disabled={!isGameButtonEnabled}
                onClick={isHost ? handleGameRecruit : handleGameJoin}
              />
            </div>
          </div>
        </div>
      </div>

      <PasswordAuthDialog
        isOpen={entry.isPasswordModalOpen}
        onConfirm={entry.confirmEntryWithPassword}
        onCancel={entry.cancelPasswordEntry}
      />

      <Modal id={ROOM_LOGIN_MODAL_ID} onClose={goHome}>
        <LoginOptionsModalContent />
      </Modal>

      <Modal
        id="game-ready"
        key={roomId}
        closeOnBackdropClick={false}
        showCloseButton
        onClose={isHost ? handleCloseGame : handleLeaveGame}
      >
        <GameReadyModalContent
          myStatus={myStatus}
          players={gamePlayers}
          maxPlayers={storedMaxParticipants}
          selectedGame={selectedGame}
          onChangeGame={() => roomId && gotoRoomGameList(roomId)}
          onReadyChange={handleReadyChange}
          onStart={handleGameStartButtonClick}
        />
      </Modal>
    </>
  );
}
