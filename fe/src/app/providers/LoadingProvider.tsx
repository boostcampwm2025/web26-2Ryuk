'use client';

import Loading from '@/app/loading';
import { loadingStore } from '@/app/features/loading/stores/loading';

interface LoadingProviderProps {
  children: React.ReactNode;
}

export default function LoadingProvider({ children }: LoadingProviderProps) {
  const isLoading = loadingStore((state) => state.loading);

  return (
    <>
      {children}
      {isLoading && <Loading />}
    </>
  );
}
