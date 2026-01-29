export interface DropdownItem {
  label: string;
  value: string;
}

export interface DropdownProps {
  items: DropdownItem[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}
