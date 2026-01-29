import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  width: number | 'auto';
  minWidth?: number;
  render: (row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string;
  highlightRow?: (row: T) => boolean;
  onRowClick?: (row: T) => void;
}
