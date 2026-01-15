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
  const className = CSSUtil.buildCls(styles.button, styles[size], styles[variant]);

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

export {
  PrimaryTextButton as Primary,
  SecondaryTextButton as Secondary,
  OutlineTextButton as Outline,
  GhostTextButton as Ghost,
} from './TextButton';
