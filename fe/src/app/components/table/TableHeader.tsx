'use client';

'use client';

import type { CSSProperties } from 'react';
import CSSUtil from '@/utils/css';
import type { TableColumn } from './types';
import TableCell from './TableCell';
import styles from './table.module.css';

interface TableHeaderProps<T> {
  columns: TableColumn<T>[];
  columnStyles: CSSProperties[];
}

const getHeaderClass = (column: TableColumn<any>) => {
  const classes = [styles.headerCell];
  if (column.width === 'auto') {
    classes.push(styles.headerCellAuto);
  }
  return CSSUtil.buildCls(...classes);
};

export default function TableHeader<T>({ columns, columnStyles }: TableHeaderProps<T>) {
  return (
    <div className={styles.header}>
      {columns.map((column, index) => (
        <TableCell key={column.key} className={getHeaderClass(column)} style={columnStyles[index]}>
          {column.header}
        </TableCell>
      ))}
    </div>
  );
}
