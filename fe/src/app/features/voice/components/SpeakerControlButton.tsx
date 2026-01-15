'use client';

import { useState } from 'react';
import { SpeakerControlButtonProps } from './type';
import { OutlineIconButton } from '@/app/components/shared/icon/IconButton';

export default function SpeakerControlButton({
  initialState = false,
  onChange,
}: SpeakerControlButtonProps) {
  const [state, setState] = useState(initialState);

  const handleStateChange = () => {
    setState((prev) => !prev);
    onChange?.(state);
  };

  return (
    <OutlineIconButton
      name={state ? 'volume' : 'mute'}
      size="small"
      themeColor={state ? 'default' : 'secondary'}
      onClick={handleStateChange}
    />
  );
}
