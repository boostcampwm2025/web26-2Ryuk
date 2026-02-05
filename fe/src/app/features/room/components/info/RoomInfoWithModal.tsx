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
  const { showSuccessToast, showErrorToast } = useToast();
  const isJoined = Boolean(roomStore((state) => state.id));
  const { isConnected } = useRoomChat(roomId, isJoined);

  const modalId = `room-update-${title}`;

  const handleEditClick = () => openModal(modalId);

  const handleCancel = () => closeModal(modalId);
  const handleSubmit = async (data: RoomEditData) => {
    const roomDto = RoomConverter.toEditDto(data);
    const updatedDto = await roomService.updateRoom(roomId, roomDto);
    const updated = RoomConverter.toData(updatedDto);

    roomStore.getState().updateRoom({
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

  const copyUrlToClipboard = async (url: string) => {
    const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;

    if (clipboard?.writeText) {
      await clipboard.writeText(url);
      return;
    }

    if (typeof document === 'undefined' || !document.body) {
      throw new Error('clipboard not available');
    }

    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!successful) {
      throw new Error('clipboard fallback failed');
    }
  };

  const handleCopyLinkClick = async () => {
    if (typeof window === 'undefined') {
      showErrorToast('현재 브라우저에서는 링크를 복사할 수 없어요.');
      return;
    }
    await copyUrlToClipboard(window.location.href);
    showSuccessToast('대화방 링크가 복사되었습니다!');
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
        onCopyLinkClick={handleCopyLinkClick}
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
