import CSSUtil from '@/utils/css';
import Icon from './Icon';
import styles from './icon.module.css';
import { IconCircleProps } from './type';

export default function IconCircle({ name, size, variant }: IconCircleProps) {
  const className = CSSUtil.buildCls(styles.circle, styles[variant], styles[size]);
  return (
    <span className={className} role="img" aria-label={name}>
      <Icon name={name} size={size} />
    </span>
  );
}

export function PrimaryIconCircle(props: Omit<IconCircleProps, 'variant'>) {
  return <IconCircle {...props} variant="primary" />;
}

export function SecondaryIconCircle(props: Omit<IconCircleProps, 'variant'>) {
  return <IconCircle {...props} variant="secondary" />;
}

export function OutlineIconCircle(props: Omit<IconCircleProps, 'variant'>) {
  return <IconCircle {...props} variant="outline" />;
}

export function GhostIconCircle(props: Omit<IconCircleProps, 'variant'>) {
  return <IconCircle {...props} variant="ghost" />;
}

export function SuccessPrimaryIconCircle(props: Omit<IconCircleProps, 'variant'>) {
  return <IconCircle {...props} variant="success-primary" />;
}

export function SuccessSecondaryIconCircle(props: Omit<IconCircleProps, 'variant'>) {
  return <IconCircle {...props} variant="success-secondary" />;
}

export function WarningPrimaryIconCircle(props: Omit<IconCircleProps, 'variant'>) {
  return <IconCircle {...props} variant="warning-primary" />;
}

export function WarningSecondaryIconCircle(props: Omit<IconCircleProps, 'variant'>) {
  return <IconCircle {...props} variant="warning-secondary" />;
}

export function ErrorPrimaryIconCircle(props: Omit<IconCircleProps, 'variant'>) {
  return <IconCircle {...props} variant="error-primary" />;
}

export function ErrorSecondaryIconCircle(props: Omit<IconCircleProps, 'variant'>) {
  return <IconCircle {...props} variant="error-secondary" />;
}
export {
  PrimaryIconCircle as Primary,
  SecondaryIconCircle as Secondary,
  OutlineIconCircle as Outline,
  GhostIconCircle as Ghost,
  SuccessPrimaryIconCircle as SuccessPrimary,
  SuccessSecondaryIconCircle as SuccessSecondary,
  WarningPrimaryIconCircle as WarningPrimary,
  WarningSecondaryIconCircle as WarningSecondary,
  ErrorPrimaryIconCircle as ErrorPrimary,
  ErrorSecondaryIconCircle as ErrorSecondary,
} from './IconCircle';
