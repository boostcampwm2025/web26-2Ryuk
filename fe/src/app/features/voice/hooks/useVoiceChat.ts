import { roomStore } from '@/app/features/room/stores/room';
import { VoiceService } from '@/app/features/voice/services/VoiceService';
import { UserVoiceState, useVoiceStore } from '@/app/features/voice/stores/voice';
import { WebSocketService } from '@/app/services/websocket.service';
import { useEffect } from 'react';

export function useVoiceChat(roomId: string, isJoined: boolean) {
  const isMicAvailable = roomStore((state) => state.roomData?.isMicAvailable ?? false);
  const {
    voiceUsers,
    isMyMicOn,
    setVoiceUser,
    removeVoiceUser,
    setMyMic,
    isMasterMute,
    toggleMasterMute,
  } = useVoiceStore();

  useEffect(() => {
    // 룸 ID가 없거나 입장이 완료되지 않았다면 실행하지 않음
    if (!roomId || !isJoined) return;

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      if (!isMicAvailable) {
        console.log('🔇 이 방은 음성 채팅이 비활성화되어 있습니다.');
        return;
      }

      try {
        await WebSocketService.ensureConnected(10000); //소켓 연결 될때까지 기다리기

        // 1. 보이스 채널 입장
        await VoiceService.joinVoiceChannel(roomId);

        if (!isMounted) return;

        // 2. 채널 입장 성공 후 즉시 알림 구독 시작 (순서 보장)
        unsubscribe = VoiceService.onStatusChange((payload) => {
          if (payload.action === 'remove') {
            removeVoiceUser(payload.userId);
            return;
          }
          const updates: Partial<UserVoiceState> = {
            isMicOn: payload.isMicOn,
          };

          // stream이 들어왔을 때만(즉, 처음 'add' 될 때만) updates 객체에 추가
          if (payload.stream) {
            updates.stream = payload.stream;
          }

          setVoiceUser(payload.userId, updates);
        });

        // 3. 내 마이크 시작 및 로컬 상태 업데이트
        try {
          await VoiceService.startMic();
          setMyMic(true);
        } catch (micError) {
          console.warn('마이크 시작 실패(권한 거절 등):', micError);
          setMyMic(false);
        }

        // 4. 기존 프로듀서(송출자) 목록 조회 및 구독 시작
        await VoiceService.getProducerList();

        if (isMounted) {
          setMyMic(true);
          console.log('✅ Voice Chat 연결 성공');
        }
      } catch (error: any) {
        throw new Error('음성 채널 입장 실패: ' + (error.message || JSON.stringify(error)));
      }
    };

    init();

    // 클린업 함수
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      VoiceService.leaveChannel();
      console.log('🚪 Voice Chat 채널 퇴장');
    };
  }, [roomId, isJoined, isMicAvailable, setVoiceUser, removeVoiceUser, setMyMic]);

  // 내 마이크 토글 핸들러
  const toggleMic = async () => {
    if (!isMicAvailable) return;
    try {
      const nextState = !isMyMicOn;
      // 서비스에는 미디어서버 일시정지 여부(pause)를 전달하므로 상태의 반대값 전송
      await VoiceService.toggleMic(!nextState);
      setMyMic(nextState);
    } catch (error) {
      console.error('마이크 제어 실패:', error);
    }
  };

  // 상대방 소리 수신 토글 핸들러
  const toggleUserAudio = async (userId: string, targetState: boolean) => {
    try {
      const consumer = VoiceService.getConsumerByUserId(userId);
      if (consumer) {
        // targetState가 true(켜기)면 pause는 false(끄기)여야 함
        await VoiceService.toggleConsumer(consumer, !targetState);
        setVoiceUser(userId, { isSpeakerOn: targetState });
      }
    } catch (error) {
      console.error('상대방 소리 제어 실패:', error);
    }
  };

  // 특정 유저의 볼륨 조절 핸들러
  const changeUserVolume = (userId: string, volume: number) => {
    setVoiceUser(userId, { volume: volume });
  };

  return {
    voiceUsers,
    isMyMicOn,
    isMasterMute,
    toggleMic,
    toggleUserAudio,
    changeUserVolume,
    toggleMasterMute,
  };
}
