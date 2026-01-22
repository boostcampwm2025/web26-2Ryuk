export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'success-primary'
  | 'success-secondary'
  | 'warning-primary'
  | 'warning-secondary'
  | 'error-primary'
  | 'error-secondary';

export interface TextButtonProps {
  iconName?: string;
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  size: ButtonSize;
  variant: ButtonVariant;
  type?: 'button' | 'submit' | 'reset';
  modalId?: string;
}

export interface GoBackButtonProps {
  text?: string;
  onClick?: () => void;
  modalId?: string;
}
