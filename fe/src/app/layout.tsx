import './globals.css';
import MSWProvider from '@/app/providers/MSWProvider';
import AuthProvider from '@/app/providers/AuthProvider';
import RoomProvider from '@/app/providers/RoomProvider';
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
        <MSWProvider>
          <AuthProvider>
            <RoomProvider>
              <Header />
              <div className="page">{children}</div>
              <Toast />
            </RoomProvider>
          </AuthProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
