export interface RoomTextChatProps {}

export interface RoomVoiceChatProps {}

export interface VoiceParticipantCardProps {
  nickname: string;
  profileImage?: string;
  active?: boolean;
  isMe?: boolean;
  isHost?: boolean;
  micOn?: boolean;
  speakerOn?: boolean;
  volume?: number;
  onSliderChange?: (value: number) => void;
  onMicChange?: (state: boolean) => void;
  onSpeakerChange?: (state: boolean) => void;
}
