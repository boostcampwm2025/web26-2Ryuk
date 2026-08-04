'use client';

import { voiceStore } from '@/app/features/voice/stores/voice';

export type VoiceSessionStatus = 'idle' | 'connecting' | 'connected' | 'failed';

export interface VoiceSessionState {
  status: VoiceSessionStatus;
  activeRoomId?: string;
  error?: Error;
}

type Subscriber = (state: VoiceSessionState) => void;
type VoiceServiceModule = typeof import('@/app/features/voice/services/VoiceService');

class VoiceSessionManager {
  private state: VoiceSessionState = { status: 'idle' };
  private subscribers = new Set<Subscriber>();
  private joinPromise?: Promise<void>;
  private leavePromise?: Promise<void>;
  private voiceEventUnsub?: () => void;
  private voiceServicePromise?: Promise<VoiceServiceModule['VoiceService']>;

  private loadVoiceService() {
    if (!this.voiceServicePromise) {
      this.voiceServicePromise = import('@/app/features/voice/services/VoiceService').then(
        (m) => m.VoiceService,
      );
    }
    return this.voiceServicePromise;
  }

  private async ensureServiceSubscription() {
    if (this.voiceEventUnsub) return;
    const VoiceService = await this.loadVoiceService();
    this.voiceEventUnsub = VoiceService.onEvent((event) => {
      const { addUser, removeUser, setUserMic } = voiceStore.getState();
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
    });
  }

  subscribe(subscriber: Subscriber) {
    this.subscribers.add(subscriber);
    subscriber(this.state);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  getState() {
    return this.state;
  }

  start(roomId: string) {
    if (!roomId) return;
    if (this.state.activeRoomId === roomId && this.state.status === 'connected') return;
    if (this.joinPromise && this.state.activeRoomId === roomId) return;

    this.updateState({ status: 'connecting', activeRoomId: roomId, error: undefined });

    const run = async () => {
      try {
        await this.ensureServiceSubscription();
        const VoiceService = await this.loadVoiceService();
        await VoiceService.joinVoiceChannel(roomId);
        if (this.state.activeRoomId !== roomId) return;
        this.updateState({ status: 'connected', activeRoomId: roomId });
      } catch (error: any) {
        if (this.state.activeRoomId !== roomId) return;
        this.updateState({ status: 'failed', activeRoomId: roomId, error });
      } finally {
        this.joinPromise = undefined;
      }
    };

    this.joinPromise = run();
  }

  stop(roomId?: string) {
    const targetRoomId = roomId ?? this.state.activeRoomId;
    if (!targetRoomId) return;
    if (this.leavePromise) return;
    if (this.state.activeRoomId !== targetRoomId) return;

    const run = async () => {
      try {
        const VoiceService = await this.loadVoiceService();
        await VoiceService.leaveChannel();
      } finally {
        if (this.state.activeRoomId === targetRoomId) {
          this.voiceEventUnsub?.();
          this.voiceEventUnsub = undefined;
          this.updateState({ status: 'idle', activeRoomId: undefined, error: undefined });
        }
      }
      this.leavePromise = undefined;
    };

    this.leavePromise = run();
  }

  isActive(): boolean {
    return this.state.status !== 'idle';
  }

  private updateState(patch: Partial<VoiceSessionState>) {
    this.state = { ...this.state, ...patch };
    this.subscribers.forEach((subscriber) => subscriber(this.state));
  }
}

export const voiceSessionManager = new VoiceSessionManager();
