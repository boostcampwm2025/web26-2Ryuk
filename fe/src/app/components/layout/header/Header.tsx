'use client';

import styles from './header.module.css';
import { Logo } from '@/app/components/sprite/logo/Logo';
import { ProfileRow } from '@/app/components/shared/profile/Profile';
import { authStore, type AuthStore } from '@/app/features/user/stores/auth';
import useNavigation from '@/app/hooks/useNavigation';
import LogoutButton from '@/app/components/shared/button/LogoutButton';
import LoginButtonWithModal from '@/app/components/shared/button/LoginButtonWithModal';

export default function Header() {
  const { goHome } = useNavigation();
  const user = authStore((state: AuthStore) => state.user);
  const isAthenticated = authStore((state: AuthStore) => state.isAuthenticated);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Logo size="small" onClick={goHome} />
        </div>
        <div className={styles.right}>
          {isAthenticated ? <LogoutButton /> : <LoginButtonWithModal />}
          {user && isAthenticated && user.nickname && (
            <>
              <div className={styles.separator} />
              <ProfileRow nickname={user.nickname} profileImage={user.profileImage} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
