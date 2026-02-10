'use client';

import styles from './loginOptionsModalContent.module.css';
import { useModal } from '@/app/components/shared/modal/useModal';
import { GoogleAuthButton, GithubAuthButton } from '@/app/features/auth/components/AuthButton';
import * as IconCircle from '@/app/components/shared/icon/IconCircle';

export default function LoginOptionsModalContent() {
  const { closeModal } = useModal();

  /**
   * OAuth 리다이렉트 전 현재 경로를 저장하고, 백엔드에도 전달.
   * - sessionStorage: 프론트 자체 fallback
   * - query param: 백엔드 OAuth state 를 통한 정식 전달
   */
  const buildOAuthUrl = (provider: 'github' | 'google') => {
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('auth-redirect', currentPath);
    const redirectParam = encodeURIComponent(currentPath);
    return `/api/auth/${provider}?redirect=${redirectParam}`;
  };

  const handleGitHubLogin = () => {
    window.location.href = buildOAuthUrl('github');
    closeModal('login-options');
  };

  const handleGoogleLogin = () => {
    window.location.href = buildOAuthUrl('google');
    closeModal('login-options');
  };

  return (
    <div className={styles.modal}>
      <div className={styles.header}>
        <IconCircle.Secondary name="open" size="medium" />
        <div className={styles.text}>
          <h2 className={styles.title}>로그인</h2>
          <p className={styles.subtitle}>아래 버튼을 눌러 로그인 해주세요</p>
        </div>
      </div>
      <div className={styles.buttonStack}>
        <GoogleAuthButton onClick={handleGoogleLogin} />
        <GithubAuthButton onClick={handleGitHubLogin} />
        {/* <MbwtAuthButton onClick={handleMockLogin} /> */}
      </div>
    </div>
  );
}
