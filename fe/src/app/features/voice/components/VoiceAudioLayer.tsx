'use client';

import { useVoiceChat } from '@/app/features/voice/hooks/useVoiceChat';
import { useEffect, useRef } from 'react';
import { authStore } from '../../user/stores/auth';

function RemoteAudioPlayer({
  userId,
  stream,
  volume,
  isSpeakerOn,
}: {
  userId: string;
  stream: MediaStream;
  volume: number;
  isSpeakerOn: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.srcObject !== stream) audio.srcObject = stream;
    audio.volume = Math.max(0, Math.min(1, volume));
    if (isSpeakerOn && volume > 0) {
      audio.play().catch((e) => console.error('[Voice] Audio play failed:', userId, e));
    } else {
      audio.pause();
    }
  }, [stream, isSpeakerOn, volume, userId]);

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

/**
 * 전역 음성 재생 레이어. 소속 방이 있을 때 항상 마운트되어
 * 방 페이지 / 홈 페이지 구분 없이 상대 목소리가 재생되도록 함
 * RoomVoiceChat·LocalChatPanel은 이 레이어에 의존하므로 자체 audio 렌더하지 않음
 * 대화방 외에서도 사용해야 하기 떄문에 별도로 분리
 */
export default function VoiceAudioLayer() {
  const { users, masterMute, getUserStream } = useVoiceChat();
  const myId = authStore((state) => state.id);

  return (
    <div id="voice-streams-portal" style={{ display: 'none' }} aria-hidden="true">
      {Object.entries(users).map(([userId, voiceInfo]) => {
        if (userId === myId) return null; // 내 오디오는 재생하지 않음

        const stream = getUserStream(userId);
        if (!stream) return null;
        return (
          <RemoteAudioPlayer
            key={`audio-${userId}`}
            userId={userId}
            stream={stream}
            volume={masterMute ? 0 : (voiceInfo.volume ?? 0.5)}
            isSpeakerOn={voiceInfo.isSpeakerOn}
          />
        );
      })}
    </div>
  );
}
