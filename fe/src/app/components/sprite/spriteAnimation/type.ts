export type SpriteAnimationVariant = 'default' | 'drop' | 'burst';
export type SpriteAnimationSize = 'small' | 'medium' | 'large';

export interface SpriteAnimationProps {
  variant: SpriteAnimationVariant;
  size: SpriteAnimationSize;
  autoPlay?: boolean;
  loop?: boolean;
  onEnd?: () => void;
}
