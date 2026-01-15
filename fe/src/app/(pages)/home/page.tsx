'use client';

import '@/app/page.css';
import HeroSection from '@/app/components/layout/heroSection/HeroSection';
import PopularPostsSection from '@/app/features/post/components/PopularPosts.server';
import RealtimeRoomsSection from '@/app/features/room/components/RealtimeRoomsSection';
import styles from './page.module.css';
import useResponsive from '@/app/hooks/useResponsive';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import LocalChatPanel from '@/app/features/chat/components/LocalChatPanel';
import GlobalChatPanel from '@/app/features/chat/components/GlobalChatPanel';

export default function HomePage() {
  const { status } = useResponsive();
  const roomId = roomStore((state: RoomStore) => state.roomId);
  const isJoined = roomStore((state: RoomStore) => state.isJoined);

  return (
    <div className={styles[status]}>
      <div className="content">
        <div className={styles.contentWrapper}>
          <div className={styles.topSection}>
            <HeroSection />
            <div>
              <PopularPostsSection />
            </div>
          </div>
          <RealtimeRoomsSection />
        </div>
      </div>
      <div className={styles.chatContainer}>
        <GlobalChatPanel />
        {roomId && isJoined && <LocalChatPanel />}
      </div>
    </div>
  );
}
