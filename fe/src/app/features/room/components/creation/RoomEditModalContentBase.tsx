'use client';

import { ReactNode } from 'react';
import styles from './roomEditForm.module.css';
import Paths from '@/app/shared/path';
import Image from 'next/image';

interface RoomEditModalContentBaseProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function RoomEditModalContentBase({
  title,
  subtitle,
  children,
}: RoomEditModalContentBaseProps) {
  return (
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <div className={styles.modalHeaderContent}>
          <h1 className={styles.modalTitle}>{title}</h1>
          <p className={styles.modalSubtitle}>{subtitle}</p>
        </div>
        <Image src={Paths.images('mascot')} alt="mascot" width={72} height={72} />
      </div>
      {children}
    </div>
  );
}
