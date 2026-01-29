'use client';

import HostBadge from '@/app/components/shared/badge/HostBadge';
import * as Chip from '@/app/components/shared/chip/Chip';
import Icon from '@/app/components/shared/icon/Icon';
import Avatar from '@/app/components/shared/profile/Avatar';
import { SliderBase } from '@/app/components/shared/slider/Slider';
import AudioControlButtons from '@/app/features/voice/components/AudioControlButtons';
import SpeakerControlButton from '@/app/features/voice/components/SpeakerControlButton';
import CSSUtil from '@/utils/css';
import { useEffect, useRef, useState } from 'react';
import styles from './chat.module.css';
import { VoiceParticipantCardProps } from './type';

export default function VoiceParticipantCard({
  userId,
  nickname,
  profileImage,
  active = false,
  isMe = false,
  isHost = false,
  micOn = true,
  speakerOn = true,
  volume = 0.5,
  onSliderChange,
  onMicChange,
  onSpeakerChange,
}: VoiceParticipantCardProps) {
  const [sliderValue, setSliderValue] = useState(volume);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null); //슬라이더용 디바운스 타이머
  const isSpeaking = active && micOn;
  const sliderVariant = isMe || active ? 'primary' : 'secondary';

  let statusText = '음소거됨';
  if (isSpeaking) {
    statusText = '말하는 중...';
  } else if (micOn) {
    statusText = '대기 중';
  }

  const handleSliderChange = (value: number) => {
    // 1. 슬라이더 UI 상태 업데이트 (즉시)
    setSliderValue(value);
    const targetVolume = value;

    // 2. [Direct DOM] 리액트 렌더링 없이 오디오 볼륨 직접 수정 (즉시)
    const audioEl = document.getElementById(`audio-${userId}`) as HTMLAudioElement;
    if (audioEl) {
      audioEl.volume = targetVolume;
    }

    // 3. [Debouncing] 스토어(Zustand) 업데이트는 300ms 뒤에 한 번만 실행
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      console.log(`[Store Update] 유저 ${userId}의 볼륨을 ${targetVolume}으로 저장합니다.`);
      onSliderChange?.(targetVolume);
      debounceTimer.current = null;
    }, 300); // 0.3초 동안 추가 움직임이 없으면 실행
  };

  useEffect(() => {
    if (!debounceTimer.current) {
      setSliderValue(volume);
    }
  }, [volume]);

  const className = CSSUtil.buildCls(
    styles.participantCard,
    isMe && styles.me,
    isSpeaking && styles.speaking,
  );

  const audioControls = isMe ? (
    <AudioControlButtons
      micOn={micOn}
      speakerOn={speakerOn}
      onMicChange={onMicChange}
      onSpeakerChange={onSpeakerChange}
    />
  ) : (
    <SpeakerControlButton speakerOn={speakerOn} onChange={onSpeakerChange} />
  );

  const volumeIconName = isMe ? 'mic' : 'volume';

  return (
    <div className={className}>
      <div className={styles.cardTop}>
        <div className={styles.avatarWrapper}>
          <Avatar nickname={nickname} profileImage={profileImage} />
        </div>
        <div className={styles.meta}>
          <div className={styles.nameRow}>
            <span className={styles.participantName}>{nickname}</span>
            {isHost && <HostBadge />}
            {isMe && <Chip.Secondary label="나" size="small" />}
          </div>
          <div className={styles.statusRow}>
            <Icon name={micOn ? 'mic' : 'micoff'} size="small" />
            <span className={styles.statusText}>{statusText}</span>
          </div>
        </div>
        <div className={styles.controls}>{audioControls}</div>
      </div>

      <div className={styles.sliderRow}>
        <Icon name={volumeIconName} size="small" />
        <SliderBase
          variant={sliderVariant}
          value={sliderValue} // 1. 현재 상태값 연결
          onChange={handleSliderChange} // 2. 바꿨을 때 실행될 핸들러 연결
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    </div>
  );
}
