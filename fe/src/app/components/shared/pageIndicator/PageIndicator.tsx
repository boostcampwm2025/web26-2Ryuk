'use client';

import CSSUtil from '@/utils/css';
import styles from './pageIndicator.module.css';
import * as IconButton from '@/app/components/shared/icon/IconButton';

interface PageIndicatorProps {
  page: number;
  maxPage: number;
  onNextClick?: () => void;
  onPrevClick?: () => void;
  onPageSelect?: (page: number) => void;
}

const clampPage = (value: number, max: number) => {
  const normalizedMax = Math.max(1, max);
  return Math.min(Math.max(value, 1), normalizedMax);
};

const getStartPage = (page: number) => {
  return Math.floor((page - 1) / 5) * 5 + 1;
};

export default function PageIndicator({
  page,
  maxPage,
  onPrevClick,
  onNextClick,
  onPageSelect,
}: PageIndicatorProps) {
  const normalizedMax = Math.max(1, maxPage ?? 1);
  const safePage = clampPage(page, normalizedMax);
  const startPage = getStartPage(safePage);
  const pageNumbers = [];
  for (let index = 0; index < 5; index += 1) {
    const current = startPage + index;
    if (current > normalizedMax) break;
    pageNumbers.push(current);
  }

  const hasPrevBlock = startPage > 1;
  const hasNextBlock = startPage + 5 <= normalizedMax;
  const prevTarget = Math.max(1, startPage - 1);
  const nextTarget = startPage + 5;

  const handlePrevClick = () => {
    if (!hasPrevBlock) return;
    onPageSelect?.(prevTarget);
    onPrevClick?.();
  };

  const handleNextClick = () => {
    if (!hasNextBlock) return;
    onPageSelect?.(Math.min(nextTarget, normalizedMax));
    onNextClick?.();
  };

  return (
    <div className={styles.container}>
      <IconButton.Ghost
        name="left"
        size="small"
        onClick={handlePrevClick}
        disabled={!hasPrevBlock}
      />
      <div className={styles.pages}>
        {pageNumbers.map((pageNumber) => {
          const isSelected = pageNumber === safePage;
          const className = CSSUtil.buildCls(
            styles.pageButton,
            isSelected && styles.selected,
            'clickable',
          );
          return (
            <button
              key={pageNumber}
              type="button"
              className={className}
              onClick={() => onPageSelect?.(pageNumber)}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>
      <IconButton.Ghost
        name="right"
        size="small"
        onClick={handleNextClick}
        disabled={!hasNextBlock}
      />
    </div>
  );
}
