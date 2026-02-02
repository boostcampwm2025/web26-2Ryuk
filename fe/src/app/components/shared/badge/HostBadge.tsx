import { TextTooltip, TooltipTrigger } from '@/app/components/shared/tooltip/TextTooltip';
import styles from './badge.module.css';
import Icon from '@/app/components/shared/icon/Icon';

export default function HostBadge() {
  return (
    <>
      <TooltipTrigger dataAnchor="host-badge">
        <div className={styles.badge}>
          <Icon name="special" size="medium" />
        </div>
      </TooltipTrigger>
      <TextTooltip anchorId="host-badge" text="방장" />
    </>
  );
}
