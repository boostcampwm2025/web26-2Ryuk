import styles from './loading.module.css';
import SpriteAnimation from '@/app/components/sprite/spriteAnimation/SpriteAnimation';

export default function Loading() {
  return (
    <div className={styles.loading}>
      <div className={styles.scrim} />
      <div className={styles.content}>
        <SpriteAnimation variant="drop" size="large" />
      </div>
    </div>
  );
}
