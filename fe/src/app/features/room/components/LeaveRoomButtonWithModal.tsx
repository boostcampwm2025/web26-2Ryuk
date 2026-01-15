'use client';

import { useState } from 'react';
import useNavigation from '@/app/hooks/useNavigation';
import { useModal } from '@/app/components/shared/modal/useModal';
import Modal from '@/app/components/shared/modal/Modal';
import Dialog from '@/app/components/shared/dialog/Dialog';
import Paths from '@/app/shared/path';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import LeaveRoomButton from './LeaveRoomButton';
import { AuthStore, authStore } from '@/app/features/user/stores/auth';
import { useToast } from '@/app/components/shared/toast/useToast';

export default function LeaveRoomButtonWithModal() {
  const { goBack } = useNavigation();
  const { openModal, closeModal } = useModal();
  const { showSuccessToast } = useToast();
  const [modalId] = useState(() => `room-exit-${Date.now()}`);
  const roomId = roomStore((state: RoomStore) => state.roomId);
  const userId = authStore((state: AuthStore) => state.userId);

  const handleGoBackClick = () => openModal(modalId);
  const handleCancel = () => closeModal(modalId);
  const handleConfirm = () => {
    if (roomId && userId) {
      roomChatService.unsubscribe();
      closeModal(modalId);
      showSuccessToast('퇴장했습니다.');
    }
    goBack();
  };

  return (
    <>
      <LeaveRoomButton modalId={modalId} handleClick={handleGoBackClick} />
      <Modal id={modalId}>
        <Dialog
          modalId={modalId}
          src={Paths.images('mascot_surprise')}
          title="정말 나가시겠습니까?"
          content="현재 진행 중인 대화 정보가 사라질 수 있으니 신중하게 결정해주세요!"
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      </Modal>
    </>
  );
}
