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
  onCompositionStart,
  onCompositionEnd,
  hidable = false,
  disabled = false,
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
    const text = event.target.value;
    if (!isControlled) setInternalValue(text);
    onChange?.(text);
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  let inputType: InputType = 'text';
  let iconToShow: 'show' | 'hide' | undefined = undefined;

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
        onChange={handleChange}
        onKeyDown={onKeyDown}
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
