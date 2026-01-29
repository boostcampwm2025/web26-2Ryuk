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
import { loadingStore } from '@/app/features/loading/stores/loading';
import { useToast } from '@/app/components/shared/toast/useToast';
import { TextTooltip, TooltipTrigger } from '@/app/components/shared/tooltip/TextTooltip';

export default function RealtimeRoomsSection() {
  const { isDesktop } = useResponsive();
  const { gotoRoom } = useNavigation();
  const { closeModal } = useModal();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const { setRoom, setRoomData } = roomStore();
  const className = CSSUtil.buildCls(styles.headerDesktop, !isDesktop && styles.headerTablet);
  const { showSuccessToast } = useToast();
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

    const createdRoom = await roomService.createRoom(roomDto);
    closeModal('room-creation');

    gotoRoom(createdRoom.id);
    setRoom(createdRoom.id);
    setRoomData(RoomConverter.toData(createdRoom));

    showSuccessToast('방을 생성했습니다!');

    hide();
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
              <TooltipTrigger dataAnchor="create-room-button">
                <TextButton.Primary
                  text="방 만들기"
                  size="medium"
                  iconName="add"
                  modalId="room-creation"
                  disabled={!!roomId || !isAuthenticated}
                />
              </TooltipTrigger>
              {!isAuthenticated && (
                <TextTooltip text="먼저 로그인을 해주세요!" anchorId="create-room-button" />
              )}
              {roomId && (
                <TextTooltip
                  text="소속된 방이 있으면 방을 생성할 수 없어요"
                  anchorId="create-room-button"
                />
              )}
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
