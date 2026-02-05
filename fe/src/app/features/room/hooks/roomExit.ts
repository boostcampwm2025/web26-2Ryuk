'use client';

import { useModal } from '@/app/components/shared/modal/useModal';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import type { UseRoomExitCallbacks, UseRoomExitResult } from '@/app/features/room/hooks/type';
import roomService from '@/app/features/room/services/RoomService';
import { roomStore } from '@/app/features/room/stores/room';
import { VoiceService } from '@/app/features/voice/services/VoiceService';
import { voiceStore } from '@/app/features/voice/stores/voice';
import { useCallback, useRef } from 'react';

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
    await VoiceService.leaveChannel();
    voiceStore.getState().reset();
    roomStore.getState().resetRoom();
    await roomChatService.unsubscribe();
    callbacksRef.current.onLeaveSuccess();
  }, [roomId]);

  const handleDeleteRoom = useCallback(async () => {
    if (!roomId) return;
    roomChatService.clearSubscriptionOnly();
    voiceStore.getState().reset();
    await VoiceService.leaveChannel();
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
