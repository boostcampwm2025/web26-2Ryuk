'use client';

import { usePathname } from 'next/navigation';
import { roomStore } from '@/app/features/room/stores/room';
import LocalChatPanel from '@/app/features/chat/components/LocalChatPanel';
import VoiceAudioLayer from '@/app/features/voice/components/VoiceAudioLayer';
import { PageLayoutProps } from '@/app/(pages)/type';

/**
 * 모든 페이지에 공통으로 적용
 */
export default function PageLayout({ children }: PageLayoutProps) {
  const pathname = usePathname();
  const roomId = roomStore((state) => state.id);
  const isRoomPage = pathname ? /^\/room\/[^/]+\/?$/.test(pathname) : false;

  return (
    <>
      {children}
      {roomId && !isRoomPage && <LocalChatPanel />}
      {roomId && <VoiceAudioLayer />}
    </>
  );
}
