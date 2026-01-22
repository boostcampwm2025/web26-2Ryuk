import { RoomData, RoomJoinInfoData } from '@/app/features/room/dtos/data';

export interface RoomPageClientProps {
  roomId: string;
}

export interface PasswordAuthProps {
  roomJoinInfo: RoomJoinInfoData;
  roomId: string;
}
