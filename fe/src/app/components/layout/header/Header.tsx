'use client';

import { useRouter } from 'next/navigation';
import styles from './header.module.css';
import { Logo } from '@/app/components/sprite/logo/Logo';
import { OutlineIconButton } from '@/app/components/shared/icon/IconButton';
import Profile from '@/app/components/shared/profile/Profile';
import LoginButton from '@/app/components/shared/button/LoginButton';
import { authStore, type AuthStore } from '@/app/features/user/stores/auth';
import useNavigation from '@/app/hooks/useNavigation';
import LogoutButton from '@/app/components/shared/button/LogoutButton';

export default function Header() {
  const { goHome } = useNavigation();
  const user = authStore((state: AuthStore) => state.user);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Logo size="small" onClick={goHome} />
        </div>
        <div className={styles.right}>
          <OutlineIconButton name="settings" size="small" />
          {user ? <LogoutButton /> : <LoginButton />}
          <div className={styles.separator} />
          {user && <Profile nickname={user.nickname} profileImage={user.profileImage} />}
        </div>
      </div>
    </header>
  );
}
