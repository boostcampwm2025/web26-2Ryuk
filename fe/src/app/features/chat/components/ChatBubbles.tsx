'use client';

import ChatBubble from './ChatBubble';
import styles from './chat.module.css';
import { ChatBubblesProps } from './type';

function ChatBubbles({ chats }: ChatBubblesProps) {
  return (
    <div className={styles.chatBubbles}>
      {chats.map((chat, index) => (
        <ChatBubble
          key={`chatBubble-${index}`}
          id={`chatBubble-${index}`}
          message={chat.message}
          sender={chat.sender}
          timestamp={chat.timestamp}
        />
      ))}
    </div>
  );
}

export default ChatBubbles;
