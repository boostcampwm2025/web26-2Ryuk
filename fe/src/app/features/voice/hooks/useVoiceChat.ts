'use client';

import { useCallback, useEffect, useRef } from 'react';
import { voiceStreamRegistry } from '@/app/features/voice/VoiceStreamRegistry';
import {
  createSpeakingDetector,
  SpeakingDetector,
} from '@/app/features/voice/utils/speakingDetector';
import { voiceStore } from '@/app/features/voice/stores/voice';
import { VoiceService } from '@/app/features/voice/services/VoiceService';

type VoiceDomainEventPayload =
  | { type: 'producer-added'; userId: string }
  | { type: 'producer-removed'; userId: string }
  | { type: 'producer-updated'; userId: string; isMicOn: boolean };

export function useVoiceChat() {
  const users = voiceStore((state) => state.users);
  const isMyMicOn = voiceStore((state) => state.isMyMicOn);
  const masterMute = voiceStore((state) => state.masterMute);

  const addUser = voiceStore((state) => state.addUser);
  const removeUser = voiceStore((state) => state.removeUser);
  const setUserMic = voiceStore((state) => state.setUserMic);
  const setUserSpeaker = voiceStore((state) => state.setUserSpeaker);
  const setUserVolume = voiceStore((state) => state.setUserVolume);
  const setUserSpeaking = voiceStore((state) => state.setUserSpeaking);
  const setMyMic = voiceStore((state) => state.setMyMic);
  const setMasterMute = voiceStore((state) => state.setMasterMute);

  const detectorsRef = useRef<Map<string, SpeakingDetector>>(new Map());

  useEffect(() => {
    const handleEvent = (event: VoiceDomainEventPayload) => {
      switch (event.type) {
        case 'producer-added':
          addUser(event.userId);
          break;
        case 'producer-updated':
          setUserMic(event.userId, event.isMicOn);
          break;
        case 'producer-removed':
          removeUser(event.userId);
          break;
      }
    };

    const unsubscribe = VoiceService.onEvent(handleEvent);
    return () => {
      unsubscribe();
    };
  }, [addUser, removeUser, setUserMic]);

  useEffect(() => {
    const detectors = detectorsRef.current;
    const activeIds = Object.keys(users);
    const activeSet = new Set(activeIds);

    detectors.forEach((detector, userId) => {
      if (activeSet.has(userId)) return;
      detector.stop();
      detectors.delete(userId);
      setUserSpeaking(userId, false);
    });

    activeIds.forEach((userId) => {
      if (detectors.has(userId)) return;
      const stream = voiceStreamRegistry.getStream(userId);
      if (!stream) return;
      const detector = createSpeakingDetector({
        stream,
        onSpeakingChange: (isSpeaking) => setUserSpeaking(userId, isSpeaking),
      });
      detectors.set(userId, detector);
    });
  }, [users, setUserSpeaking]);

  useEffect(() => {
    return () => {
      detectorsRef.current.forEach((detector) => detector.stop());
      detectorsRef.current.clear();
    };
  }, []);

  const toggleMyMic = useCallback(async () => {
    const nextState = !isMyMicOn;
    try {
      await VoiceService.toggleMic(!nextState);
      setMyMic(nextState);
    } catch (error) {
      console.error('[Voice] 마이크 토글 실패', error);
    }
  }, [isMyMicOn, setMyMic]);

  const toggleUserSpeaker = useCallback(
    (userId: string) => {
      const current = users[userId]?.isSpeakerOn ?? true;
      const nextSpeakerOn = !current;
      setUserSpeaker(userId, nextSpeakerOn);
      const shouldPause = masterMute || !nextSpeakerOn;
      void VoiceService.setConsumerPaused(userId, shouldPause);
    },
    [masterMute, setUserSpeaker, users],
  );

  const setUserVolumeLevel = useCallback(
    (userId: string, volume: number) => {
      const nextVolume = Math.max(0, Math.min(1, volume));
      setUserVolume(userId, nextVolume);
      VoiceService.setConsumerVolume(userId, nextVolume);
    },
    [setUserVolume],
  );

  const toggleMasterMute = useCallback(() => {
    const nextMasterMute = !masterMute;
    setMasterMute(nextMasterMute);
    if (nextMasterMute) {
      Object.keys(users).forEach((userId) => {
        void VoiceService.setConsumerPaused(userId, true);
      });
      return;
    }

    Object.entries(users).forEach(([userId, meta]) => {
      if (meta.isSpeakerOn) {
        void VoiceService.setConsumerPaused(userId, false);
      }
    });
  }, [masterMute, setMasterMute, users]);

  const getUserStream = useCallback((userId: string) => voiceStreamRegistry.getStream(userId), []);

  return {
    users,
    isMyMicOn,
    masterMute,
    getUserStream,
    toggleMyMic,
    toggleUserSpeaker,
    setUserVolume: setUserVolumeLevel,
    toggleMasterMute,
  };
}
