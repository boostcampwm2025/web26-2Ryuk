'use client';

import { CSSProperties } from 'react';
import styles from './waterDrop.module.css';
import Paths from '@/app/shared/path';
import { GAME_IDS } from '@/app/shared/constant';
import CSSUtil from '@/utils/css';

type WaterType = 'me' | 'other';

interface WaterDropProps {
  type: WaterType;
}

function WaterDrop({ type }: WaterDropProps) {
  const className = CSSUtil.buildCls(styles.drop, styles[type]);
  const src = Paths.games(GAME_IDS.BEAKER, 'drop');
  const style = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
  } as CSSProperties;

  return <div className={className} style={style} aria-hidden />;
}

export default WaterDrop;
