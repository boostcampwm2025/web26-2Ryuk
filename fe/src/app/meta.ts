import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const siteName = '물방울톡';
const defaultDescription = '물방울톡 - 실시간 음성 채팅 및 커뮤니티 플랫폼';

if (!siteUrl) throw Error('환경변수가 없습니다: NEXT_PUBLIC_SITE_URL');

export const metadataConfig: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: siteName,
    title: siteName,
    description: defaultDescription,
    images: [
      {
        url: '/images/logo_circle.100x100.png',
        width: 100,
        height: 100,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: siteName,
    description: defaultDescription,
    images: ['/images/logo_circle.100x100.png'],
  },
  icons: {
    icon: '/images/logo_circle.100x100.png',
    apple: '/images/logo_circle.100x100.png',
  },
};
