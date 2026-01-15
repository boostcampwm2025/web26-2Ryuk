'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { modalStore } from './modal.store';
import styles from './modal.module.css';
import { ModalProps } from './type';
import CSSUtil from '@/utils/css';
import { GhostIconButton } from '@/app/components/shared/icon/IconButton';

type Event = React.MouseEvent<HTMLDivElement>;

export default function Modal({
  id,
  children,
  closeOnBackdropClick = true,
  showCloseButton = false,
}: ModalProps) {
  const openModals = modalStore((state) => state.openModals);
  const closeModal = modalStore((state) => state.closeModal);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => setMounted(true), []);

  const isOpen = openModals.has(id);

  useEffect(() => {
    if (isOpen && mounted) requestAnimationFrame(() => setIsVisible(true));
    else setIsVisible(false);
  }, [isOpen, mounted]);

  if (!mounted || !isOpen) return null;

  const handleContentClick = (e: Event) => e.stopPropagation();
  const handleBackdropClick = (e: Event) => {
    if (!closeOnBackdropClick) return;
    if (e.target === e.currentTarget) closeModal(id);
  };

  const handleCloseClick = () => closeModal(id);

  const className = CSSUtil.buildCls(styles.backdrop, isVisible && styles.visible);

  return createPortal(
    <div className={className} onClick={handleBackdropClick}>
      <div className={styles.content} onClick={handleContentClick}>
        {showCloseButton && (
          <div className={styles.closeButton}>
            <GhostIconButton name="close" size="medium" onClick={handleCloseClick} />
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
