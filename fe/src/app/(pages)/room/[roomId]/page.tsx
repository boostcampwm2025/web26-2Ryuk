import type { Metadata } from 'next';
import { SEO, PAGE_META, buildMetadata } from '@/app/meta';
import roomService from '@/app/features/room/services/RoomService';
import RoomContent from './RoomContent';

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { roomId } = await params;

  let room: { title: string; tags: string[] } | null = null;
  try {
    room = await roomService.getRoomJoinInfo(roomId, { server: true });
  } catch {
    /* 조회 실패 시 fallback 메타데이터 사용 */
  }

  const { fallback } = PAGE_META.room;

  if (!room) {
    return buildMetadata({
      title: fallback.title,
      description: fallback.description,
      ogTitle: fallback.ogTitle,
      ogDescription: fallback.ogDescription,
    });
  }

  const title = PAGE_META.room.title(room.title);
  const ogTitle = PAGE_META.room.ogTitle(room.title);
  const tags = room.tags.length > 0 ? room.tags.map((t) => `#${t}`).join(' ') : '';
  const description = PAGE_META.room.description(room.title, tags);
  const url = `${SEO.siteUrl}/room/${roomId}`;

  return buildMetadata({ title, description, ogTitle, url });
}

export default function RoomPage() {
  return <RoomContent />;
}
