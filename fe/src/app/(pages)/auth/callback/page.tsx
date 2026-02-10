'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/app/shared/routes';
import { AuthService } from '@/app/features/user/services/AuthService';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      try {
        await AuthService.loginWithCallback();
      } catch {
        AuthService.logout({ skipApi: true });
      } finally {
        // 1순위: 백엔드가 OAuth state 로 전달한 query param
        const queryRedirect = new URLSearchParams(window.location.search).get('redirect');
        // 2순위: 프론트에서 OAuth 전 저장한 sessionStorage
        const storageRedirect = sessionStorage.getItem('auth-redirect');
        sessionStorage.removeItem('auth-redirect');

        const redirectPath = queryRedirect || storageRedirect || ROUTES.HOME;
        router.replace(redirectPath);
      }
    };

    handleLogin();
  }, [router]);

  return <div>로그인 처리 중...</div>;
}
