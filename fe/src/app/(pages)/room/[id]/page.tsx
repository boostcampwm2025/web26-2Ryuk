'use client';

import { useEffect, useRef, useState } from 'react';
import useResponsive from '@/app/hooks/useResponsive';
import '@/app/page.css';
import styles from './page.module.css';
import RoomInfoWithModal from '@/app/features/room/components/info/RoomInfoWithModal';
import RoomTextChat from '@/app/features/room/components/chat/RoomTextChat';
import RoomVoiceChat from '@/app/features/room/components/chat/RoomVoiceChat';
import PasswordAuthDialog from '@/app/features/room/components/PasswordAuthDialog';
import { RoomStore } from '@/app/features/room/stores/room';
import { roomStore } from '@/app/features/room/stores/room';
import roomService from '@/app/features/room/services/RoomService';
import { useParams } from 'next/navigation';
import { RoomJoinInfoData } from '@/app/features/room/dtos/type';
import { RoomConverter } from '@/app/features/room/dtos/Room';
import { authStore, AuthStore } from '@/app/features/user/stores/auth';
import { showErrorToast, useToast } from '@/app/components/shared/toast/useToast';
import LeaveRoomButtonWithModal from '@/app/features/room/components/LeaveRoomButtonWithModal';
import DeleteRoomButtonWithModal from '@/app/features/room/components/DeleteRoomButtonWithModal';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import useNavigation from '@/app/hooks/useNavigation';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const { goBack, goHome } = useNavigation();

  const { status } = useResponsive();
  const { showSuccessToast } = useToast();
  const roomData = roomStore((state: RoomStore) => state.roomData);
  const userId = authStore((state: AuthStore) => state.userId);
  const [roomJoinInfoData, setRoomJoinInfoData] = useState<RoomJoinInfoData | null>(null);
  const [showPasswordAuth, setShowPasswordAuth] = useState(false);
  const hasInitialized = useRef(false);
  const [isHost, setIsHost] = useState<boolean>(false);

  // 방 입장 정보 조회 및 권한 체크
  useEffect(() => {
    // React Strict Mode에서 중복 실행 방지
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    (async () => {
      if (!userId) {
        showErrorToast('로그인 후 이용해주세요.');
        goHome();
        return;
      }

      if (!roomId) return;

      // 방 입장 정보 조회
      const roomJoinInfoDto = await roomService.getRoomJoinInfo(roomId);
      const roomJoinInfoData = RoomConverter.toJoinInfoData(roomJoinInfoDto);
      setRoomJoinInfoData(roomJoinInfoData);

      // 방 정보 조회 (호스트 여부 확인용)
      const roomDto = await roomService.getRoom(roomId);
      const roomData = RoomConverter.toData(roomDto);
      roomStore.getState().setRoomData(roomData);
      setIsHost(roomData.hostId === userId);

      // 멤버가 아니고 비밀방인 경우 비밀번호 인증 모달 표시 (입장 시도 안 함)
      if (!roomJoinInfoData.isMember && roomJoinInfoData.isPrivate) {
        setShowPasswordAuth(true);
        return; // 비밀번호 입력 대기
      }

      // 멤버가 아니고 공개방인 경우 방 입장
      if (!roomJoinInfoData.isMember) {
        await roomService.validateJoin(roomId);
        await roomChatService.subscribe(roomId);
        showSuccessToast('방에 입장했습니다!');
        return;
      }

      // 멤버인 경우 (호스트 포함) WebSocket 구독
      await roomChatService.subscribe(roomId);
      return;
    })();
  }, []);

  const handlePasswordConfirm = async (password: string) => {
    await roomService.validateJoin(roomId, password);

    // 비밀번호 인증 완료
    setShowPasswordAuth(false);
    showSuccessToast('방에 입장했습니다!');

    await roomChatService.subscribe(roomId);

    // 방 정보 조회 및 업데이트
    const roomDto = await roomService.getRoom(roomId);
    const roomData = RoomConverter.toData(roomDto);
    roomStore.getState().setRoomData(roomData);
    setIsHost(roomData.hostId === userId);
  };

  const handlePasswordCancel = () => {
    setShowPasswordAuth(false);
    goBack();
  };

  return (
    <>
      {isHost ? <DeleteRoomButtonWithModal /> : <LeaveRoomButtonWithModal />}
      <div className={styles[status]}>
        <div className="content">
          <div className={styles.content}>
            <div className={styles.left}>
              <div>
                <RoomInfoWithModal
                  roomId={roomId}
                  title={roomData?.title ?? roomJoinInfoData?.title}
                  tags={roomData?.tags ?? roomJoinInfoData?.tags}
                  isHost={isHost}
                  isMicAvailable={roomData?.isMicAvailable ?? roomJoinInfoData?.isMicAvailable}
                  isPrivate={roomData?.isPrivate ?? roomJoinInfoData?.isPrivate}
                  maxParticipants={roomData?.maxParticipants}
                />
              </div>
              <div>
                <RoomTextChat />
              </div>
            </div>
            <div className={styles.right}>
              <RoomVoiceChat />
            </div>
          </div>
        </div>
      </div>
      <PasswordAuthDialog
        isOpen={showPasswordAuth}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
      />
    </>
  );
}
