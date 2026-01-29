'use client';

'use client';

'use client';

import type { CSSProperties } from 'react';
import CSSUtil from '@/utils/css';
import type { TableColumn } from './types';
import TableCell from './TableCell';
import styles from './table.module.css';

interface TableRowProps<T> {
  row: T;
  columns: TableColumn<T>[];
  columnStyles: CSSProperties[];
  highlight?: boolean;
  onRowClick?: (row: T) => void;
}

const getCellClass = (column: TableColumn<any>) => {
  const classes = [];
  switch (column.key) {
    case 'rank':
      classes.push(styles.rankCell);
      break;
    case 'profile':
      classes.push(styles.profileCell);
      break;
    case 'nickname':
      classes.push(styles.nicknameCell);
      break;
    case 'score':
      classes.push(styles.scoreCell);
      break;
    case 'achieveDate':
      classes.push(styles.achieveDateCell);
      break;
  }
  if (column.width === 'auto') {
    classes.push(styles.alignLeft);
  }
  return CSSUtil.buildCls(...classes);
};

export default function TableRow<T>({
  row,
  columns,
  columnStyles,
  highlight,
  onRowClick,
}: TableRowProps<T>) {
  const className = CSSUtil.buildCls(styles.row, highlight ? styles.highlight : undefined);

  const handleRowClick = () => {
    if (!onRowClick) return;
    onRowClick(row);
  };

  const rankValue = typeof (row as any).rank === 'number' ? (row as any).rank : undefined;
  return (
    <div className={className} onClick={handleRowClick} data-row-rank={rankValue}>
      {columns.map((column, index) => (
        <TableCell
          key={`${column.key}-${index}`}
          className={getCellClass(column)}
          style={columnStyles[index]}
        >
          {column.render(row)}
        </TableCell>
      ))}
    </div>
  );
}
