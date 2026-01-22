'use client';

import styles from './realtimeRoomsSection.module.css';
import RoomCard from './card/RoomCard';
import * as IconCircle from '@/app/components/shared/icon/IconCircle';
import * as TextButton from '@/app/components/shared/button/TextButton';
import SearchForm from '@/app/components/shared/form/search/SearchForm';
import { RoomData, RoomEditData } from '@/app/features/room/dtos/data';
import { RoomConverter } from '@/app/features/room/dtos/converter';
import useResponsive from '@/app/hooks/useResponsive';
import CSSUtil from '@/utils/css';
import Modal from '@/app/components/shared/modal/Modal';
import RoomCreateModalContent from './creation/RoomCreateModalContent';
import roomService from '../services/RoomService';
import useNavigation from '@/app/hooks/useNavigation';
import { useModal } from '@/app/components/shared/modal/useModal';
import { roomStore, RoomStore } from '../stores/room';
import { useEffect, useState } from 'react';
import { authStore, AuthStore } from '@/app/features/user/stores/auth';
import { roomChatService } from '@/app/features/chat/services/RoomChatService';
import { loadingStore } from '@/app/features/loading/stores/loading';

export default function RealtimeRoomsSection() {
  const { isDesktop } = useResponsive();
  const { goToRoom } = useNavigation();
  const { closeModal } = useModal();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const { setRoom, setRoomData } = roomStore();
  const className = CSSUtil.buildCls(styles.headerDesktop, !isDesktop && styles.headerTablet);
  const roomId = roomStore((state: RoomStore) => state.roomId);
  const isAuthenticated = authStore((state: AuthStore) => state.isAuthenticated);
  const { show, hide } = loadingStore();

  useEffect(() => {
    (async () => {
      const roomsDto = await roomService.getRooms();
      const roomsData = roomsDto.rooms.map(RoomConverter.toData);
      setRooms(roomsData);
    })();
  }, []);

  const handleSearch = async (query: string) => {
    const roomsDto = await roomService.searchRooms(query);
    const roomsData = roomsDto.rooms.map(RoomConverter.toData);
    setRooms(roomsData);
  };

  const handleSubmit = async (data: RoomEditData) => {
    const roomDto = RoomConverter.toEditDto(data);
    show();
    try {
      const createdRoom = await roomService.createRoom(roomDto);
      closeModal('room-creation');

      // 호스트가 방을 만든 직후 Socket.io room에 참여하도록 구독
      await roomChatService.subscribe(createdRoom.id);

      goToRoom(createdRoom.id);
      setRoom(createdRoom.id);
      setRoomData(RoomConverter.toData(createdRoom));
    } finally {
      hide();
    }
  };

  return (
    <>
      <div className={styles.realtimeRoomsSection}>
        <div className={className}>
          <div className={styles.title}>
            <IconCircle.Secondary name="mic" size="medium" />
            <h2 className={styles.titleText}>실시간 대화방</h2>
          </div>
          <div className={styles.actions}>
            <div className={styles.search}>
              <SearchForm placeholder="제목, 내용, 작성자 검색" onSubmit={handleSearch} />
            </div>
            <div className={styles.createRoom}>
              <TextButton.Primary
                text="방 만들기"
                size="medium"
                iconName="add"
                modalId="room-creation"
                disabled={!!roomId || !isAuthenticated}
              />
            </div>
          </div>
        </div>
        <div className={styles.grid}>
          {rooms.map((room) => (
            <RoomCard key={room.id} {...room} />
          ))}
        </div>
      </div>
      <Modal id="room-creation">
        <RoomCreateModalContent onSubmit={handleSubmit} submitText="방 만들기" />
      </Modal>
    </>
  );
}
