import localFont from 'next/font/local';

/** preload 끄기: 첫 페인트를 ~1.5MB 폰트가 막지 않게 함 (display: swap으로 지연 로드) */
export const pretendard = localFont({
  src: [
    {
      path: '../../public/fonts/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  preload: false,
});
