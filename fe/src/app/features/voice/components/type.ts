export interface SpeakerControlButtonProps {
  speakerOn?: boolean;
  onChange?: (state: boolean) => void;
  disabled?: boolean;
}

export interface AudioControlsProps {
  micOn?: boolean;
  speakerOn?: boolean;
  onMicChange?: (state: boolean) => void;
  onSpeakerChange?: (state: boolean) => void;
  disabled?: boolean;
}
