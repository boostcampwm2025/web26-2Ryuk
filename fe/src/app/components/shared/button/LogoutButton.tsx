'use client';

import { GhostTextButton } from './TextButton';
import { authStore, type AuthStore } from '@/app/features/user/stores/auth';
import useNavigation from '@/app/hooks/useNavigation';
import { showSuccessToast } from '@/app/components/shared/toast/useToast';
import { roomStore } from '@/app/features/room/stores/room';

export default function LogoutButton() {
  const { goHome } = useNavigation();
  const logout = authStore((state: AuthStore) => state.logout);
  const handleLogout = () => {
    logout();
    showSuccessToast('로그아웃 되었습니다.');
    roomStore.getState().leaveRoom();
    goHome();
  };

  return <GhostTextButton text="로그아웃" size="small" onClick={handleLogout} />;
}
