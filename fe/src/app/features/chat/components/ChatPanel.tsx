'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import ChatBubbles from './ChatBubbles';
import styles from './chat.module.css';
import MessageForm from '@/app/components/shared/form/message/MessageForm';
import { ChatPanelProps, ChatPanelHeaderProps } from './type';
import * as IconCircle from '@/app/components/shared/icon/IconCircle';
import * as IconButton from '@/app/components/shared/icon/IconButton';
import CSSUtil from '@/utils/css';
import FloatingWidget from '@/app/components/shared/floatingWidget/FloatingWidget';
import { FloatingWidgetHandle } from '@/app/components/shared/floatingWidget/type';
import { chatPanelStore } from '@/app/features/chat/stores/chatPanel';
import { authStore } from '@/app/features/user/stores/auth';

function ChatPanelHeader({
  iconName,
  type,
  participantCount,
  isCollapsed,
  onToggle,
  headerChildren,
  isConnected = true,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
}: ChatPanelHeaderProps) {
  const iconNameToggle = isCollapsed ? 'down' : 'up';
  const counts = `${participantCount.toLocaleString()}명${isCollapsed ? '' : ' 참여중'}`;

  let title: string;
  let circle: ReactNode;

  switch (type) {
    case 'global':
      title = isCollapsed ? '전체' : '전체 채팅';
      circle = <IconCircle.Primary name={iconName} size="medium" />;
      break;
    case 'local':
      title = isCollapsed ? '대화방' : '대화방 채팅';
      circle = <IconCircle.Outline name={iconName} size="medium" />;
      break;
  }

  const className = CSSUtil.buildCls(
    styles.header,
    isCollapsed && styles.collapsed,
    isConnected ? styles.connected : styles.disconnected,
  );

  return (
    <div
      id="chat-panel-header"
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {circle}
      <div className={styles.headerContent}>
        <div className={styles.title}>{title}</div>
        <div className={styles.status}>
          <span className={styles.onlineDot} />
          {isConnected ? (
            <span>{counts}</span>
          ) : (
            <span className={styles.connectionStatus}>연결 중...</span>
          )}
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
  children,
  isConnected = true,
  disabled = true,
  initialPosition,
}: ChatPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHeaderHover, setIsHeaderHover] = useState(false);
  const [isHeaderActive, setIsHeaderActive] = useState(false);
  const chattingAreaRef = useRef<HTMLDivElement>(null);
  const floatingWidgetRef = useRef<FloatingWidgetHandle>(null);
  const activePanelId = chatPanelStore((s) => s.activePanelId);
  const setActive = chatPanelStore((s) => s.setActive);
  const isAuthenticated = authStore((s) => s.isAuthenticated);

  const widgetId = type === 'global' ? 'global-chat-panel' : 'local-chat-panel';
  const isActive = activePanelId === widgetId;

  const handleToggle = () => setIsCollapsed(!isCollapsed);

  const scrollToBottom = () => {
    if (!chattingAreaRef.current) return;
    chattingAreaRef.current.scrollTop = chattingAreaRef.current.scrollHeight;
  };

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
    isHeaderHover && styles.headerHover,
    isHeaderActive && styles.headerActive,
  );

  const placeholder = isAuthenticated ? '메시지를 입력하세요...' : '먼저 로그인을 해주세요!';

  return (
    <FloatingWidget
      ref={floatingWidgetRef}
      id={widgetId}
      dragHandleId="chat-panel-header"
      initialPosition={initialPosition}
      onActivate={() => setActive(widgetId)}
      elevated={isActive}
    >
      <div className={className}>
        <ChatPanelHeader
          iconName={iconName}
          type={type}
          participantCount={participantCount}
          isCollapsed={isCollapsed}
          onToggle={handleToggle}
          headerChildren={headerChildren}
          isConnected={isConnected}
          onMouseEnter={() => setIsHeaderHover(true)}
          onMouseLeave={() => {
            setIsHeaderHover(false);
            setIsHeaderActive(false);
          }}
          onMouseDown={() => setIsHeaderActive(true)}
          onMouseUp={() => setIsHeaderActive(false)}
        />
        <div className={styles.content}>
          {children && <div className={styles.panelSection}>{children}</div>}
          <div ref={chattingAreaRef} className={styles.chattingArea}>
            <ChatBubbles chats={chats} />
          </div>
          <div className={styles.messageForm}>
            <MessageForm
              placeholder={placeholder}
              onSubmit={handleMessageSubmit}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </FloatingWidget>
  );
}
