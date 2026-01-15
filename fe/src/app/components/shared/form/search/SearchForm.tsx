'use client';

import { useState, useRef, type ChangeEvent, type KeyboardEvent, type FocusEvent } from 'react';
import styles from './searchForm.module.css';
import CSSUtil from '@/utils/css';
import Icon from '@/app/components/shared/icon/Icon';
import { SearchFormProps } from './type';

export default function SearchForm({
  placeholder = 'Search',
  initialValue = '',
  onChange,
  onSubmit,
}: SearchFormProps) {
  const [value, setValue] = useState(initialValue);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const expand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const collapse = () => setIsExpanded(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setValue(next);
    onChange?.(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    handleSubmit();
  };

  const handleSubmit = () => {
    // expand되지 않은 상태에서는 검색하지 않음
    if (!isExpanded) return;
    onSubmit?.(value);
  };

  const handleWrapperBlur = (event: FocusEvent<HTMLDivElement>) => {
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && event.currentTarget.contains(relatedTarget)) return;
    if (!value) collapse();
  };

  const handleWrapperClick = () => {
    if (!isExpanded) expand();
  };

  const handleIconClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isExpanded) expand();
    else handleSubmit();
  };

  const className = CSSUtil.buildCls(styles.searchForm, isExpanded && styles.expanded);

  return (
    <div
      className={className}
      onClick={handleWrapperClick}
      onBlur={handleWrapperBlur}
      tabIndex={-1}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={styles.input}
      />
      <button type="button" className={styles.icon} onClick={handleIconClick}>
        <Icon name="search" size="medium" />
      </button>
    </div>
  );
}
