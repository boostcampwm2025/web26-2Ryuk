'use client';

import styles from './header.module.css';
import { Logo } from '@/app/components/sprite/logo/Logo';
import { ProfileRow } from '@/app/components/shared/profile/Profile';
import { authStore } from '@/app/features/user/stores/auth';
import useNavigation from '@/app/hooks/useNavigation';
import LogoutButton from '@/app/components/shared/button/LogoutButton';
import LoginButtonWithModal from '@/app/components/shared/button/LoginButtonWithModal';

export default function Header() {
  const { goHome } = useNavigation();
  const myId = authStore((state) => state.id);
  const myNickname = authStore((state) => state.nickname);
  const myProfileImage = authStore((state) => state.profileImage);
  const isAuthenticated = Boolean(myId);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Logo size="small" onClick={goHome} />
        </div>
        <div className={styles.right}>
          {isAuthenticated ? <LogoutButton /> : <LoginButtonWithModal />}
          {isAuthenticated && myNickname && (
            <>
              <div className={styles.separator} />
              <ProfileRow nickname={myNickname} profileImage={myProfileImage} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
