'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import CSSUtil from '@/utils/css';
import styles from './textfield.module.css';
import { TextfieldProps, type InputType } from './type';
import Icon from '@/app/components/shared/icon/Icon';

function TextfieldBase({
  placeholder,
  initialValue = '',
  value: controlledValue,
  onChange,
  onKeyDown,
  onBlur,
  onCompositionStart,
  onCompositionEnd,
  hidable = false,
  disabled = false,
  maxLength,
  variant,
}: TextfieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [internalValue, setInternalValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const className = CSSUtil.buildCls(
    styles.textfield,
    styles[variant],
    disabled && styles.disabled,
  );

  const handleContainerClick = () => {
    if (disabled || !inputRef.current) return;
    inputRef.current.focus();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputText = event.target.value;
    const nextValue =
      maxLength && inputText.length > maxLength ? inputText.slice(0, maxLength) : inputText;

    if (!isControlled) setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  let inputType: InputType = 'text';
  let iconToShow: 'show' | 'hide' | undefined;

  if (hidable) {
    inputType = isVisible ? 'text' : 'password';
    iconToShow = isVisible ? 'show' : 'hide';
  }

  return (
    <div className={className} onClick={handleContainerClick}>
      <input
        ref={inputRef}
        type={inputType}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        disabled={disabled}
        className={styles.input}
        autoComplete="off"
      />
      {hidable && (
        <button
          type="button"
          className={styles.iconButton}
          onClick={handleToggleVisibility}
          disabled={disabled}
        >
          <Icon name={iconToShow || 'hide'} size="medium" />
        </button>
      )}
    </div>
  );
}

export function PrimaryTextfield(props: Omit<TextfieldProps, 'variant'>) {
  return <TextfieldBase {...props} variant="primary" />;
}

export function OutlineTextfield(props: Omit<TextfieldProps, 'variant'>) {
  return <TextfieldBase {...props} variant="outline" />;
}

export function DefaultTextfield(props: Omit<TextfieldProps, 'variant'>) {
  return <TextfieldBase {...props} variant="default" />;
}

export {
  PrimaryTextfield as Primary,
  OutlineTextfield as Outline,
  DefaultTextfield as Default,
} from './Textfield';
