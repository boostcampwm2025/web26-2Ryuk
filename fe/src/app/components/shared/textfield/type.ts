export type TextfieldVariant = 'primary' | 'outline' | 'default';
export type InputType = 'text' | 'password';

export interface TextfieldProps {
  placeholder?: string;
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCompositionStart?: (e: React.CompositionEvent<HTMLInputElement>) => void;
  onCompositionEnd?: (e: React.CompositionEvent<HTMLInputElement>) => void;
  hidable?: boolean;
  disabled?: boolean;
  variant: TextfieldVariant;
}
