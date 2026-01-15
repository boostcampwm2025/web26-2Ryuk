'use client';

import Image from 'next/image';
import styles from './dialog.module.css';
import { DialogProps } from './type';
import { OutlineTextButton, PrimaryTextButton } from '@/app/components/shared/button/TextButton';
import { useModal } from '@/app/components/shared/modal/useModal';
import CSSUtil from '@/utils/css';

export default function Dialog({
  modalId,
  src,
  title,
  content,
  children,
  confirmDisabled = false,
  closeIfConfirm = true,
  isDanger = false,
  confirmText = '확인',
  onCancel,
  onConfirm,
}: DialogProps) {
  const { closeModal } = useModal();

  const handleCancel = () => {
    onCancel?.();
    closeModal(modalId);
  };
  const handleConfirm = () => {
    if (confirmDisabled) return;
    onConfirm?.();
    if (closeIfConfirm) closeModal(modalId);
  };

  const className = CSSUtil.buildCls(styles.dialog, isDanger && styles.danger);

  return (
    <div className={className}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.imageWrapper}>
            <Image src={src} alt="dialog mascot" width={160} height={160} />
          </div>
        </div>
        <div className={styles.body}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.content}>{content}</p>
          {children && <div className={styles.children}>{children}</div>}
        </div>
      </div>
      <div className={styles.footer}>
        <div className={styles.cancelButton}>
          <OutlineTextButton text="취소" onClick={handleCancel} size="medium" />
        </div>
        <div className={styles.confirmButton}>
          <PrimaryTextButton
            text={confirmText}
            onClick={handleConfirm}
            size="medium"
            disabled={confirmDisabled}
          />
        </div>
      </div>
    </div>
  );
}
