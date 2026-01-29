'use client';

import { OutlineIconButton } from '@/app/components/shared/icon/IconButton';
import { SpeakerControlButtonProps } from './type';

export default function SpeakerControlButton({ speakerOn, onChange }: SpeakerControlButtonProps) {
  const handleStateChange = () => {
    onChange?.(!speakerOn);
  };

  return (
    <OutlineIconButton
      name={speakerOn ? 'volume' : 'mute'}
      size="small"
      themeColor={speakerOn ? 'default' : 'secondary'}
      onClick={handleStateChange}
    />
  );
}
