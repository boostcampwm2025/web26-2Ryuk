import dynamic from 'next/dynamic';
import './globals.css';
import AuthProvider from '@/app/providers/AuthProvider';
import RoomProvider from '@/app/providers/RoomProvider';
import LoadingProvider from '@/app/providers/LoadingProvider';
import Header from './components/layout/header/Header';
import { RootLayoutProps } from './type';
import { metadataConfig } from './meta';

// ModalEventDelegation 컴포넌트를 동적으로 임포트
const DynamicModalEventDelegation = dynamic(
  () => import('@/app/components/shared/modal/ModalEventDelegation'),
  { ssr: false }, // 클라이언트 측에서만 로드
);

// Toast 컴포넌트를 동적으로 임포트
const DynamicToast = dynamic(() => import('@/app/components/shared/toast/Toast'), { ssr: false });

export const metadata = metadataConfig;

/**
 * 모든 페이지에 공통으로 적용
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <head></head>
      <body>
        <DynamicModalEventDelegation />
        <AuthProvider>
          <RoomProvider>
            <LoadingProvider>
              <Header />
              <div className="page">{children}</div>
              <DynamicToast />
            </LoadingProvider>
          </RoomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
