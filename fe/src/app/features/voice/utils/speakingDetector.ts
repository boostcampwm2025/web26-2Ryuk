'use client';

const DEFAULT_THRESHOLD = 0.03;
const DEFAULT_RAF_THROTTLE = 100;
const DEFAULT_HOLD_MS = 250;

export type SpeakingDetector = {
  stop: () => void;
};

export function createSpeakingDetector({
  stream,
  onSpeakingChange,
  rafThrottleMs = DEFAULT_RAF_THROTTLE,
  speakingHoldMs = DEFAULT_HOLD_MS,
  threshold = DEFAULT_THRESHOLD,
}: {
  stream: MediaStream;
  onSpeakingChange: (isSpeaking: boolean) => void;
  rafThrottleMs?: number;
  speakingHoldMs?: number;
  threshold?: number;
}): SpeakingDetector {
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    return { stop: () => undefined };
  }

  let audioContext: AudioContext;
  try {
    audioContext = new AudioContext();
  } catch {
    return { stop: () => undefined };
  }

  // AudioContext 생성
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);

  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => undefined);
  }
  // suspended 상태 보정

  let rafId: number | null = null;
  let running = true;
  let lastSampleTime = 0;
  let lastActiveAt = 0;
  let speaking = false;

  const step = (timestamp: number) => {
    if (!running) return;
    rafId = requestAnimationFrame(step);
    if (timestamp - lastSampleTime < rafThrottleMs) return;

    lastSampleTime = timestamp;

    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const normalized = data[i] / 128 - 1;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / data.length);
    const now = performance.now();
    const isAbove = rms >= threshold;

    if (isAbove) {
      lastActiveAt = now;
      if (!speaking) {
        speaking = true;
        onSpeakingChange(true);
      }
      return;
    }

    if (speaking && now - lastActiveAt >= speakingHoldMs) {
      speaking = false;
      onSpeakingChange(false);
    }
  };

  rafId = requestAnimationFrame(step);

  const resumeOnGesture = () => {
    if (audioContext.state === 'running') return;
    audioContext.resume().catch(() => undefined);
  };
  // 사용자 제스처 대응
  document.addEventListener('click', resumeOnGesture, { once: true });

  return {
    stop: () => {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      source.disconnect();
      analyser.disconnect();
      audioContext.close().catch(() => undefined);
      document.removeEventListener('click', resumeOnGesture);
    },
  };
}
