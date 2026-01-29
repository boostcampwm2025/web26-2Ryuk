'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/app/shared/routes';
import { authStore } from '@/app/features/user/stores/auth';
import { UserService } from '@/app/features/user/services/UserService';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      try {
        // 1. /api/auth/me를 호출하여 사용자 정보 가져오기
        const user = await UserService.getMe();

        // 2. authStore 상태 수동 업데이트
        authStore.setState({
          isAuthenticated: true,
          userId: user.id,
          user: user,
        });

        // 3. 홈으로 리디렉션
        router.replace(ROUTES.HOME);
      } catch {
        // 오류가 발생하면 기존 상태를 초기화하고 홈으로 이동
        authStore.getState().logout();
        router.replace(ROUTES.HOME);
      }
    };

    handleLogin();
  }, [router]);

  return <div>로그인 처리 중...</div>;
}
