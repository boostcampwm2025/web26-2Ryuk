'use client';

import { useCallback, useState } from 'react';
import CSSUtil from '@/utils/css';
import styles from './spriteAnimation.module.css';
import { SpriteAnimationProps } from './type';
import Paths from '@/app/shared/path';

const VARIANT_CONFIG = {
  default: { frames: 43, duration: '2s' },
  drop: { frames: 20, duration: '1s' },
  burst: { frames: 20, duration: '.5s' },
} as const;

export default function SpriteAnimation({
  variant,
  size,
  autoPlay = true,
  loop = true,
  onEnd,
}: SpriteAnimationProps) {
  const [isPlaying] = useState(autoPlay);
  const config = VARIANT_CONFIG[variant];

  const handleAnimationEnd = useCallback(() => {
    if (loop) return;
    onEnd?.();
  }, [loop, onEnd]);

  const style = {
    '--frames': String(config.frames),
    '--duration': config.duration,
  } as React.CSSProperties;

  const className = CSSUtil.buildCls(styles.sprite, styles[size]);
  const wrapperClassName = CSSUtil.buildCls(
    styles.spriteWrapper,
    isPlaying && styles.playing,
    isPlaying && (loop ? styles.loop : styles.once),
  );

  return (
    <div className={className} style={style}>
      <div className={wrapperClassName} onAnimationEnd={handleAnimationEnd}>
        <object
          type="image/svg+xml"
          data={Paths.gif(variant)}
          aria-label={`${variant} animation`}
        />
      </div>
    </div>
  );
}
