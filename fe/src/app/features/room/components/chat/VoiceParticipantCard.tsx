'use client';

import HostBadge from '@/app/components/shared/badge/HostBadge';
import * as Chip from '@/app/components/shared/chip/Chip';
import Icon from '@/app/components/shared/icon/Icon';
import Avatar from '@/app/components/shared/profile/Avatar';
import { SliderBase } from '@/app/components/shared/slider/Slider';
import AudioControlButtons from '@/app/features/voice/components/AudioControlButtons';
import SpeakerControlButton from '@/app/features/voice/components/SpeakerControlButton';
import CSSUtil from '@/utils/css';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './chat.module.css';
import { VoiceParticipantCardProps } from './type';
import { TextTooltip } from '@/app/components/shared/tooltip/TextTooltip';

export default function VoiceParticipantCard({
  userId,
  nickname,
  profileImage,
  active = false,
  isMe = false,
  isHost = false,
  micOn = true,
  speakerOn = true,
  mutedByMe = false,
  volume = 0.5,
  disabled = false,
  connected = true,
  onSliderChange,
  onMicChange,
  onSpeakerChange,
}: VoiceParticipantCardProps) {
  const [sliderValue, setSliderValue] = useState(volume);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null); //슬라이더용 디바운스 타이머
  const isSpeaking = active && micOn;
  const sliderVariant = isMe ? 'primary' : 'secondary';

  const statusMeta = useMemo(() => {
    if (disabled) return { text: '', variant: styles.statusDisabled };
    if (!isMe && !connected) return { text: '연결 중...', variant: styles.statusWarning };
    if (isSpeaking) return { text: '말하는 중', variant: styles.statusPrimary };

    const waiting = { text: '대기 중', variant: styles.statusSecondary };

    const meStatus = () => {
      if (!speakerOn) return { text: '내 스피커를 껐어요', variant: styles.statusError };
      if (!micOn) return { text: '내 마이크를 껐어요', variant: styles.statusSecondary };
      return waiting;
    };

    const otherStatus = () => {
      if (!speakerOn) {
        return mutedByMe
          ? { text: '상대를 음소거 했어요', variant: styles.statusSecondary }
          : { text: '상대가 스피커를 껐어요', variant: styles.statusError };
      }
      if (!micOn) return { text: '상대가 마이크를 껐어요', variant: styles.statusSecondary };
      return waiting;
    };

    return isMe ? meStatus() : otherStatus();
  }, [disabled, isSpeaking, isMe, micOn, speakerOn, mutedByMe, connected]);

  const { text: statusText, variant: statusVariant } = statusMeta;
  const statusRowClassName = CSSUtil.buildCls(styles.statusRow, statusVariant);

  const handleSliderChange = (value: number) => {
    if (disabled) return;

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
      onSliderChange?.(targetVolume);
      debounceTimer.current = null;
    }, 300); // 0.3초 동안 추가 움직임이 없으면 실행
  };

  useEffect(() => {
    if (!debounceTimer.current) setSliderValue(volume);
  }, [volume]);

  const className = CSSUtil.buildCls(
    styles.participantCard,
    isMe && styles.me,
    isSpeaking && styles.speaking,
    disabled && styles.disabled,
  );

  const audioControls = isMe ? (
    <AudioControlButtons
      micOn={micOn}
      speakerOn={speakerOn}
      onMicChange={onMicChange}
      onSpeakerChange={onSpeakerChange}
      disabled={disabled}
    />
  ) : (
    <SpeakerControlButton speakerOn={speakerOn} onChange={onSpeakerChange} disabled={disabled} />
  );

  const micIconName = (() => {
    if (disabled) return 'micoff';
    return micOn ? 'mic' : 'micoff';
  })();

  const speakerIconName = (() => {
    if (disabled) return 'mute';
    return speakerOn ? 'volume' : 'mute';
  })();

  const sliderIconName = isMe ? micIconName : speakerIconName;
  const statusIconName = speakerOn ? micIconName : speakerIconName;

  return (
    <div className={className}>
      <div className={styles.cardTop}>
        <div className={styles.avatarWrapper}>
          <Avatar nickname={nickname} profileImage={profileImage} isActive={isSpeaking} />
        </div>
        <div className={styles.meta}>
          <div className={styles.nameRow}>
            <>
              <span data-anchor={`voice-card-${nickname}`} className={styles.participantName}>
                {nickname}
              </span>
              <TextTooltip anchorId={`voice-card-${nickname}`} text={nickname} />
            </>
            {isHost && <HostBadge />}
            {isMe && <Chip.Secondary label="나" size="small" />}
          </div>
          <div className={statusRowClassName}>
            <span className={styles.statusIcon}>
              <Icon name={statusIconName} size="small" />
            </span>
            <span className={styles.statusText}>{statusText}</span>
          </div>
        </div>
        <div className={styles.controls}>{audioControls}</div>
      </div>

      <div className={styles.sliderRow}>
        <span className={styles.sliderIcon}>
          <Icon name={sliderIconName} size="small" />
        </span>
        <SliderBase
          variant={sliderVariant}
          value={sliderValue} // 1. 현재 상태값 연결
          onChange={handleSliderChange} // 2. 바꿨을 때 실행될 핸들러 연결
          min={0}
          max={1}
          step={0.01}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
