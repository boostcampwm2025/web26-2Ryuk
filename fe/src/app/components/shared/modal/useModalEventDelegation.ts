'use client';

import { useEffect } from 'react';
import { modalStore } from './modal.store';

/**
 * modal-id 속성을 가진 버튼 클릭 이벤트를 처리하는 hook
 */
export function useModalEventDelegation() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button[modal-id]');
      if (!button) return;
      const modalId = button.getAttribute('modal-id');
      if (!modalId) return;
      e.preventDefault();
      modalStore.getState().openModal(modalId);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
}
