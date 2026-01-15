'use client';

import GoBackButton from '@/app/components/shared/button/GoBackButton';
import { LeaveRoomButtonProps } from './type';

export default function LeaveRoomButton({ modalId, handleClick }: LeaveRoomButtonProps) {
  return <GoBackButton text="방 나가기" modalId={modalId} onClick={handleClick} />;
}
