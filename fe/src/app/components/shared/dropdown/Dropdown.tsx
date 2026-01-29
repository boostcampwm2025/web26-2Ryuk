'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './dropdown.module.css';
import { DropdownProps } from './type';
import Icon from '../icon/Icon';
import CSSUtil from '@/utils/css';
import IS from '@/utils/is';

export default function Dropdown({
  items,
  value: initialValue,
  placeholder = 'Dropdown',
  onChange,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<string | undefined>(initialValue);

  useEffect(() => {
    if (IS.undefined(initialValue)) return;
    setValue(initialValue);
  }, [initialValue]);

  const selectedItem = items.find((item) => item.value === value);
  const displayText = selectedItem?.label || placeholder;
  const isPlaceholder = !selectedItem;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setIsOpen(false);
    };

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    onChange?.(selectedValue);
    setIsOpen(false);
  };

  const dropdownClassName = CSSUtil.buildCls(
    styles.dropdown,
    isOpen && styles.isOpen,
    isPlaceholder && styles.isPlaceholder,
    disabled && styles.disabled,
  );

  return (
    <div ref={dropdownRef} className={dropdownClassName}>
      <button
        type="button"
        className={styles.button}
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.label}>{displayText}</span>
        <div className={styles.icon}>
          <Icon name="down" size="small" />
        </div>
      </button>
      {isOpen && (
        <div className={styles.menu} role="listbox">
          {items.map((item) => {
            const isSelected = item.value === value;
            const className = CSSUtil.buildCls(
              styles.menuItem,
              isSelected && styles.menuItemSelected,
            );

            return (
              <button
                key={item.value}
                type="button"
                className={className}
                onClick={() => handleSelect(item.value)}
                role="option"
                aria-selected={isSelected}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
