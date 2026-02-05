'use client';

import HeroSection from '@/app/components/layout/heroSection/HeroSection';
import RealtimeRoomsSection from '@/app/features/room/components/RealtimeRoomsSection';
import styles from './page.module.css';
import useResponsive from '@/app/hooks/useResponsive';
import GlobalChatPanel from '@/app/features/chat/components/GlobalChatPanel';
import RankingSection from '@/app/features/gameRecords/components/RankingSection';
import { RoomData } from '@/app/features/room/dtos/data';
import { GameRecordListData } from '@/app/features/gameRecords/dtos/data';

interface HomePageClientProps {
  initialRooms: RoomData[];
  initialRanking: GameRecordListData;
}

export default function HomePageClient({ initialRooms, initialRanking }: HomePageClientProps) {
  const { status } = useResponsive();

  return (
    <div className={styles[status]}>
      <div className="content">
        <div className={styles.contentWrapper}>
          <div className={styles.topSection}>
            <HeroSection />
            <div className={styles.sideWidgets}>
              <RankingSection initialRanking={initialRanking} />
            </div>
          </div>
          <RealtimeRoomsSection initialRooms={initialRooms} />
        </div>
      </div>
      <GlobalChatPanel />
    </div>
  );
}
