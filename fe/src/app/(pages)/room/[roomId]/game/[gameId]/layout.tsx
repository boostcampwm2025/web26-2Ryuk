import styles from './layout.module.css';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.wrapper}>{children}</div>;
}
