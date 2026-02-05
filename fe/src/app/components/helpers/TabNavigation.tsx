'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './components.module.css';
import CSSUtil from '@/utils/css';

const TABS = [
  { href: '/components/shared', label: 'Shared' },
  { href: '/components/layout', label: 'Layout' },
  { href: '/components/features', label: 'Features' },
  { href: '/components/sprite', label: 'Sprite' },
] as const;

export default function TabNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === href) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    router.push(href);
  };

  return (
    <nav className={styles.pageNavigation} role="tablist">
      {TABS.map(({ href, label }) => {
        const isActive = pathname === href;
        const className = CSSUtil.buildCls(styles.navLink, isActive && styles.navLinkActive);
        return (
          <Link
            key={href}
            href={href}
            className={className}
            role="tab"
            aria-selected={isActive}
            onClick={(e) => handleClick(e, href)}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
