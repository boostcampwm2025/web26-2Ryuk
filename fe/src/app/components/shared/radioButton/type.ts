export interface RadioButtonProps {
  name: string;
  values: string[];
  initialSelected?: number;
  onChange?: (index: number) => void;
  disabled?: boolean;
}
