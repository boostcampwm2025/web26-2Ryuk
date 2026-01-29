'use client';

import { useState } from 'react';
import * as TextButton from '@/app/components/shared/button/TextButton';
import Component from '@/app/components/helpers/Component';
import styles from '@/app/components/helpers/components.module.css';
import BeakerFillView from './BeakerFillView';

function BeakerFillViewShowcase() {
  const maxLevel = 1000;
  const highestScore = 800;
  const [meScore, setMeScore] = useState(300);
  const [other1Score, setOther1Score] = useState(500);
  const [other2Score, setOther2Score] = useState(500);
  const [meTrigger, setMeTrigger] = useState(0);
  const [other1Trigger, setOther1Trigger] = useState(0);
  const [other2Trigger, setOther2Trigger] = useState(0);

  const triggerMe = () => {
    setMeTrigger((value) => value + 1);
    setMeScore((value) => Math.min(maxLevel, value + 1));
  };

  const triggerOther1 = () => {
    setOther1Trigger((value) => value + 1);
    setOther1Score((value) => Math.min(maxLevel, value + 1));
  };

  const triggerOther2 = () => {
    setOther2Trigger((value) => value + 1);
    setOther2Score((value) => Math.min(maxLevel, value + 1));
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
            score={other1Score}
            maxLevel={maxLevel}
            dropTrigger={other1Trigger}
          />
        </Component>
        <TextButton.Secondary text="Drop (other)" size="small" onClick={triggerOther1} />
      </div>
      <div className={styles.circleItem}>
        <Component>
          <BeakerFillView
            type="other"
            score={other2Score}
            highestScore={highestScore}
            maxLevel={maxLevel}
            dropTrigger={other2Trigger}
          />
        </Component>
        <TextButton.Secondary text="Drop (other)" size="small" onClick={triggerOther2} />
      </div>
    </div>
  );
}

export default BeakerFillViewShowcase;
