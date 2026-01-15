import { modalStore } from './modal.store';

export function useModal() {
  const openModal = modalStore((state) => state.openModal);
  const closeModal = modalStore((state) => state.closeModal);
  const isOpen = modalStore((state) => state.isOpen);

  return { openModal, closeModal, isOpen };
}
