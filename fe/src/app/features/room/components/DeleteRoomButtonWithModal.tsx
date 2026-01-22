'use client';

import { useState } from 'react';
import useNavigation from '@/app/hooks/useNavigation';
import { useModal } from '@/app/components/shared/modal/useModal';
import Modal from '@/app/components/shared/modal/Modal';
import Dialog from '@/app/components/shared/dialog/Dialog';
import Paths from '@/app/shared/path';
import roomService from '@/app/features/room/services/RoomService';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { useToast } from '@/app/components/shared/toast/useToast';
import LeaveRoomButton from './LeaveRoomButton';

export default function DeleteRoomButtonWithModal() {
  const { goHome } = useNavigation();
  const { openModal, closeModal } = useModal();
  const { showSuccessToast } = useToast();
  const [modalId] = useState(() => `room-delete-${Date.now()}`);
  const roomId = roomStore((state: RoomStore) => state.roomId);

  const handleDeleteClick = () => openModal(modalId);
  const handleCancel = () => closeModal(modalId);
  const handleConfirm = async () => {
    if (!roomId) return;

    await roomService.deleteRoom(roomId);
    await roomChatService.unsubscribe();
    roomStore.getState().leaveRoom();
    closeModal(modalId);
    showSuccessToast('방이 삭제되었습니다.');
    goHome();
  };

  return (
    <>
      <LeaveRoomButton modalId={modalId} handleClick={handleDeleteClick} />
      <Modal id={modalId}>
        <Dialog
          modalId={modalId}
          src={Paths.images('mascot_surprise')}
          title="정말 나가시겠습니까?"
          content="방장이 대화방을 나가면 대화방이 삭제됩니다!"
          confirmText="삭제"
          isDanger
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      </Modal>
    </>
  );
}
