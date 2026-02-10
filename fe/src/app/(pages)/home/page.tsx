import { SEO, PAGE_META, buildMetadata } from '@/app/meta';
import HomeContent from './HomeContent';

const { title, description, ogDescription } = PAGE_META.home;

export const metadata = buildMetadata({
  title,
  description,
  ogDescription,
  url: `${SEO.siteUrl}/home`,
  canonical: `${SEO.siteUrl}/home`,
});

export default function HomePage() {
  return <HomeContent />;
}
