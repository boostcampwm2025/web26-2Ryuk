import { RoomJoinInfoData } from '@/app/features/room/dtos/data';
import { UseGameResult } from '@/app/features/game/hooks/type';

// useRoomEntry 입장 상태
export type RoomEntryStatus =
  | 'idle'
  | 'checking'
  | 'need-login'
  | 'need-password'
  | 'entered'
  | 'failed'
  | 'redirecting';

// useRoomEntry 콜백
export interface UseRoomEntryCallbacks {
  // 이미 다른 방 소속 시: 토스트 "이미 소속 중인 방이 있습니다" 후 홈 이동
  onAlreadyInOtherRoom: () => void;
  // validate 실패 시: 서버 에러 토스트 후 홈 이동
  onValidateFailed: (message?: string) => void;
  // 비밀번호 모달 취소 시: 뒤로가기 등
  onCancelPassword: () => void;
}

export interface UseRoomEntryResult {
  status: RoomEntryStatus;
  joinInfo: RoomJoinInfoData | null;
  isPasswordModalOpen: boolean;
  confirmEntryWithPassword: (password: string) => Promise<void>;
  cancelPasswordEntry: () => void;
}

export interface UseRoomExitResult {
  handleLeaveRoom: () => Promise<void>;
  handleDeleteRoom: () => Promise<void>;
  deleteModalId: string;
  leaveModalId: string;
  openDeleteModal: () => void;
  openLeaveModal: () => void;
  handleDeleteModalCancel: () => void;
  handleLeaveModalCancel: () => void;
  handleDeleteModalConfirm: () => Promise<void>;
  handleLeaveModalConfirm: () => Promise<void>;
}

export interface UseRoomExitCallbacks {
  onLeaveSuccess: () => void;
  onDeleteSuccess: () => void;
}

export interface UseRoomResult {
  entry: UseRoomEntryResult;
  exit: UseRoomExitResult;
  game: UseGameResult;
}
