'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import IS from '@/utils/is';

/**
 * MSW Provider
 *
 * 개발 환경에서만 MSW 활성화
 * MSW는 같은 origin의 요청만 가로챌 수 있으므로,
 * 모든 API 요청은 상대 경로(/api/**)로 호출되어야 합니다.
 *
 * 동작 방식:
 * 1. MSW 핸들러가 정의된 API → MSW가 mock 응답 반환
 * 2. MSW 핸들러가 없는 API → 'bypass'로 실제 네트워크 요청 전달
 * 3. Next.js rewrites가 /api/** 요청을 http://localhost:4000/api/**로 프록시
 */
export default function MSWProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 서버 사이드에서는 MSW 초기화하지 않음
    if (IS.undefined(window) || process.env.NODE_ENV !== 'development') {
      setIsReady(true);
      return;
    }

    // 클라이언트 사이드에서만 동적 import로 MSW 초기화
    (async () => {
      try {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          serviceWorker: {
            url: '/mockServiceWorker.js',
          },
          onUnhandledRequest: 'bypass',
        });
      } catch (error) {
        console.error('[MSWProvider] Failed to start MSW:', error);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  if (!isReady) return null;

  return <>{children}</>;
}
