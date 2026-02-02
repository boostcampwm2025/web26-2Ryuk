'use client';

import { AudioControlsProps } from './type';
import styles from './audioControlButtons.module.css';
import { IconButtonBase } from '@/app/components/shared/icon/IconButton';

export default function AudioControlButtons({
  micOn, // 현재 마이크 상태 (true/false)
  speakerOn, // 현재 스피커 상태
  onMicChange, // 상태 변경 핸들러
  onSpeakerChange,
  disabled = false,
}: AudioControlsProps) {
  const handleMicToggle = () => {
    if (disabled) return;
    onMicChange?.(!micOn);
  };

  const handleSpeakerToggle = () => {
    if (disabled) return;
    onSpeakerChange?.(!speakerOn);
  };

  // 로직도 props인 micOn, speakerOn을 기준으로 판단합니다.
  const micThemeColor = micOn ? 'outline' : 'error-secondary';
  const speakerThemeColor = speakerOn ? 'outline' : 'error-secondary';

  return (
    <div className={styles.audioControls}>
      <IconButtonBase
        name={micOn ? 'mic' : 'micoff'}
        size="small"
        variant={micThemeColor}
        disabled={disabled}
        onClick={handleMicToggle}
      />
      <IconButtonBase
        name={speakerOn ? 'volume' : 'mute'}
        size="small"
        variant={speakerThemeColor}
        disabled={disabled}
        onClick={handleSpeakerToggle}
      />
    </div>
  );
}
