export interface SpeakerControlButtonProps {
  initialState?: boolean;
  onChange?: (state: boolean) => void;
}

export interface AudioControlsProps {
  initialMicState?: boolean;
  initialSpeakerState?: boolean;
  onMicChange?: (state: boolean) => void;
  onSpeakerChange?: (state: boolean) => void;
}
