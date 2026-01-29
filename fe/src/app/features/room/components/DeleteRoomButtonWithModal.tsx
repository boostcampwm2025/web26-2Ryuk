'use client';

import Modal from '@/app/components/shared/modal/Modal';
import Dialog from '@/app/components/shared/dialog/Dialog';
import Paths from '@/app/shared/path';
import LeaveRoomButton from './LeaveRoomButton';
import { useRoom } from '@/app/features/room/hooks/room';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';

export default function DeleteRoomButtonWithModal() {
  const roomId = roomStore((state: RoomStore) => state.roomId);

  const { deleteModalId, openDeleteModal, handleDeleteModalCancel, handleDeleteModalConfirm } =
    useRoom(roomId);

  return (
    <>
      <LeaveRoomButton modalId={deleteModalId} handleClick={openDeleteModal} />
      <Modal id={deleteModalId}>
        <Dialog
          modalId={deleteModalId}
          src={Paths.images('mascot_surprise')}
          title="정말 나가시겠습니까?"
          content="방장이 대화방을 나가면 대화방이 삭제됩니다!"
          confirmText="삭제"
          isDanger
          onCancel={handleDeleteModalCancel}
          onConfirm={handleDeleteModalConfirm}
        />
      </Modal>
    </>
  );
}
