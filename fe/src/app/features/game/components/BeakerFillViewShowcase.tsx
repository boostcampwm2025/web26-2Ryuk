'use client';

import { useState } from 'react';
import * as TextButton from '@/app/components/shared/button/TextButton';
import Component from '@/app/components/helpers/Component';
import styles from '@/app/components/helpers/components.module.css';
import BeakerFillView from './BeakerFillView';

function BeakerFillViewShowcase() {
  const maxLevel = 1000;
  const [meScore, setMeScore] = useState(300);
  const [otherScore, setOtherScore] = useState(500);
  const [meTrigger, setMeTrigger] = useState(0);
  const [otherTrigger, setOtherTrigger] = useState(0);

  const triggerMe = () => {
    setMeTrigger((value) => value + 1);
    setMeScore((value) => Math.min(maxLevel, value + 1));
  };

  const triggerOther = () => {
    setOtherTrigger((value) => value + 1);
    setOtherScore((value) => Math.min(maxLevel, value + 1));
  };

  return (
    <div className={styles.iconRow}>
      <div className={styles.circleItem}>
        <Component>
          <BeakerFillView type="me" score={meScore} maxLevel={maxLevel} dropTrigger={meTrigger} />
        </Component>
        <TextButton.Primary text="Drop (me)" size="small" onClick={triggerMe} />
      </div>
      <div className={styles.circleItem}>
        <Component>
          <BeakerFillView
            type="other"
            score={otherScore}
            maxLevel={maxLevel}
            dropTrigger={otherTrigger}
          />
        </Component>
        <TextButton.Secondary text="Drop (other)" size="small" onClick={triggerOther} />
      </div>
    </div>
  );
}

export default BeakerFillViewShowcase;
