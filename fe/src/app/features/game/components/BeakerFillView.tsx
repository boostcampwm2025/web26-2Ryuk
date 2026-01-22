// app/components/feature/beaker/BeakerFillView.tsx
'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './beakerFillView.module.css';
import Paths from '@/app/shared/path';
import CSSUtil from '@/utils/css';
import WaterDrop from '@/app/components/sprite/waterDrop/WaterDrop';
import { GAME_IDS } from '@/app/shared/constant';

type WaterType = 'me' | 'other';

export interface BeakerFillViewProps {
  type: WaterType;
  dropTrigger: number;
  onDropEnd?: () => void;
  score?: number;
  maxLevel?: number;
}

function BeakerFillView({
  type,
  dropTrigger,
  onDropEnd,
  score = 0,
  maxLevel = 1000,
}: BeakerFillViewProps) {
  const [drops, setDrops] = useState<number[]>([]);
  const prevTriggerRef = useRef(dropTrigger);
  const dropIdRef = useRef(0);

  const beakerSrc = Paths.games(GAME_IDS.BEAKER, 'beaker');
  const maskSrc = Paths.games(GAME_IDS.BEAKER, 'beaker-mask');
  const BEAKER_HEIGHT = 220;

  const clampedLevel = useMemo(() => {
    const base = maxLevel > 0 ? maxLevel : 1;
    return Math.min(1, Math.max(0, score / base));
  }, [score, maxLevel]);

  useEffect(() => {
    if (prevTriggerRef.current === dropTrigger) return;
    prevTriggerRef.current = dropTrigger;

    dropIdRef.current += 1;
    setDrops((prev) => [...prev, dropIdRef.current]);
  }, [dropTrigger]);

  const handleDropEnd = (id: number) => {
    setDrops((prev) => prev.filter((v) => v !== id));
    onDropEnd?.();
  };

  const containerStyle = {
    '--drop-distance': `${BEAKER_HEIGHT * (1 - clampedLevel)}px`,
  } as CSSProperties;

  const maskStyle = {
    '--water-height': `${clampedLevel * 100}%`,
    WebkitMaskImage: `url(${maskSrc})`,
    maskImage: `url(${maskSrc})`,
  } as CSSProperties;

  const className = CSSUtil.buildCls(styles.container, styles[type]);

  return (
    <div className={className} style={containerStyle} data-type={type}>
      <div className={styles.dropLayer}>
        {drops.map((id) => (
          <div key={id} className={styles.drop} onAnimationEnd={() => handleDropEnd(id)}>
            <WaterDrop type={type} />
          </div>
        ))}
      </div>

      <div className={styles.beakerLayer}>
        <div className={styles.maskLayer} style={maskStyle}>
          <div className={styles.water} />
        </div>

        <Image
          src={beakerSrc}
          alt=""
          aria-hidden
          className={styles.beakerOutline}
          width={140}
          height={220}
        />
      </div>
    </div>
  );
}

export default BeakerFillView;
