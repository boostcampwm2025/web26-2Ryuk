import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/home', '/ranking/'],
        disallow: ['/room/', '/auth/', '/components/', '/api/'],
      },
    ],
    sitemap: siteUrl ? `${siteUrl}/sitemap.xml` : undefined,
  };
}
