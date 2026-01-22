import styles from './badge.module.css';
import Icon from '@/app/components/shared/icon/Icon';

export default function HostBadge() {
  return (
    <div className={styles.badge}>
      <Icon name="special" size="medium" />
    </div>
  );
}
