'use client';

import styles from './stepper.module.css';
import { GhostIconButton } from '@/app/components/shared/icon/IconButton';
import { useState } from 'react';
import { StepperProps } from './type';
import IS from '@/utils/is';

export default function Stepper({
  initialValue = 0,
  suffix = '',
  minValue,
  maxValue,
  onChange,
}: StepperProps) {
  const [value, setValue] = useState<number>(initialValue);

  const handleIncrease = () => {
    if (!IS.nil(maxValue) && value >= maxValue!) return;
    const newValue = value + 1;
    setValue(newValue);
    onChange?.(newValue);
  };

  const handleDecrease = () => {
    if (!IS.nil(minValue) && value <= minValue!) return;
    const newValue = value - 1;
    setValue(newValue);
    onChange?.(newValue);
  };

  const isDecreaseDisabled = !IS.nil(minValue) && value <= minValue!;
  const isIncreaseDisabled = !IS.nil(maxValue) && value >= maxValue!;

  return (
    <div className={styles.stepper}>
      <GhostIconButton
        name="subtract"
        size="medium"
        onClick={handleDecrease}
        disabled={isDecreaseDisabled}
      />
      <div className={styles.value}>
        {value}
        {suffix}
      </div>
      <GhostIconButton
        name="add"
        size="medium"
        onClick={handleIncrease}
        disabled={isIncreaseDisabled}
      />
    </div>
  );
}
