import CSSUtil from '@/utils/css';
import styles from './button.module.css';
import { TextButtonProps } from './type';
import Icon from '@/app/components/shared/icon/Icon';

function TextButtonBase({
  text,
  iconName,
  onClick,
  disabled = false,
  variant,
  size,
  type = 'button',
  modalId,
}: TextButtonProps) {
  const className = CSSUtil.buildCls(styles.button, styles[size], styles[variant], 'clickable');

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      modal-id={modalId}
    >
      <div className={styles.content}>
        {iconName && <Icon name={iconName} size={size} />}
        {text}
      </div>
    </button>
  );
}

export function PrimaryTextButton(props: Omit<TextButtonProps, 'variant'>) {
  return <TextButtonBase {...props} variant="primary" />;
}

export function SecondaryTextButton(props: Omit<TextButtonProps, 'variant'>) {
  return <TextButtonBase {...props} variant="secondary" />;
}

export function OutlineTextButton(props: Omit<TextButtonProps, 'variant'>) {
  return <TextButtonBase {...props} variant="outline" />;
}

export function GhostTextButton(props: Omit<TextButtonProps, 'variant'>) {
  return <TextButtonBase {...props} variant="ghost" />;
}

export function SuccessPrimaryTextButton(props: Omit<TextButtonProps, 'variant'>) {
  return <TextButtonBase {...props} variant="success-primary" />;
}

export function SuccessSecondaryTextButton(props: Omit<TextButtonProps, 'variant'>) {
  return <TextButtonBase {...props} variant="success-secondary" />;
}

export function WarningPrimaryTextButton(props: Omit<TextButtonProps, 'variant'>) {
  return <TextButtonBase {...props} variant="warning-primary" />;
}

export function WarningSecondaryTextButton(props: Omit<TextButtonProps, 'variant'>) {
  return <TextButtonBase {...props} variant="warning-secondary" />;
}

export function ErrorPrimaryTextButton(props: Omit<TextButtonProps, 'variant'>) {
  return <TextButtonBase {...props} variant="error-primary" />;
}

export function ErrorSecondaryTextButton(props: Omit<TextButtonProps, 'variant'>) {
  return <TextButtonBase {...props} variant="error-secondary" />;
}

export function TextButton(props: TextButtonProps) {
  return <TextButtonBase {...props} />;
}

export {
  PrimaryTextButton as Primary,
  SecondaryTextButton as Secondary,
  OutlineTextButton as Outline,
  GhostTextButton as Ghost,
  SuccessPrimaryTextButton as SuccessPrimary,
  SuccessSecondaryTextButton as SuccessSecondary,
  WarningPrimaryTextButton as WarningPrimary,
  WarningSecondaryTextButton as WarningSecondary,
  ErrorPrimaryTextButton as ErrorPrimary,
  ErrorSecondaryTextButton as ErrorSecondary,
} from './TextButton';
