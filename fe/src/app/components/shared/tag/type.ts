export interface TagSelectorProps {
  defaultTags?: string[];
  selectedTags?: string[];
  onChange?: (selectedTags: string[]) => void;
  placeholder?: string;
  maxLength?: number;
  maxCount?: number;
}
