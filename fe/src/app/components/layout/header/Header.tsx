'use client';

import styles from './header.module.css';
import { Logo } from '@/app/components/sprite/logo/Logo';
import { OutlineIconButton } from '@/app/components/shared/icon/IconButton';
import { ProfileRow } from '@/app/components/shared/profile/Profile';
import { GhostTextButton } from '@/app/components/shared/button/TextButton';
import { authStore, type AuthStore } from '@/app/features/user/stores/auth';
import useNavigation from '@/app/hooks/useNavigation';
import LogoutButton from '@/app/components/shared/button/LogoutButton';
import Modal from '@/app/components/shared/modal/Modal';
import LoginOptionsModalContent from './LoginOptionsModalContent';
import { useModal } from '@/app/components/shared/modal/useModal';

export default function Header() {
  const { goHome, gotoComponents } = useNavigation();
  const { openModal } = useModal();
  const user = authStore((state: AuthStore) => state.user);
  const isAthenticated = authStore((state: AuthStore) => state.isAuthenticated);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Logo size="small" onClick={goHome} />
        </div>
        <div className={styles.right}>
          <OutlineIconButton
            name="settings"
            size="small"
            onClick={() => gotoComponents('shared')}
          />
          {isAthenticated ? (
            <LogoutButton />
          ) : (
            <GhostTextButton
              text="로그인"
              size="small"
              onClick={() => openModal('login-options')}
            />
          )}
          {user && isAthenticated && user.nickname && (
            <>
              <div className={styles.separator} />
              <ProfileRow nickname={user.nickname} profileImage={user.profileImage} />
            </>
          )}
        </div>
      </div>
      <Modal id="login-options">
        <LoginOptionsModalContent />
      </Modal>
    </header>
  );
}
