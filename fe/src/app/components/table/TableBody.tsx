'use client';

import type { CSSProperties } from 'react';
import type { TableColumn, TableProps } from './types';
import TableRow from './TableRow';
import styles from './table.module.css';

interface TableBodyProps<T> {
  columns: TableColumn<T>[];
  columnStyles: CSSProperties[];
  data: T[];
  getRowKey: TableProps<T>['getRowKey'];
  highlightRow?: TableProps<T>['highlightRow'];
  onRowClick?: TableProps<T>['onRowClick'];
}

export default function TableBody<T>({
  columns,
  columnStyles,
  data,
  getRowKey,
  highlightRow,
  onRowClick,
}: TableBodyProps<T>) {
  return (
    <div className={styles.body}>
      {data.map((row, index) => (
        <TableRow
          key={getRowKey(row, index)}
          row={row}
          columns={columns}
          columnStyles={columnStyles}
          highlight={highlightRow ? highlightRow(row) : false}
          onRowClick={onRowClick}
        />
      ))}
    </div>
  );
}
