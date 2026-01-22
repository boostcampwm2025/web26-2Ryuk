'use client';

import RoomInfo from './RoomInfo';
import Modal from '@/app/components/shared/modal/Modal';
import RoomUpdateModalContent from '../creation/RoomUpdateModalContent';
import { useModal } from '@/app/components/shared/modal/useModal';
import { RoomEditData } from '@/app/features/room/dtos/data';
import { RoomConverter } from '@/app/features/room/dtos/converter';
import roomService from '@/app/features/room/services/RoomService';
import { roomStore } from '@/app/features/room/stores/room';
import { useToast } from '@/app/components/shared/toast/useToast';
import { useRoomChat } from '@/app/features/chat/hooks/useRoomChat';

interface RoomInfoWithModalProps {
  roomId: string;
  title?: string;
  tags?: string[];
  isHost?: boolean;
  isMicAvailable?: boolean;
  isPrivate?: boolean;
  maxParticipants?: number;
}

export default function RoomInfoWithModal({
  roomId,
  title = '',
  tags = [],
  isHost = false,
  isMicAvailable = false,
  isPrivate = false,
  maxParticipants = 2,
}: RoomInfoWithModalProps) {
  const { openModal, closeModal } = useModal();
  const { showSuccessToast } = useToast();
  const isJoined = roomStore((s) => s.isJoined);
  const { isConnected } = useRoomChat(roomId, isJoined);

  const modalId = `room-update-${title}`;

  const handleEditClick = () => openModal(modalId);

  const handleCancel = () => closeModal(modalId);
  const handleSubmit = async (data: RoomEditData) => {
    const roomDto = RoomConverter.toEditDto(data);
    const updatedDto = await roomService.updateRoom(roomId, roomDto);
    const updated = RoomConverter.toData(updatedDto);

    roomStore.getState().updateRoomData({
      title: updated.title,
      tags: updated.tags,
      maxParticipants: updated.maxParticipants,
      isMicAvailable: updated.isMicAvailable,
      isPrivate: updated.isPrivate,
    });

    closeModal(modalId);
    showSuccessToast('수정 완료!');
  };

  const initialData: Partial<RoomEditData> = {
    title,
    tags,
    maxParticipants,
    isMicAvailable,
    isPrivate,
  };

  return (
    <>
      <RoomInfo
        title={title}
        tags={tags}
        isHost={isHost}
        isMicAvailable={isMicAvailable}
        isPrivate={isPrivate}
        onEditClick={handleEditClick}
        isConnected={isConnected}
      />
      <Modal id={modalId}>
        <RoomUpdateModalContent
          initialData={initialData}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          submitText="수정하기"
        />
      </Modal>
    </>
  );
}
