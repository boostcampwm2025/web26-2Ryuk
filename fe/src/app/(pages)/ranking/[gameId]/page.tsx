import type { Metadata } from 'next';
import { SEO, PAGE_META, buildMetadata } from '@/app/meta';
import GAMES from '@/app/shared/constant';
import RankingContent from './RankingContent';

type RankingPageProps = {
  params: Promise<{ gameId: string }>;
};

export async function generateMetadata({ params }: RankingPageProps): Promise<Metadata> {
  const { gameId } = await params;
  const game = GAMES.fromId(gameId);
  const gameName = game?.TITLE ?? PAGE_META.ranking.fallbackGameName;

  const title = PAGE_META.ranking.title(gameName);
  const description = PAGE_META.ranking.description(gameName, game?.DESCRIPTION);
  const url = `${SEO.siteUrl}/ranking/${gameId}`;

  return buildMetadata({ title, description, url, canonical: url });
}

export default function RankingPage() {
  return <RankingContent />;
}
