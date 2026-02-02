'use client';

import styles from './realtimeRoomsSection.module.css';
import RoomCard from './card/RoomCard';
import * as IconCircle from '@/app/components/shared/icon/IconCircle';
import * as TextButton from '@/app/components/shared/button/TextButton';
import { OutlineIconButton } from '@/app/components/shared/icon/IconButton';
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
import { roomStore } from '../stores/room';
import { useCallback, useEffect, useRef, useState } from 'react';
import { authStore, AuthStore } from '@/app/features/user/stores/auth';
import { useToast } from '@/app/components/shared/toast/useToast';
import { TextTooltip, TooltipTrigger } from '@/app/components/shared/tooltip/TextTooltip';

export default function RealtimeRoomsSection() {
  const { isDesktop } = useResponsive();
  const { gotoRoom } = useNavigation();
  const { closeModal } = useModal();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const { showSuccessToast } = useToast();
  const roomId = roomStore((state) => state.id);
  const replaceRoom = roomStore((state) => state.replaceRoom);
  const isAuthenticated = authStore((state: AuthStore) => state.isAuthenticated);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRooms = useCallback(async () => {
    const roomsDto = await roomService.getRooms();
    const roomsData = roomsDto.rooms.map(RoomConverter.toData);
    setRooms(roomsData);
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleSearch = async (query: string) => {
    const roomsDto = await roomService.searchRooms(query);
    const roomsData = roomsDto.rooms.map(RoomConverter.toData);
    setRooms(roomsData);
  };

  const handleSubmit = async (data: RoomEditData) => {
    const roomDto = RoomConverter.toEditDto(data);
    const createdRoomDto = await roomService.createRoom(roomDto);
    const createdRoomData = RoomConverter.toData(createdRoomDto);

    closeModal('room-creation');

    gotoRoom(createdRoomDto.id);
    replaceRoom(createdRoomData);

    showSuccessToast('방을 생성했습니다!');
  };

  const refreshClassName = CSSUtil.buildCls(styles.refresh, isRefreshing && styles.spin);
  const handleRefreshClick = useCallback(async () => {
    setIsRefreshing(true);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => setIsRefreshing(false), 650);
    await loadRooms();
  }, [loadRooms]);
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);
  const className = CSSUtil.buildCls(styles.headerDesktop, !isDesktop && styles.headerTablet);

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
              <TooltipTrigger dataAnchor="search-form">
                <SearchForm placeholder="제목, 태그 검색" onSubmit={handleSearch} />
              </TooltipTrigger>
              <TextTooltip anchorId="search-form" text="제목과 태그를 검색할 수 있어요" />
            </div>
            <div className={refreshClassName}>
              <OutlineIconButton name="refresh" size="medium" onClick={handleRefreshClick} />
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
