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
        router.replace(ROUTES.HOME);
      }
    };

    handleLogin();
  }, [router]);

  return <div>로그인 처리 중...</div>;
}
