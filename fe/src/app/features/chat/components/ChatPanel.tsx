'use client';

import { useState, useEffect, useRef } from 'react';
import ChatBubbles from './ChatBubbles';
import styles from './chat.module.css';
import MessageForm from '@/app/components/shared/form/message/MessageForm';
import { ChatPanelProps, ChatPanelHeaderProps } from './type';
import * as IconCircle from '@/app/components/shared/icon/IconCircle';
import * as IconButton from '@/app/components/shared/icon/IconButton';
import CSSUtil from '@/utils/css';
import FloatingWidget from '@/app/components/shared/floatingWidget/FloatingWidget';
import { FloatingWidgetHandle } from '@/app/components/shared/floatingWidget/type';
import { useClickOutside } from '@/app/hooks/useClickOutside';

function ChatPanelHeader({
  iconName,
  type,
  participantCount,
  isCollapsed,
  onToggle,
  headerChildren,
  isConnected = true,
}: ChatPanelHeaderProps) {
  const iconNameToggle = isCollapsed ? 'up' : 'down';
  const counts = `${participantCount.toLocaleString()}명${isCollapsed ? '' : ' 참여중'}`;

  const getTitle = () => {
    switch (type) {
      case 'global':
        return isCollapsed ? '전체' : '전체 채팅';
      case 'local':
        return isCollapsed ? '대화방' : '대화방 채팅';
      default:
        return '';
    }
  };

  const className = CSSUtil.buildCls(
    styles.header,
    isCollapsed && styles.collapsed,
    isConnected ? styles.connected : styles.disconnected,
  );

  return (
    <div id="chat-panel-header" className={className}>
      <IconCircle.Primary name={iconName} size="medium" />
      <div className={styles.headerContent}>
        <div className={styles.title}>{getTitle()}</div>
        <div className={styles.status}>
          <span className={styles.onlineDot} />
          <span>{counts}</span>
          {!isConnected && <span className={styles.connectionStatus}> (연결 중...)</span>}
        </div>
      </div>
      {headerChildren}
      <IconButton.Ghost name={iconNameToggle} size="medium" onClick={onToggle} />
    </div>
  );
}

export default function ChatPanel({
  iconName,
  type,
  participantCount,
  chats,
  onMessageSubmit,
  headerChildren,
  participantsAvatars,
  isConnected = true,
  disabled = true,
}: ChatPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const chattingAreaRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const floatingWidgetRef = useRef<FloatingWidgetHandle>(null);

  const handleToggle = () => setIsCollapsed(!isCollapsed);

  const scrollToBottom = () => {
    if (!chattingAreaRef.current) return;
    chattingAreaRef.current.scrollTop = chattingAreaRef.current.scrollHeight;
  };

  useClickOutside(panelRef, () => setIsCollapsed(true), !isCollapsed);

  useEffect(() => {
    if (isCollapsed) return;
    requestAnimationFrame(scrollToBottom);
  }, [chats, isCollapsed]);

  useEffect(() => {
    if (isCollapsed) return;
    setTimeout(() => floatingWidgetRef.current?.ensureInBounds(), 350);
  }, [isCollapsed]);

  const handleMessageSubmit = (message: string) => {
    onMessageSubmit?.(message);
    requestAnimationFrame(scrollToBottom);
  };

  const className = CSSUtil.buildCls(
    styles.chatPanel,
    styles[type],
    isCollapsed && styles.collapsed,
  );

  return (
    <FloatingWidget ref={floatingWidgetRef} id="chat-panel" dragHandleId="chat-panel-header">
      <div ref={panelRef} className={className}>
        <ChatPanelHeader
          iconName={iconName}
          type={type}
          participantCount={participantCount}
          isCollapsed={isCollapsed}
          onToggle={handleToggle}
          headerChildren={headerChildren}
          isConnected={isConnected}
        />
        {participantsAvatars && (
          <div className={styles.participantsAvatars}>{participantsAvatars}</div>
        )}
        <div className={styles.content}>
          <div ref={chattingAreaRef} className={styles.chattingArea}>
            <ChatBubbles chats={chats} />
          </div>
          <div className={styles.messageForm}>
            <MessageForm
              placeholder="메시지를 입력하세요..."
              onSubmit={handleMessageSubmit}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </FloatingWidget>
  );
}
