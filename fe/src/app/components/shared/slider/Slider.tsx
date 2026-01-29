'use client';

import { type ChangeEvent, type CSSProperties } from 'react';
import CSSUtil from '@/utils/css';
import styles from './slider.module.css';
import { SliderProps } from './type';

export function SliderBase({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  disabled = false,
  variant = 'primary',
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const style = { '--slider-percentage': `${percentage}%` } as CSSProperties;

  const className = CSSUtil.buildCls(styles.slider, styles[variant], disabled && styles.disabled);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    onChange?.(Number(newValue.toFixed(3)));
  };

  return (
    <input
      type="range"
      className={className}
      min={min}
      max={max}
      step={step}
      value={value} // 부모가 준 value를 그대로 렌더링
      onChange={handleChange}
      disabled={disabled}
      style={style}
    />
  );
}

export function PrimarySlider(props: Omit<SliderProps, 'variant'>) {
  return <SliderBase {...props} variant="primary" />;
}

export function SecondarySlider(props: Omit<SliderProps, 'variant'>) {
  return <SliderBase {...props} variant="secondary" />;
}

export { PrimarySlider as Primary, SecondarySlider as Secondary } from './Slider';
