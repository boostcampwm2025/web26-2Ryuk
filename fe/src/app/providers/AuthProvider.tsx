'use client';

import { useEffect } from 'react';
import { authStore } from '../features/user/stores/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 이미 hydration 완료된 경우
    if (authStore.persist.hasHydrated()) {
      authStore.getState().initialize();
      return;
    }

    // hydration 완료 시점에 initialize 1회 실행
    const unsub = authStore.persist.onFinishHydration(() => {
      authStore.getState().initialize();
    });

    return unsub;
  }, []);

  return <>{children}</>;
}
