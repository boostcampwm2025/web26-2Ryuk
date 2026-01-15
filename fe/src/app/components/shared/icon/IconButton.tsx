import { CSSProperties } from 'react';
import IconCircle from './IconCircle';
import styles from './icon.module.css';
import { IconButtonProps } from './type';
import CSSUtil from '@/utils/css';

function IconButtonBase({
  name,
  size,
  onClick,
  disabled,
  variant,
  themeColor = 'default',
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={CSSUtil.buildCls(styles.button, styles[themeColor])}
      onClick={onClick}
      disabled={disabled}
      aria-label={name}
    >
      <IconCircle name={name} size={size} variant={variant} />
    </button>
  );
}

export function PrimaryIconButton(props: Omit<IconButtonProps, 'variant'>) {
  return <IconButtonBase {...props} variant="primary" />;
}

export function SecondaryIconButton(props: Omit<IconButtonProps, 'variant'>) {
  return <IconButtonBase {...props} variant="secondary" />;
}

export function OutlineIconButton(props: Omit<IconButtonProps, 'variant'>) {
  return <IconButtonBase {...props} variant="outline" />;
}

export function GhostIconButton(props: Omit<IconButtonProps, 'variant'>) {
  return <IconButtonBase {...props} variant="ghost" />;
}

export {
  PrimaryIconButton as Primary,
  SecondaryIconButton as Secondary,
  OutlineIconButton as Outline,
  GhostIconButton as Ghost,
} from './IconButton';
