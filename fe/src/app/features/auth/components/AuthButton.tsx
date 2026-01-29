'use client';

'use client';

import { ButtonHTMLAttributes } from 'react';
import CSSUtil from '@/utils/css';
import BrandIcon from '@/app/components/shared/icon/Brand';
import styles from './authButton.module.css';

export type AuthVariant = 'google' | 'github' | 'mbwt';

export interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: AuthVariant;
  label: string;
}

const ICON_MAP: Record<AuthVariant, string> = {
  google: 'google',
  github: 'github',
  mbwt: 'mbwt',
};

function AuthButton({ variant, label, ...rest }: AuthButtonProps) {
  const className = CSSUtil.buildCls(styles.authButton, styles[variant], 'clickable');
  return (
    <button type="button" className={className} {...rest}>
      <span className={styles.icon}>
        <BrandIcon name={ICON_MAP[variant]} size="medium" />
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export function GithubAuthButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <AuthButton variant="github" label="Github 계정으로 로그인" {...props} />;
}

export function GoogleAuthButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <AuthButton variant="google" label="Google 계정으로 로그인" {...props} />;
}

export function MbwtAuthButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <AuthButton variant="mbwt" label="Test 계정으로 로그인" {...props} />;
}
