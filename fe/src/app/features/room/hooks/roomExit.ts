'use client';

import { useCallback, useRef } from 'react';
import { useModal } from '@/app/components/shared/modal/useModal';
import { roomStore } from '@/app/features/room/stores/room';
import roomService from '@/app/features/room/services/RoomService';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { voiceStore } from '@/app/features/voice/stores/voice';
import type { UseRoomExitCallbacks, UseRoomExitResult } from '@/app/features/room/hooks/type';

const DELETE_MODAL_ID = 'delete-room-modal';
const LEAVE_MODAL_ID = 'leave-room-modal';

export function useRoomExit(
  roomId: string | undefined,
  callbacks: UseRoomExitCallbacks,
): UseRoomExitResult {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const { openModal, closeModal } = useModal();

  const handleLeaveRoom = useCallback(async () => {
    await roomChatService.unsubscribe();
    voiceStore.getState().reset();
    roomStore.getState().resetRoom();
    callbacksRef.current.onLeaveSuccess();
  }, [roomId]);

  const handleDeleteRoom = useCallback(async () => {
    if (!roomId) return;
    roomChatService.clearSubscriptionOnly();
    voiceStore.getState().reset();
    await roomService.deleteRoom(roomId);
    roomStore.getState().resetRoom();
    callbacksRef.current.onDeleteSuccess();
  }, [roomId]);

  const openDeleteModal = useCallback(() => openModal(DELETE_MODAL_ID), [openModal]);
  const openLeaveModal = useCallback(() => openModal(LEAVE_MODAL_ID), [openModal]);

  const closeDeleteModal = useCallback(() => closeModal(DELETE_MODAL_ID), [closeModal]);
  const closeLeaveModal = useCallback(() => closeModal(LEAVE_MODAL_ID), [closeModal]);

  const handleDeleteModalConfirm = useCallback(async () => {
    await handleDeleteRoom();
    closeDeleteModal();
  }, [closeDeleteModal, handleDeleteRoom]);

  const handleLeaveModalConfirm = useCallback(async () => {
    await handleLeaveRoom();
    closeLeaveModal();
  }, [closeLeaveModal, handleLeaveRoom]);

  const handleDeleteModalCancel = useCallback(() => closeDeleteModal(), [closeDeleteModal]);
  const handleLeaveModalCancel = useCallback(() => closeLeaveModal(), [closeLeaveModal]);

  return {
    handleLeaveRoom,
    handleDeleteRoom,
    deleteModalId: DELETE_MODAL_ID,
    leaveModalId: LEAVE_MODAL_ID,
    openDeleteModal,
    openLeaveModal,
    handleDeleteModalCancel,
    handleLeaveModalCancel,
    handleDeleteModalConfirm,
    handleLeaveModalConfirm,
  };
}
