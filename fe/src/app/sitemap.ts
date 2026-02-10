import type { MetadataRoute } from 'next';
import GAMES from '@/app/shared/constant';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/home`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  const rankingPages: MetadataRoute.Sitemap = GAMES.values().map((game) => ({
    url: `${siteUrl}/ranking/${game.ID}`,
    lastModified: now,
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  return [...staticPages, ...rankingPages];
}
