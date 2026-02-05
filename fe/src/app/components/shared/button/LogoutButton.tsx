'use client';

import { GhostTextButton } from './TextButton';
import { AuthService } from '@/app/features/user/services/AuthService';
import { roomStore } from '@/app/features/room/stores/room';
import { useToast } from '../toast/useToast';

export default function LogoutButton() {
  const { showSuccessToast } = useToast();

  const handleLogout = () => {
    roomStore.getState().resetRoom();
    AuthService.logout();
    showSuccessToast('로그아웃 되었습니다.');
  };

  return <GhostTextButton text="로그아웃" size="small" onClick={handleLogout} />;
}
