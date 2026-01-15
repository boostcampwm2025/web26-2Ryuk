import { ReactNode } from 'react';

export interface DialogProps {
  modalId: string;
  src: string;
  title: string;
  content: string;
  children?: ReactNode;
  confirmDisabled?: boolean;
  closeIfConfirm?: boolean;
  isDanger?: boolean;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
}
