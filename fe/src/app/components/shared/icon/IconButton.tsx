import IconCircle from './IconCircle';
import styles from './icon.module.css';
import { IconButtonProps } from './type';
import CSSUtil from '@/utils/css';

export function IconButtonBase({ name, size, onClick, disabled, variant }: IconButtonProps) {
  return (
    <button
      type="button"
      className={CSSUtil.buildCls(styles.button, 'clickable')}
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

export function SuccessPrimaryIconButton(props: Omit<IconButtonProps, 'variant'>) {
  return <IconButtonBase {...props} variant="success-primary" />;
}

export function SuccessSecondaryIconButton(props: Omit<IconButtonProps, 'variant'>) {
  return <IconButtonBase {...props} variant="success-secondary" />;
}

export function WarningPrimaryIconButton(props: Omit<IconButtonProps, 'variant'>) {
  return <IconButtonBase {...props} variant="warning-primary" />;
}

export function WarningSecondaryIconButton(props: Omit<IconButtonProps, 'variant'>) {
  return <IconButtonBase {...props} variant="warning-secondary" />;
}

export function ErrorPrimaryIconButton(props: Omit<IconButtonProps, 'variant'>) {
  return <IconButtonBase {...props} variant="error-primary" />;
}

export function ErrorSecondaryIconButton(props: Omit<IconButtonProps, 'variant'>) {
  return <IconButtonBase {...props} variant="error-secondary" />;
}

export {
  PrimaryIconButton as Primary,
  SecondaryIconButton as Secondary,
  OutlineIconButton as Outline,
  GhostIconButton as Ghost,
  SuccessPrimaryIconButton as SuccessPrimary,
  SuccessSecondaryIconButton as SuccessSecondary,
  WarningPrimaryIconButton as WarningPrimary,
  WarningSecondaryIconButton as WarningSecondary,
  ErrorPrimaryIconButton as ErrorPrimary,
  ErrorSecondaryIconButton as ErrorSecondary,
} from './IconButton';
