'use client';

import styles from './header.module.css';
import { Logo } from '@/app/components/sprite/logo/Logo';
import { OutlineIconButton } from '@/app/components/shared/icon/IconButton';
import { ProfileRow } from '@/app/components/shared/profile/Profile';
import { authStore, type AuthStore } from '@/app/features/user/stores/auth';
import useNavigation from '@/app/hooks/useNavigation';
import LogoutButton from '@/app/components/shared/button/LogoutButton';
import LoginButtonWithModal from '@/app/components/shared/button/LoginButtonWithModal';

export default function Header() {
  const { goHome, gotoComponents } = useNavigation();
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
