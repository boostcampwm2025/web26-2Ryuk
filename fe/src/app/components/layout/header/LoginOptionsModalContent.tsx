'use client';

import { PrimaryTextButton } from '@/app/components/shared/button/TextButton';
import { authStore, type AuthStore } from '@/app/features/user/stores/auth';
import { useModal } from '@/app/components/shared/modal/useModal';
import styles from './loginOptionsModalContent.module.css';

export default function LoginOptionsModalContent() {
  const login = authStore((state: AuthStore) => state.login);
  const { closeModal } = useModal();

  const handleMockLogin = async () => {
    // BE의 Mock 사용자 중 하나 랜덤 선택 (J001 ~ J307)
    const randomId = `J${String(Math.floor(Math.random() * 307) + 1).padStart(3, '0')}`;
    await login(randomId);
    closeModal('login-options');
  };

  // GitHub OAuth 로그인
  const handleGitHubLogin = () => {
    // GitHub OAuth 시작 엔드포인트로 리다이렉션
    // Next.js rewrites 설정을 통해 /api/auth/github는 백엔드 서버로 프록시 됨
    window.location.href = '/api/auth/github';
    closeModal('login-options'); // 리다이렉트 전 close
  };

  // Google OAuth 로그인
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
    closeModal('login-options');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>로그인</h2>
      <PrimaryTextButton text="GitHub로 로그인" size="medium" onClick={handleGitHubLogin} />
      <PrimaryTextButton text="Google로 로그인" size="medium" onClick={handleGoogleLogin} />
      <PrimaryTextButton text="Mock 로그인" size="medium" onClick={handleMockLogin} />
    </div>
  );
}
