'use client';

import styles from './room.module.css';
import { OutlineChip } from '@/app/components/shared/chip/Chip';
import StatusChip from '@/app/components/shared/chip/StatusChip';
import { PrimaryIconButton, SecondaryIconButton } from '@/app/components/shared/icon/IconButton';
import Avatars from '@/app/components/shared/profile/Avatars';
import { RoomCardProps } from '@/app/features/room/components/type';
import Icon from '@/app/components/shared/icon/Icon';
import useNavigation from '@/app/hooks/useNavigation';
import { authStore } from '@/app/features/user/stores/auth';
import { roomStore } from '@/app/features/room/stores/room';
import { TextTooltip, TooltipTrigger } from '@/app/components/shared/tooltip/TextTooltip';

function RoomCard({
  id,
  title = '',
  tags = [],
  currentParticipants = 0,
  maxParticipants = 2,
  isMicAvailable = true,
  isPrivate = false,
  participants = [],
}: RoomCardProps) {
  const { gotoRoom } = useNavigation();
  const remainingCount = maxParticipants - currentParticipants;
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const myRoomId = roomStore((state) => state.id);

  const profiles = participants.map((p) => ({
    nickname: p.nickname,
    profileImage: p.profileImage,
  }));
  const noRemain = remainingCount === 0;
  const isMember = myRoomId === id;

  const enterable = isMember || (!noRemain && !myRoomId);

  const getStatus = (): 'success' | 'warning' | 'error' => {
    if (noRemain) return 'error'; // 풀방
    if (remainingCount === 1) return 'warning'; // 한 자리 남음
    return 'success';
  };

  const handleJoin = () => {
    if (!enterable || !isAuthenticated) return;
    gotoRoom(id);
  };

  const OpenButton = isMember ? PrimaryIconButton : SecondaryIconButton;

  const titleAnchor = `room-title-${id}`;
  const openAnchor = `open-button-${id}`;

  let tooltipText = '새로운 방에 입장합니다';
  if (!isAuthenticated) tooltipText = '먼저 로그인을 해주세요!';
  else if (isMember) tooltipText = '기존 방에 입장합니다';
  else if (noRemain) tooltipText = '자리가 없어요!';
  else if (myRoomId) tooltipText = '이미 소속된 방이 있어요!';
  else if (remainingCount === 1) tooltipText = '한 자리 남았어요!';

  return (
    <div className={styles.roomCard}>
      <div className={styles.top}>
        <div className={styles.header}>
          <>
            <div className={styles.titleContainer}>
              <>
                <TooltipTrigger dataAnchor="roomcard-icon">
                  <Icon name={isMicAvailable ? 'voice' : 'message'} size="medium" />
                </TooltipTrigger>
                <TextTooltip
                  anchorId="roomcard-icon"
                  text={isMicAvailable ? '음성 대화방 입니다' : '텍스트 대화방입니다'}
                />
              </>
              <h3 className={styles.title} data-anchor={titleAnchor}>
                {title}
              </h3>
            </div>
            <TextTooltip text={title} anchorId={titleAnchor} />
          </>
          <StatusChip
            status={getStatus()}
            label={`${currentParticipants}/${maxParticipants}`}
            size="small"
          />
        </div>
        <div className={styles.tagsAndIcons}>
          {tags.length > 0 && (
            <div className={styles.tags}>
              {tags.map((tag) => (
                <OutlineChip key={`key-${tag}`} label={tag} size="small" />
              ))}
            </div>
          )}
          <div className={styles.icons}>{isPrivate && <Icon name="lock" size="small" />}</div>
        </div>
      </div>
      <div className={styles.footer}>
        <Avatars profiles={profiles} />
        <TooltipTrigger dataAnchor={openAnchor}>
          <OpenButton
            name="open"
            size="small"
            disabled={!isAuthenticated || !enterable}
            onClick={handleJoin}
          />
        </TooltipTrigger>
        <TextTooltip text={tooltipText} anchorId={openAnchor} />
      </div>
    </div>
  );
}

export default RoomCard;
