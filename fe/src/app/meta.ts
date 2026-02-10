import { Metadata } from 'next';
import Paths from './shared/path';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!siteUrl) throw Error('환경변수가 없습니다: NEXT_PUBLIC_SITE_URL');

export const SEO = {
  siteName: '물방울톡',
  siteUrl,
  defaultDescription:
    '누구나 가볍게 참여하고 자연스럽게 대화를 이어갈 수 있도록 돕는, 부담 없는 음성 기반 소셜 서비스, 물방울톡',
  ogImage: {
    url: Paths.images('og', '1200x630', 'png'),
    width: 1200,
    height: 630,
    alt: '물방울톡 — 실시간 음성 채팅 & 미니게임 커뮤니티',
  },
} as const;

export const PAGE_META = {
  home: {
    title: '물방울톡',
    description:
      '물방울톡에서 실시간 음성 채팅으로 소통하고, 비커 채우기 / 반응속도 테스트 / 물방울 캐치 등 다양한 미니게임에 도전하세요. 게임별 랭킹으로 친구들과 경쟁할 수 있습니다.',
    ogDescription:
      '실시간 음성 채팅과 미니게임을 한 곳에서. 친구들과 함께 플레이하고 랭킹에 도전하세요.',
  },

  ranking: {
    fallbackGameName: '미니게임',
    title: (gameName: string) => `${gameName} 랭킹 — 물방울톡 전체 순위`,
    description: (gameName: string, gameDesc?: string) =>
      gameDesc
        ? `${gameName} 전체 플레이어 랭킹을 확인하세요. ${gameDesc}`
        : '물방울톡에서 진행되는 미니게임의 전체 랭킹을 확인하세요.',
  },

  room: {
    fallback: {
      title: '대화방 — 물방울톡',
      description: '물방울톡 대화방에 초대받았어요! 실시간 음성 채팅과 미니게임을 함께 즐기세요.',
      ogTitle: '대화방에 초대받았어요! — 물방울톡',
      ogDescription: '실시간 음성 채팅과 미니게임을 함께 즐기세요.',
    },
    title: (roomTitle: string) => `${roomTitle} — 물방울톡 대화방`,
    ogTitle: (roomTitle: string) => `「${roomTitle}」에 초대받았어요! — 물방울톡`,
    description: (roomTitle: string, tags: string) =>
      tags
        ? `「${roomTitle}」에서 함께 대화해요! ${tags} · 물방울톡에서 실시간 음성 채팅과 미니게임을 즐기세요.`
        : `「${roomTitle}」에서 함께 대화해요! 물방울톡에서 실시간 음성 채팅과 미니게임을 즐기세요.`,
  },
};

type MetadataInput = {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  url?: string;
  canonical?: string;
};

export function buildMetadata({
  title,
  description,
  ogTitle,
  ogDescription,
  url,
  canonical,
}: MetadataInput): Metadata {
  const og = ogTitle ?? title;
  const ogDesc = ogDescription ?? description;
  return {
    title,
    description,
    openGraph: {
      title: og,
      description: ogDesc,
      ...(url && { url }),
      images: [SEO.ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: og,
      description: ogDesc,
      images: [SEO.ogImage.url],
    },
    ...(canonical && { alternates: { canonical } }),
  };
}

export const metadataConfig: Metadata = {
  metadataBase: new URL(SEO.siteUrl),
  title: {
    default: SEO.siteName,
    template: `%s | ${SEO.siteName}`,
  },
  description: SEO.defaultDescription,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SEO.siteUrl,
    siteName: SEO.siteName,
    title: SEO.siteName,
    description: SEO.defaultDescription,
    images: [SEO.ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.siteName,
    description: SEO.defaultDescription,
    images: [SEO.ogImage.url],
  },
  icons: {
    icon: Paths.images('logo_circle'),
    apple: Paths.images('logo_circle'),
  },
};
