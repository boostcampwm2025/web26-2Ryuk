import './globals.css';
import AuthProvider from '@/app/providers/AuthProvider';
import RoomProvider from '@/app/providers/RoomProvider';
import LoadingProvider from '@/app/providers/LoadingProvider';
import ModalEventDelegation from '@/app/components/shared/modal/ModalEventDelegation';
import Toast from '@/app/components/shared/toast/Toast';
import Header from './components/layout/header/Header';
import { RootLayoutProps } from './type';
import { metadataConfig } from './meta';

export const metadata = metadataConfig;

/**
 * 모든 페이지에 공통으로 적용
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>
        <ModalEventDelegation />
        <AuthProvider>
          <RoomProvider>
            <LoadingProvider>
              <Header />
              <div className="page">{children}</div>
              <Toast />
            </LoadingProvider>
          </RoomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
