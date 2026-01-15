import { MouseEventHandler } from 'react';

export type IconVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type IconSize = 'small' | 'medium' | 'large';
export type ThemeColor = 'default' | 'secondary' | 'success' | 'warning' | 'error';

export interface IconProps {
  name: string;
  size: IconSize;
}

export interface IconCircleProps {
  name: string;
  size: IconSize;
  variant: IconVariant;
}

export interface IconButtonProps extends IconCircleProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  themeColor?: ThemeColor;
}
