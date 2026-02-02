'use client';

export class VoiceStreamRegistry {
  private streams = new Map<string, MediaStream>();

  attachTrack(userId: string, track: MediaStreamTrack): void {
    const existing = this.streams.get(userId);
    if (existing) {
      existing.addTrack(track);
      return;
    }
    const stream = new MediaStream([track]);
    this.streams.set(userId, stream);
  }

  getStream(userId: string): MediaStream | undefined {
    return this.streams.get(userId);
  }

  detachUser(userId: string): void {
    const stream = this.streams.get(userId);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      this.streams.delete(userId);
    }
  }

  reset(): void {
    this.streams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
    this.streams.clear();
  }
}

export const voiceStreamRegistry = new VoiceStreamRegistry();
