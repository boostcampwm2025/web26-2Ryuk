'use client';

import { ChatBubbleProps } from './type';
import Avatar from '@/app/components/shared/profile/Avatar';
import styles from './chat.module.css';
import CSSUtil from '@/utils/css';
import DateUtil from '@/utils/date';
import Rules from '@/app/shared/rule';
import { useEffect, useState } from 'react';

function ChatBubble({ id, message, sender, timestamp }: ChatBubbleProps) {
  const className = CSSUtil.buildCls(styles.chatBubble, sender.isMe && styles.isMe);
  const displayAuthor = sender.isMe ? `나(${sender.nickname})` : sender.nickname;
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(DateUtil.format(timestamp, { format: Rules.DATETIME_FORMAT.TIME }));
  }, [timestamp]);

  return (
    <div className={className} data-chat-id={id}>
      <div className={styles.avatar}>
        <Avatar nickname={sender.nickname} profileImage={sender.profileImage || ''} />
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.author}>{displayAuthor}</span>
          <span className={styles.time}>{time}</span>
        </div>
        <div className={styles.messageBubble}>
          <div className={styles.message}>{message}</div>
        </div>
      </div>
    </div>
  );
}

export default ChatBubble;
