'use client';

import CSSUtil from '@/utils/css';
import type { CSSProperties, ReactNode } from 'react';
import styles from './table.module.css';

interface TableCellProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function TableCell({ children, className, style }: TableCellProps) {
  const cellClass = CSSUtil.buildCls(styles.cell, className);
  return (
    <div className={cellClass} style={style}>
      {children}
    </div>
  );
}
