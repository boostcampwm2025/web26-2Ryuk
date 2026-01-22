import styles from './chip.module.css';
import { ChipButtonProps } from './type';
import { ChipBase } from './Chip';
import CSSUtil from '@/utils/css';

function ChipButtonBase({
  variant,
  icon,
  label,
  size = 'medium',
  onClick,
  disabled = false,
  type = 'button',
  modalId,
}: ChipButtonProps) {
  const className = CSSUtil.buildCls(styles.chipButton, 'clickable');

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      modal-id={modalId}
    >
      <ChipBase label={label} icon={icon} size={size} variant={variant} />
    </button>
  );
}

export function PrimaryChipButton(props: Omit<ChipButtonProps, 'variant'>) {
  return <ChipButtonBase {...props} variant="primary" />;
}

export function SecondaryChipButton(props: Omit<ChipButtonProps, 'variant'>) {
  return <ChipButtonBase {...props} variant="secondary" />;
}

export function OutlineChipButton(props: Omit<ChipButtonProps, 'variant'>) {
  return <ChipButtonBase {...props} variant="outline" />;
}

export function GhostChipButton(props: Omit<ChipButtonProps, 'variant'>) {
  return <ChipButtonBase {...props} variant="ghost" />;
}

export function DefaultChipButton(props: Omit<ChipButtonProps, 'variant'>) {
  return <ChipButtonBase {...props} variant="default" />;
}

export function SuccessPrimaryChipButton(props: Omit<ChipButtonProps, 'variant'>) {
  return <ChipButtonBase {...props} variant="success-primary" />;
}

export function SuccessSecondaryChipButton(props: Omit<ChipButtonProps, 'variant'>) {
  return <ChipButtonBase {...props} variant="success-secondary" />;
}

export function WarningPrimaryChipButton(props: Omit<ChipButtonProps, 'variant'>) {
  return <ChipButtonBase {...props} variant="warning-primary" />;
}

export function WarningSecondaryChipButton(props: Omit<ChipButtonProps, 'variant'>) {
  return <ChipButtonBase {...props} variant="warning-secondary" />;
}

export function ErrorPrimaryChipButton(props: Omit<ChipButtonProps, 'variant'>) {
  return <ChipButtonBase {...props} variant="error-primary" />;
}

export function ErrorSecondaryChipButton(props: Omit<ChipButtonProps, 'variant'>) {
  return <ChipButtonBase {...props} variant="error-secondary" />;
}

export {
  PrimaryChipButton as Primary,
  SecondaryChipButton as Secondary,
  OutlineChipButton as Outline,
  GhostChipButton as Ghost,
  DefaultChipButton as Default,
  SuccessPrimaryChipButton as SuccessPrimary,
  SuccessSecondaryChipButton as SuccessSecondary,
  WarningPrimaryChipButton as WarningPrimary,
  WarningSecondaryChipButton as WarningSecondary,
  ErrorPrimaryChipButton as ErrorPrimary,
  ErrorSecondaryChipButton as ErrorSecondary,
} from './ChipButton';
