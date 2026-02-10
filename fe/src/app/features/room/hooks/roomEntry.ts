'use client';

import { useEffect, useRef, useState } from 'react';
import { roomStore } from '@/app/features/room/stores/room';
import { authStore } from '@/app/features/user/stores/auth';
import {
  fetchRoomJoinInfo,
  isPasswordRequiredForEntry,
  syncRoomState,
  validateJoinAndSyncRoom,
} from '@/app/features/room/utils/roomEntry';
import { RoomJoinInfoData } from '@/app/features/room/dtos/data';
import type {
  RoomEntryStatus,
  UseRoomEntryCallbacks,
  UseRoomEntryResult,
} from '@/app/features/room/hooks/type';

export function useRoomEntry(
  targetRoomId: string | undefined,
  callbacks: UseRoomEntryCallbacks,
): UseRoomEntryResult {
  const [status, setStatus] = useState<RoomEntryStatus>('idle');
  const [joinInfo, setJoinInfo] = useState<RoomJoinInfoData | null>(null);

  const authInitDone = authStore((s) => s.authInitDone);

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const entryInProgressRef = useRef(false);
  const prevRoomIdRef = useRef<string | undefined>(undefined);

  const runEntryFlow = async () => {
    const roomId = targetRoomId;
    const userId = authStore.getState().id;
    if (!roomId || !userId) return;

    const myRoomId = roomStore.getState().id;

    try {
      // 이미 다른 방 소속 → 서버 요청 없이 콜백만 호출
      if (myRoomId != null && myRoomId !== roomId) {
        callbacksRef.current.onAlreadyInOtherRoom();
        setStatus('redirecting');
        return;
      }

      // 같은 방 재입장 → 검증 생략, 정상 입장 프로세스만
      if (myRoomId === roomId) {
        await syncRoomState(roomId);
        setStatus('entered');
        return;
      }

      // 미소속 → 입장 검증: getJoinInfo → 비밀방 여부 → validate
      setStatus('checking');
      setJoinInfo(null);

      const info = await fetchRoomJoinInfo(roomId);
      setJoinInfo(info);

      if (isPasswordRequiredForEntry(info)) {
        setStatus('need-password');
        return;
      }

      await validateJoinAndSyncRoom(roomId, '');
      setStatus('entered');
    } catch (err) {
      const message = err instanceof Error ? err.message : '입장에 실패했습니다.';
      callbacksRef.current.onValidateFailed(message);
      setStatus('failed');
    } finally {
      entryInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (!targetRoomId) return;

    if (prevRoomIdRef.current !== targetRoomId) {
      prevRoomIdRef.current = targetRoomId;
      entryInProgressRef.current = false;
    }

    const userId = authStore.getState().id;

    if (!userId && authInitDone) return setStatus('need-login');

    if (entryInProgressRef.current) return;
    entryInProgressRef.current = true;

    runEntryFlow();
  }, [targetRoomId, authInitDone]);

  const confirmEntryWithPassword = async (password: string) => {
    if (!targetRoomId || status !== 'need-password') return;

    try {
      await validateJoinAndSyncRoom(targetRoomId, password);
      setStatus('entered');
    } catch (err) {
      const message = err instanceof Error ? err.message : '입장에 실패했습니다.';
      callbacksRef.current.onValidateFailed(message);
      setStatus('failed');
    }
  };

  const cancelPasswordEntry = () => {
    callbacksRef.current.onCancelPassword();
  };

  return {
    status,
    joinInfo,
    isPasswordModalOpen: status === 'need-password',
    confirmEntryWithPassword,
    cancelPasswordEntry,
  };
}
