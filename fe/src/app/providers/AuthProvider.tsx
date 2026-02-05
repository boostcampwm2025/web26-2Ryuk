'use client';

import { useEffect } from 'react';
import { AuthService } from '@/app/features/user/services/AuthService';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    AuthService.initialize();
  }, []);

  return <>{children}</>;
}
