'use client';

import { AudioControlsProps } from './type';
import styles from './audioControlButtons.module.css';
import { IconButtonBase } from '@/app/components/shared/icon/IconButton';

export default function AudioControlButtons({
  micOn, // 현재 마이크 상태 (true/false)
  speakerOn, // 현재 스피커 상태
  onMicChange, // 상태 변경 핸들러
  onSpeakerChange,
}: AudioControlsProps) {
  const handleMicToggle = () => {
    onMicChange?.(!micOn);
  };

  const handleSpeakerToggle = () => {
    onSpeakerChange?.(!speakerOn);
  };

  // 로직도 props인 micOn, speakerOn을 기준으로 판단합니다.
  const getMicThemeColor = () => {
    if (!micOn) return speakerOn ? 'secondary' : 'error-secondary';
    return 'outline';
  };

  const getSpeakerThemeColor = () => {
    if (!speakerOn) return 'error-secondary';
    return 'outline';
  };

  return (
    <div className={styles.audioControls}>
      <IconButtonBase
        name={micOn ? 'mic' : 'micoff'}
        size="small"
        variant={getMicThemeColor()}
        onClick={handleMicToggle}
      />
      <IconButtonBase
        name={speakerOn ? 'volume' : 'mute'}
        size="small"
        variant={getSpeakerThemeColor()}
        onClick={handleSpeakerToggle}
      />
    </div>
  );
}
