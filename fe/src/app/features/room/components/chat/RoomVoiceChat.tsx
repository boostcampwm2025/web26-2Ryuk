'use client';

import { SecondaryChip } from '@/app/components/shared/chip/Chip';
import { RoomParticipantData as PData } from '@/app/features/room/dtos/data';
import { roomStore, RoomStore } from '@/app/features/room/stores/room';
import { AuthStore, authStore } from '@/app/features/user/stores/auth';
import { useVoiceChat } from '@/app/features/voice/hooks/useVoiceChat';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './chat.module.css';
import VoiceParticipantCard from './VoiceParticipantCard';

function RemoteAudioPlayer({
  userId,
  stream,
  volume,
  isMicOn,
  isSpeakerOn,
}: {
  userId: string;
  stream: MediaStream;
  volume: number;
  isMicOn: boolean;
  isSpeakerOn: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // 스트림과 볼륨 변경처리를 분리
  useEffect(() => {
    if (audioRef.current && audioRef.current.srcObject !== stream) {
      audioRef.current.srcObject = stream;
      // 소스를 새로 연결했으니 재생 시작
      audioRef.current.play().catch(() => {});
      //로그
      console.log('🎁 플레이어에 전달된 스트림:', stream);
      if (stream) {
        console.log('🎵 포함된 오디오 트랙:', stream.getAudioTracks());
      }
    }
  }, [stream]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = Math.max(0, Math.min(1, volume));
    console.log(`[Audio] 볼륨 설정: ${audio.volume}`);

    if (isMicOn && isSpeakerOn && volume > 0) {
      if (audio.paused) {
        console.log('[Audio] 상대방 마이크 켜짐 감지 - 강제 재생');
        audio.play().catch((err) => console.warn('[Audio] 재생 실패:', err));
      }
    } else {
      // 마이크가 꺼졌거나 스피커를 껐다면 명시적으로 일시정지 (리소스 절약)
      audio.pause();
    }
  }, [isMicOn, isSpeakerOn, volume]);
  return (
    <audio
      id={`audio-${userId}`}
      ref={audioRef}
      autoPlay
      playsInline
      style={{
        visibility: 'hidden',
        position: 'absolute',
        width: 0,
        height: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function RoomVoiceChat() {
  const [isHydrated, setIsHydrated] = useState(false);

  const myId = authStore((state: AuthStore) => state.userId);
  const me = authStore((state: AuthStore) => state.user);
  const roomData = roomStore((state: RoomStore) => state.roomData);
  const roomId = roomStore((state) => state.roomId);
  const isJoined = roomStore((state) => state.isJoined);

  // 1. participants를 useMemo로 정의 (나를 제외한 목록)
  const participants = useMemo(() => {
    return roomData?.participants?.filter((p: PData) => p.userId !== myId) ?? [];
  }, [roomData?.participants, myId]);

  // 2. 위에서 메모이제이션된 participants를 사용하여 ID 문자열 생성
  const participantIds = useMemo(() => {
    return participants.map((p) => p.userId).join(',');
  }, [participants]);

  const currentParticipants = roomData?.currentParticipants;
  const maxParticipants = roomData?.maxParticipants;
  const showChip = currentParticipants || maxParticipants;
  const {
    voiceUsers,
    isMyMicOn,
    isMasterMute, // 전체 음소거
    toggleMic,
    toggleUserAudio,
    changeUserVolume,
    toggleMasterMute,
  } = useVoiceChat(roomId!, isJoined);

  useEffect(() => {
    // mount/refresh 시 필요한 로직
  }, [participantIds]);

  useEffect(() => {
    if (isHydrated) return;

    const handleHydrated = () => {
      // persist 객체가 있는지 확인 후 호출
      const authReady = authStore.persist?.hasHydrated?.() ?? false;
      const roomReady = roomStore.persist?.hasHydrated?.() ?? false;

      if (authReady && roomReady) setIsHydrated(true);
    };

    handleHydrated();

    // 리스너 등록 시에도 옵셔널 체이닝 필수
    const unsubAuth = authStore.persist?.onFinishHydration?.(handleHydrated);
    const unsubRoom = roomStore.persist?.onFinishHydration?.(handleHydrated);

    return () => {
      unsubAuth?.();
      unsubRoom?.();
    };
  }, [isHydrated]);

  if (!isHydrated) {
    return (
      <div className={styles.roomVoiceChat}>
        <div className={styles.header}>
          <h3 className={styles.title}>참여자 목록</h3>
        </div>
        <div className={styles.content}>
          <div className={styles.emptyState}>참여자 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.roomVoiceChat}>
      <div className={styles.header}>
        <h3 className={styles.title}>참여자 목록</h3>
        <div className={styles.headerRight}>
          {showChip && (
            <SecondaryChip label={`${currentParticipants}/${maxParticipants}`} size="medium" />
          )}
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.participantsList}>
          {me && (
            <VoiceParticipantCard
              userId={me.id}
              key="me"
              nickname={me.nickname}
              profileImage={me.profileImage}
              isMe
              micOn={isMyMicOn}
              speakerOn={!isMasterMute}
              onSpeakerChange={toggleMasterMute}
              onMicChange={toggleMic}
              active={false}
              isHost={roomData?.hostId === me.id}
            />
          )}
          {participants.map((p: PData) => {
            const voiceInfo = voiceUsers[p.userId];
            const userVolume = voiceInfo?.volume !== undefined ? voiceInfo.volume : 0.5; // 기본값 50

            return (
              <div key={p.userId}>
                <VoiceParticipantCard
                  userId={p.userId}
                  nickname={p.nickname}
                  profileImage={p.profileImage}
                  micOn={voiceInfo?.isMicOn ?? false}
                  speakerOn={voiceInfo?.isSpeakerOn ?? true}
                  volume={userVolume} // 볼륨 값 전달
                  onSliderChange={(val) => changeUserVolume(p.userId, val)}
                  onSpeakerChange={(val) => toggleUserAudio(p.userId, val)}
                  isHost={roomData?.hostId === p.userId}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 실제 소리 재생 레이어 (UI와 분리하여 맨 아래에 배치) */}
      <div id="voice-streams-portal" style={{ display: 'none' }}>
        {Object.entries(voiceUsers).map(([userId, voiceInfo]) => {
          // 스트림이 있고, 스피커가 켜져 있을 때만 재생
          if (voiceInfo.stream) {
            return (
              <RemoteAudioPlayer
                key={`audio-${userId}`} // 고유한 키 부여로 재생성 방지
                userId={userId}
                stream={voiceInfo.stream}
                volume={isMasterMute ? 0 : (voiceInfo.volume ?? 0.5)}
                isMicOn={voiceInfo.isMicOn} // 👈 상대방 마이크 상태를 전달!
                isSpeakerOn={voiceInfo.isSpeakerOn}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
