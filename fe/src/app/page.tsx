'use client';

import { useEffect } from 'react';
import useNavigation from './hooks/useNavigation';

/**
 * 홈페이지로 리다이렉트
 * `/` -> `/home`
 */
export default function MainPage() {
  const { goHome } = useNavigation();

  useEffect(() => goHome(), [goHome]);

  return null;
}
