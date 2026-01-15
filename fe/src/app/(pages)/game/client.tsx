'use client';

import useResponsive from '@/app/hooks/useResponsive';
import styles from './page.module.css';
import { PageClientProps } from '../type';

export default function GamePageClient({ children }: PageClientProps) {
  const { status } = useResponsive();
  return <div className={styles[status]}>{children}</div>;
}
