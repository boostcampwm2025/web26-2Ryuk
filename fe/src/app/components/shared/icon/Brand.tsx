import { memo } from 'react';
import Paths from '@/app/shared/path';
import styles from './icon.module.css';
import { IconProps } from './type';
import CSSUtil from '@/utils/css';

const DEFAULT_ICON = 'photo';

const BrandIcon = memo(function BrandIcon({ name, size }: IconProps) {
  const resolvedName = name || DEFAULT_ICON;
  const href = Paths.brandIcons(resolvedName);
  const className = CSSUtil.buildCls(styles.icon, styles[size]);
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <use href={href} />
    </svg>
  );
});

export default BrandIcon;
