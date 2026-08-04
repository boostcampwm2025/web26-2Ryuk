'use client';

import Modal from '@/app/components/shared/modal/Modal';
import Dialog from '@/app/components/shared/dialog/Dialog';
import Paths from '@/app/shared/path';
import LeaveRoomButton from './LeaveRoomButton';
import { useRoomExit } from '@/app/features/room/hooks/roomExit';
import { roomStore } from '@/app/features/room/stores/room';
import useNavigation from '@/app/hooks/useNavigation';
import { useToast } from '@/app/components/shared/toast/useToast';

export default function DeleteRoomButtonWithModal() {
  const roomId = roomStore((state) => state.id);
  const { showSuccessToast } = useToast();
  const { goHome } = useNavigation();

  const exit = useRoomExit(roomId, {
    onLeaveSuccess: () => {
      showSuccessToast('퇴장했습니다!');
      goHome();
    },
    onDeleteSuccess: () => {
      showSuccessToast('방을 삭제했습니다!');
      goHome();
    },
  });
  const { deleteModalId, openDeleteModal, handleDeleteModalCancel, handleDeleteModalConfirm } =
    exit;

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
