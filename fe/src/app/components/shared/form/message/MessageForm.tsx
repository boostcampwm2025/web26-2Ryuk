'use client';

import { FormEvent, useState } from 'react';
import { PrimaryTextfield } from '@/app/components/shared/textfield/Textfield';
import { PrimaryIconButton } from '@/app/components/shared/icon/IconButton';
import styles from './messageForm.module.css';

interface MessageFormProps {
  placeholder?: string;
  onSubmit?: (message: string) => void;
  disabled?: boolean;
}

export default function MessageForm({
  placeholder = 'MessageForm',
  onSubmit,
  disabled = false,
}: MessageFormProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    onSubmit?.(message.trim());
    setMessage('');
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <form className={styles.messageForm} onSubmit={handleFormSubmit}>
      <div className={styles.inputWrapper}>
        <PrimaryTextfield
          placeholder={placeholder}
          initialValue={message}
          value={message}
          onChange={setMessage}
          disabled={disabled}
        />
      </div>
      <PrimaryIconButton
        name="send"
        size="medium"
        disabled={disabled || !message.trim()}
        onClick={handleSubmit}
      />
    </form>
  );
}
