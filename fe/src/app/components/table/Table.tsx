'use client';

import type { CSSProperties } from 'react';
import TableBody from './TableBody';
import TableHeader from './TableHeader';
import type { TableProps } from './types';
import styles from './table.module.css';

export default function Table<T>(props: TableProps<T>) {
  const { columns } = props;

  const columnStyles: CSSProperties[] = columns.map((column) => {
    const style = {
      '--table-col-width': column.width === 'auto' ? 'auto' : `${column.width}px`,
      '--table-col-flex': column.width === 'auto' ? '1' : '0',
      '--table-col-min-width': column.minWidth ? `${column.minWidth}px` : 'auto',
    } as CSSProperties;
    return style;
  });

  return (
    <div className={styles.table}>
      <TableHeader columns={columns} columnStyles={columnStyles} />
      <TableBody {...props} columnStyles={columnStyles} />
    </div>
  );
}
