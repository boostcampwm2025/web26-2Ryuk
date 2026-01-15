export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

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
