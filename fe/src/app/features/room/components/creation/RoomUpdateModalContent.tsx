'use client';

import RoomEditForm from './RoomEditForm';
import RoomEditModalContentBase from './RoomEditModalContentBase';
import { RoomEditFormProps } from '@/app/features/room/components/type';

export default function RoomUpdateModalContent(props: Omit<RoomEditFormProps, 'type'>) {
  const { onSubmit, onCancel } = props;

  const handleSubmit = (data: Parameters<NonNullable<typeof onSubmit>>[0]) => onSubmit?.(data);

  return (
    <RoomEditModalContentBase
      title="대화방 정보 수정"
      subtitle="여기서 대화방 정보를 수정할 수 있어요!"
    >
      <RoomEditForm
        {...props}
        type="update"
        onCancel={onCancel}
        onSubmit={handleSubmit}
        submitText="수정하기"
      />
    </RoomEditModalContentBase>
  );
}
