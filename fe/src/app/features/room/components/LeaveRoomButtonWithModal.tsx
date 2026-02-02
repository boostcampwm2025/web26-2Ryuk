'use client';

import Modal from '@/app/components/shared/modal/Modal';
import Dialog from '@/app/components/shared/dialog/Dialog';
import Paths from '@/app/shared/path';
import LeaveRoomButton from './LeaveRoomButton';
import { useRoom } from '@/app/features/room/hooks/room';
import { roomStore } from '@/app/features/room/stores/room';

export default function LeaveRoomButtonWithModal() {
  const roomId = roomStore((state) => state.id);

  const { exit } = useRoom(roomId);
  const { leaveModalId, openLeaveModal, handleLeaveModalCancel, handleLeaveModalConfirm } = exit;

  return (
    <>
      <LeaveRoomButton modalId={leaveModalId} handleClick={openLeaveModal} />
      <Modal id={leaveModalId}>
        <Dialog
          modalId={leaveModalId}
          src={Paths.images('mascot_surprise')}
          title="정말 나가시겠습니까?"
          content="현재 진행 중인 대화 정보가 사라질 수 있으니 신중하게 결정해주세요!"
          onCancel={handleLeaveModalCancel}
          onConfirm={handleLeaveModalConfirm}
        />
      </Modal>
    </>
  );
}
