import { RoomJoinInfoData } from '@/app/features/room/dtos/data';
import { RoomData } from '@/app/features/room/dtos/data';
import { UseGameResult } from '@/app/features/game/hooks/type';

export interface UseRoomResult {
  roomData?: RoomData;
  roomJoinInfoData?: RoomJoinInfoData;
  showPasswordAuth: boolean;
  handlePasswordConfirm: (password: string) => Promise<void>;
  handlePasswordCancel: () => void;
  handleLeaveRoom: () => Promise<void>;
  handleDeleteRoom: () => Promise<void>;
  deleteModalId: string;
  leaveModalId: string;
  openDeleteModal: () => void;
  openLeaveModal: () => void;
  handleDeleteModalCancel: () => void;
  handleDeleteModalConfirm: () => Promise<void>;
  handleLeaveModalCancel: () => void;
  handleLeaveModalConfirm: () => Promise<void>;
  game: UseGameResult;
}
