'use client';

import CSSUtil from '@/utils/css';
import styles from './roomInfo.module.css';
import { SecondaryChip } from '@/app/components/shared/chip/Chip';
import { OutlineIconButton } from '@/app/components/shared/icon/IconButton';
import Icon from '@/app/components/shared/icon/Icon';
import { RoomInfoProps } from '@/app/features/room/components/type';
import * as IconCircle from '@/app/components/shared/icon/IconCircle';
import { TextTooltip, TooltipTrigger } from '@/app/components/shared/tooltip/TextTooltip';

export default function RoomInfo({
  title,
  tags,
  isHost,
  isMicAvailable,
  isPrivate,
  onEditClick,
  onCopyLinkClick,
  isConnected,
}: RoomInfoProps) {
  const hasTags = tags.length > 0;

  const className = CSSUtil.buildCls(
    styles.roomInfo,
    isConnected ? styles.connected : styles.disconnected,
  );

  const getIconName = () => {
    if (!isConnected) return 'refresh';
    return isMicAvailable ? 'voice' : 'message';
  };

  return (
    <div className={className}>
      <div className={styles.info}>
        <div className={styles.content}>
          <div className={styles.leftSection}>
            <div className={styles.icon}>
              <TooltipTrigger dataAnchor="roomcard-icon">
                <IconCircle.Ghost name={getIconName()} size="medium" />
              </TooltipTrigger>
              <TextTooltip
                anchorId="roomcard-icon"
                text={isMicAvailable ? '음성 대화방 입니다' : '텍스트 대화방입니다'}
              />
            </div>
            <div className={styles.titleContainer}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>{title}</h2>
                {isPrivate && <Icon name="lock" size="medium" />}
              </div>
              <div className={styles.status}>
                <span className={styles.onlineDot} />
                <span className={styles.connectionStatus}>
                  {isConnected ? '연결됨' : '연결 중...'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.tags}>
          {hasTags &&
            tags.map((tag) => <SecondaryChip key={tag} label={`#${tag}`} size="medium" />)}
        </div>
      </div>
      <div className={styles.rightSection}>
        <>
          <TooltipTrigger dataAnchor="roominfo-update">
            {isHost && isConnected && (
              <OutlineIconButton name="pencil" size="medium" onClick={onEditClick} />
            )}
          </TooltipTrigger>
          <TextTooltip anchorId="roominfo-update" text="대화방 정보를 수정할 수 있어요" />
        </>
        <>
          <TooltipTrigger dataAnchor="roominfo-copylink">
            {isConnected && (
              <OutlineIconButton name="link" size="medium" onClick={onCopyLinkClick} />
            )}
          </TooltipTrigger>
          <TextTooltip
            anchorId="roominfo-copylink"
            text="대화방 링크를 복사해서 친구에게 공유해보세요"
          />
        </>
      </div>
    </div>
  );
}
