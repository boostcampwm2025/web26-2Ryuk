'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toastStore } from './toast.store';
import styles from './toast.module.css';
import CSSUtil from '@/utils/css';

export default function Toast() {
  const toasts = toastStore((state) => state.toasts);
  const removeToast = toastStore((state) => state.removeToast);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={CSSUtil.buildCls(styles.toast, styles[toast.type])}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}
