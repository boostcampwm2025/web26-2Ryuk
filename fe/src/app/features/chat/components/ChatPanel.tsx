'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import ChatBubbles from './ChatBubbles';
import styles from './chat.module.css';
import MessageForm from '@/app/components/shared/form/message/MessageForm';
import {
  ChatPanelProps,
  ChatPanelHeaderProps,
  ChatPanelWidgetId,
  CHAT_PANEL_WIDGET_ID,
  Position,
} from './type';
import * as IconCircle from '@/app/components/shared/icon/IconCircle';
import * as IconButton from '@/app/components/shared/icon/IconButton';
import CSSUtil from '@/utils/css';
import FloatingWidget from '@/app/components/shared/floatingWidget/FloatingWidget';
import { FloatingWidgetHandle } from '@/app/components/shared/floatingWidget/type';
import { chatPanelStore, isDefaultPosition } from '@/app/features/chat/stores/chatPanel';
import { authStore } from '@/app/features/user/stores/auth';
import IS from '@/utils/is';

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
  isUnread = false,
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

  const showUnreadDot = isUnread && isCollapsed;
  const iconWithBadge = (
    <div className={styles.iconWrap}>
      {circle}
      {showUnreadDot && <span className={styles.unreadDot} aria-hidden="true" />}
    </div>
  );

  return (
    <div
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      <div id="chat-panel-header" className={styles.headerDragArea}>
        {iconWithBadge}
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
      </div>
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
  isUnread = false,
}: ChatPanelProps) {
  const panelState = chatPanelStore((s) => s[type]);
  const activePanelId = chatPanelStore((s) => s.activePanelId);
  const setActive = chatPanelStore((s) => s.setActive);
  const setExpanded = chatPanelStore((s) => s.setExpanded);
  const updatePosition = chatPanelStore((s) => s.updatePosition);

  const [isHeaderHover, setIsHeaderHover] = useState(false);
  const [isHeaderActive, setIsHeaderActive] = useState(false);

  const chattingAreaRef = useRef<HTMLDivElement>(null);
  const floatingWidgetRef = useRef<FloatingWidgetHandle>(null);

  const { visible, isExpanded, savedPosition } = panelState;
  const isCollapsed = !isExpanded;

  const widgetId: ChatPanelWidgetId = CHAT_PANEL_WIDGET_ID[type];
  const isActive = activePanelId === widgetId;

  const handleToggle = () => {
    const nextExpanded = !isExpanded;
    setExpanded(type, nextExpanded);
    const animate = !nextExpanded;
    floatingWidgetRef.current?.moveTo(savedPosition, animate ? { animate: true } : undefined);
  };

  const scrollToBottom = () => {
    if (!chattingAreaRef.current) return;
    chattingAreaRef.current.scrollTop = chattingAreaRef.current.scrollHeight;
  };

  useEffect(() => {
    if (isCollapsed) return;
    requestAnimationFrame(scrollToBottom);
  }, [chats, isCollapsed]);

  const ensureInBoundsExpandRef = useRef(false);
  useEffect(() => {
    if (isCollapsed) {
      ensureInBoundsExpandRef.current = false;
      return;
    }
    if (ensureInBoundsExpandRef.current) return;
    const t = setTimeout(() => {
      requestAnimationFrame(() => {
        floatingWidgetRef.current?.ensureInBounds({ persistCorrected: false });
      });
      ensureInBoundsExpandRef.current = true;
    }, 200);
    return () => clearTimeout(t);
  }, [isCollapsed]);

  const hasRunViewportRef = useRef(false);
  const initialExpandedRef = useRef<boolean>();
  if (IS.undefined(initialExpandedRef.current)) initialExpandedRef.current = isExpanded;
  useEffect(() => {
    if (!visible) {
      hasRunViewportRef.current = false;
      return;
    }
    const runViewportSave = isCollapsed || initialExpandedRef.current === true;
    if (!runViewportSave) return;
    if (hasRunViewportRef.current) return;
    hasRunViewportRef.current = true;
    const t = setTimeout(() => {
      floatingWidgetRef.current?.ensureInBounds({ persistCorrected: true });
    }, 100);
    return () => clearTimeout(t);
  }, [visible, isCollapsed]);

  useEffect(() => {
    if (!visible) return;
    const onResize = () => {
      floatingWidgetRef.current?.ensureInBounds({ persistCorrected: true });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [visible]);

  const handleUserDragEnd = (pos: Position) => {
    updatePosition(type, pos, 'user-drag');
  };

  const handleSystemAdjust = (pos: Position) => {
    updatePosition(type, pos, 'system-adjust');
  };

  const handleViewportAdjust = (pos: Position) => {
    updatePosition(type, pos, 'viewport-adjust');
  };

  const handleMessageSubmit = (message: string) => {
    onMessageSubmit?.(message);
    requestAnimationFrame(scrollToBottom);
  };

  const isAuthenticated = authStore((s) => s.isAuthenticated);

  const className = CSSUtil.buildCls(
    styles.chatPanel,
    styles[type],
    isCollapsed && styles.collapsed,
    isHeaderHover && styles.hover,
    isHeaderActive && styles.active,
  );

  const placeholder = isAuthenticated ? '메시지를 입력하세요...' : '먼저 로그인을 해주세요!';

  const initialPosition = isDefaultPosition(savedPosition) ? undefined : savedPosition;

  if (!visible) return null;

  return (
    <FloatingWidget
      ref={floatingWidgetRef}
      id={widgetId}
      dragHandleId="chat-panel-header"
      initialPosition={initialPosition}
      onActivate={() => setActive(widgetId)}
      elevated={isActive}
      onUserDragEnd={handleUserDragEnd}
      onSystemAdjust={handleSystemAdjust}
      onViewportAdjust={handleViewportAdjust}
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
          isUnread={isUnread}
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
