'use client';

import GoBackButton from '@/app/components/shared/button/GoBackButton';
import { DeleteRoomButtonProps } from './type';

export default function DeleteRoomButton({ modalId, handleClick }: DeleteRoomButtonProps) {
  return <GoBackButton text="방 삭제" modalId={modalId} onClick={handleClick} />;
}
