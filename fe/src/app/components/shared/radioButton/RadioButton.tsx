'use client';

import { useState, ChangeEvent } from 'react';
import styles from './radioButton.module.css';
import CSSUtil from '@/utils/css';
import { RadioButtonProps } from './type';

export default function RadioButton({
  name,
  values,
  initialSelected = 0,
  onChange,
  disabled = false,
}: RadioButtonProps) {
  const [selected, setSelected] = useState(initialSelected);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const index = Number.parseInt(event.target.value, 10);
    setSelected(index);
    onChange?.(index);
  };

  const groupClassName = CSSUtil.buildCls(styles.radioButtonGroup, disabled && styles.disabled);

  return (
    <div className={groupClassName}>
      {values.map((value, index) => {
        const isSelected = selected === index;
        const optionClassName = CSSUtil.buildCls(styles.radioOption, isSelected && styles.selected);

        return (
          <label key={index} className={optionClassName}>
            <input
              type="radio"
              name={name}
              value={index}
              checked={isSelected}
              onChange={handleChange}
              className={styles.input}
              disabled={disabled}
            />
            <span className={styles.label}>{value}</span>
          </label>
        );
      })}
    </div>
  );
}
