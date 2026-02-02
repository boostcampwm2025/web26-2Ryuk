'use client';

import { IconButtonBase } from '@/app/components/shared/icon/IconButton';
import { SpeakerControlButtonProps } from './type';

export default function SpeakerControlButton({
  speakerOn,
  onChange,
  disabled = false,
}: SpeakerControlButtonProps) {
  const handleStateChange = () => {
    if (disabled) return;
    onChange?.(!speakerOn);
  };

  return (
    <IconButtonBase
      name={speakerOn ? 'volume' : 'mute'}
      size="small"
      variant={speakerOn ? 'outline' : 'error-secondary'}
      onClick={handleStateChange}
      disabled={disabled}
    />
  );
}
