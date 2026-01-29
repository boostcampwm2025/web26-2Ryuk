'use client';

import styles from './loginOptionsModalContent.module.css';
import { useModal } from '@/app/components/shared/modal/useModal';
import { GoogleAuthButton, GithubAuthButton } from '@/app/features/auth/components/AuthButton';
import * as IconCircle from '@/app/components/shared/icon/IconCircle';

export default function LoginOptionsModalContent() {
  // const login = authStore((state: AuthStore) => state.login);
  const { closeModal } = useModal();

  /* MbwtAuthButton */
  // const handleMockLogin = async () => {
  //   const randomId = `J${String(Math.floor(Math.random() * 307) + 1).padStart(3, '0')}`;
  //   await login(randomId);
  //   closeModal('login-options');
  // };

  const handleGitHubLogin = () => {
    window.location.href = '/api/auth/github';
    closeModal('login-options');
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
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
