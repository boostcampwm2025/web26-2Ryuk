import { GamePlayerData } from '@/app/features/game/dtos/data';
import { RoomEditData, RoomData } from '@/app/features/room/dtos/data';

export type RoomEditType = 'create' | 'update';

export interface RoomCardProps extends RoomData {}

export interface RoomGridProps {
  rooms: RoomData[];
}

export interface RealtimeRoomsSectionProps {
  rooms?: RoomData[];
  onSearch?: (query: string) => void;
}

export interface PasswordSettingProps {
  initialChecked: boolean;
  onChangeChecked?: (checked: boolean) => void;
  initialPassword: string;
  onChangePassword?: (password: string) => void;
  placeholder?: string;
}

export interface RoomEditFormProps {
  type: RoomEditType;
  initialData?: Partial<RoomEditData>;
  onSubmit?: (data: RoomEditData) => void;
  onCancel?: () => void;
  submitText: string;
}

export interface RoomInfoProps {
  title: string;
  tags: string[];
  isHost: boolean;
  isMicAvailable: boolean;
  isPrivate: boolean;
  onEditClick?: () => void;
  isConnected?: boolean;
}

export interface LeaveRoomButtonProps {
  modalId: string;
  handleClick?: () => void;
}

export interface DeleteRoomButtonProps {
  modalId: string;
  handleClick?: () => void;
}

export interface MyReadyStatusCardProps extends GamePlayerData {}
export interface OtherReadyStatusCardProps extends GamePlayerData {}
