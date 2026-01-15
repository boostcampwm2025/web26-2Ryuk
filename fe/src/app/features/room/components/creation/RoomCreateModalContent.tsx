'use client';

import RoomEditForm from './RoomEditForm';
import RoomEditModalContentBase from './RoomEditModalContentBase';
import { RoomEditFormProps } from '@/app/features/room/components/type';
import { useModal } from '@/app/components/shared/modal/useModal';

export default function RoomCreateModalContent(props: RoomEditFormProps) {
  const { onSubmit } = props;
  const { closeModal } = useModal();

  const handleCancel = () => closeModal('room-creation');
  const handleSubmit = (data: Parameters<NonNullable<typeof onSubmit>>[0]) => onSubmit?.(data);

  return (
    <RoomEditModalContentBase title="대화방 만들기" subtitle="새로운 물방울을 띄워보세요!">
      <RoomEditForm
        {...props}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        submitText="대화방 만들기"
      />
    </RoomEditModalContentBase>
  );
}
