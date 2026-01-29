import styles from '@/app/components/helpers/components.module.css';
import TableOfContents from '@/app/components/helpers/TableOfContents';
import TabNavigation from '@/app/components/helpers/TabNavigation';
import { sharedSections } from '@/app/components/helpers/type';
import SharedComponents from './Shared';
import IconUtil from '@/utils/icon';

export default async function SharedComponentsPage() {
  const iconList = IconUtil.extractNames('icons.svg');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Components</h1>
        <p className={styles.subtitle}>Design system and feature components showcase.</p>
      </header>
      <TabNavigation />
      <div className={styles.contentWithToc}>
        <SharedComponents iconList={iconList} />
        <TableOfContents sections={sharedSections} />
      </div>
    </div>
  );
}
