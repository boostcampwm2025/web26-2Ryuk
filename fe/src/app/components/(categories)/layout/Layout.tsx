import Component from '@/app/components/helpers/Component';
import styles from '@/app/components/helpers/components.module.css';
import Header from '@/app/components/layout/header/Header';
import HeroSection from '@/app/components/layout/heroSection/HeroSection';
import {
  PageTitleSection,
  BoardPageTitleSection,
  GamePageTitleSection,
  RankingPageTitleSection,
} from '@/app/components/layout/pageTitleSection/PageTitleSection';
import ComponentRelations from '@/app/components/helpers/ComponentRelations';

export default function LayoutComponents() {
  return (
    <>
      <section id="header" className={styles.section}>
        <h2 className={styles.sectionTitle}>Header</h2>
        <ComponentRelations componentId="header" />
        <div className={styles.showcaseBlock}>
          <Component fullWidth>
            <Header />
          </Component>
        </div>
      </section>

      <section id="hero-section" className={styles.section}>
        <h2 className={styles.sectionTitle}>HeroSection</h2>
        <ComponentRelations componentId="hero-section" />
        <div className={styles.showcaseBlock}>
          <Component fullWidth>
            <HeroSection />
          </Component>
        </div>
      </section>

      <section id="page-title-section" className={styles.section}>
        <h2 className={styles.sectionTitle}>PageTitleSection</h2>
        <ComponentRelations componentId="page-title-section" />
        <div className={styles.showcaseBlock}>
          <Component fullWidth>
            <PageTitleSection label="LABEL" title="Title" description="Description" />
          </Component>
        </div>
      </section>

      <section id="board-page-title-section" className={styles.section}>
        <h2 className={styles.sectionTitle}>BoardPageTitleSection</h2>
        <ComponentRelations componentId="board-page-title-section" />
        <div className={styles.showcaseBlock}>
          <Component fullWidth>
            <BoardPageTitleSection />
          </Component>
        </div>
      </section>

      <section id="game-page-title-section" className={styles.section}>
        <h2 className={styles.sectionTitle}>GamePageTitleSection</h2>
        <ComponentRelations componentId="game-page-title-section" />
        <div className={styles.showcaseBlock}>
          <Component fullWidth>
            <GamePageTitleSection />
          </Component>
        </div>
      </section>

      <section id="ranking-page-title-section" className={styles.section}>
        <h2 className={styles.sectionTitle}>RankingPageTitleSection</h2>
        <ComponentRelations componentId="ranking-page-title-section" />
        <div className={styles.showcaseBlock}>
          <Component fullWidth>
            <RankingPageTitleSection />
          </Component>
        </div>
      </section>
    </>
  );
}
