'use client';

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
import useNavigation from '@/app/hooks/useNavigation';
import { authStore } from '@/app/features/user/stores/auth';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const userId = authStore((s) => s.userId);
  const { status } = useResponsive();

  const {
    roomData,
    roomJoinInfoData,
    showPasswordAuth,
    handlePasswordConfirm,
    handlePasswordCancel,
    game,
  } = useRoom(roomId);

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

  const { gotoRoomGameList } = useNavigation();

  const isHost = roomData?.hostId === userId;
  const isGameButtonEnabled = isHost || isGameRecruiting;

  return (
    <>
      {isHost ? <DeleteRoomButtonWithModal /> : <LeaveRoomButtonWithModal />}

      <div className={styles[status]}>
        <div className="content">
          <div className={styles.content}>
            <div className={styles.left}>
              <RoomInfoWithModal
                roomId={roomId}
                title={roomData?.title ?? roomJoinInfoData?.title}
                tags={roomData?.tags ?? roomJoinInfoData?.tags}
                isHost={isHost}
                isMicAvailable={roomData?.isMicAvailable ?? roomJoinInfoData?.isMicAvailable}
                isPrivate={roomData?.isPrivate ?? roomJoinInfoData?.isPrivate}
                maxParticipants={roomData?.maxParticipants}
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
        isOpen={showPasswordAuth}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
      />

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
          maxPlayers={roomData?.maxParticipants}
          selectedGame={selectedGame}
          onChangeGame={() => roomId && gotoRoomGameList(roomId)}
          onReadyChange={handleReadyChange}
          onStart={handleGameStartButtonClick}
        />
      </Modal>
    </>
  );
}
