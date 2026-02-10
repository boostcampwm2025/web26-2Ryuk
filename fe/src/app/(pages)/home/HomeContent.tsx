'use client';

import '@/app/page.css';
import HeroSection from '@/app/components/layout/heroSection/HeroSection';
import RealtimeRoomsSection from '@/app/features/room/components/RealtimeRoomsSection';
import styles from './page.module.css';
import useResponsive from '@/app/hooks/useResponsive';
import GlobalChatPanel from '@/app/features/chat/components/GlobalChatPanel';
import RankingSection from '@/app/features/gameRecords/components/RankingSection';

export default function HomeContent() {
  const { status } = useResponsive();

  return (
    <div className={styles[status]}>
      <div className="content">
        <div className={styles.contentWrapper}>
          <div className={styles.topSection}>
            <HeroSection />
            <div className={styles.sideWidgets}>
              <RankingSection />
            </div>
          </div>
          <RealtimeRoomsSection />
        </div>
      </div>
      <GlobalChatPanel />
    </div>
  );
}
