'use client';

import { useState } from 'react';
import { AudioControlsProps } from './type';
import styles from './audioControlButtons.module.css';
import { OutlineIconButton } from '@/app/components/shared/icon/IconButton';

export default function AudioControlButtons({
  initialMicState = true,
  initialSpeakerState = true,
  onMicChange,
  onSpeakerChange,
}: AudioControlsProps) {
  const [micState, setMicState] = useState(initialMicState);
  const [speakerState, setSpeakerState] = useState(initialSpeakerState);

  const handleMicToggle = () => {
    setMicState((prev) => !prev);
    onMicChange?.(micState);
  };

  const handleSpeakerToggle = () => {
    if (micState) setMicState(false);
    setSpeakerState((prev) => !prev);
    onSpeakerChange?.(speakerState);
  };

  const getMicThemeColor = () => {
    if (!micState) return speakerState ? 'secondary' : 'error';
    return 'default';
  };

  const getSpeakerThemeColor = () => {
    if (!speakerState) return 'error';
    return 'default';
  };

  return (
    <div className={styles.audioControls}>
      <OutlineIconButton
        name={micState ? 'mic' : 'micoff'}
        size="small"
        themeColor={getMicThemeColor()}
        onClick={handleMicToggle}
      />
      <OutlineIconButton
        name={speakerState ? 'volume' : 'mute'}
        size="small"
        themeColor={getSpeakerThemeColor()}
        onClick={handleSpeakerToggle}
      />
    </div>
  );
}
