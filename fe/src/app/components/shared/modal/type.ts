import { ReactNode } from 'react';

export interface ModalProps {
  id: string;
  children: ReactNode;
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
}
