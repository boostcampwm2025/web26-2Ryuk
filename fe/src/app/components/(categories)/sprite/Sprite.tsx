import styles from '@/app/components/helpers/components.module.css';
import { LogoImage, Logo } from '@/app/components/sprite/logo/Logo';
import SpriteAnimation from '@/app/components/sprite/spriteAnimation/SpriteAnimation';
import WaterDrop from '@/app/components/sprite/waterDrop/WaterDrop';
import Component from '@/app/components/helpers/Component';
import ComponentRelations from '@/app/components/helpers/ComponentRelations';

export default function SpriteComponents() {
  return (
    <>
      <section id="logo-image" className={styles.section}>
        <h2 className={styles.sectionTitle}>LogoImage</h2>
        <ComponentRelations componentId="logo-image" />
        <div className={styles.showcaseBlock}>
          <div className={styles.chipTable}>
            <div className={styles.chipTableHeader}>
              <div className={styles.chipTableCell}></div>
              <div className={styles.chipTableCell}>Default</div>
              <div className={styles.chipTableCell}>Square</div>
              <div className={styles.chipTableCell}>Circle</div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Large</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <LogoImage variant="default" size="large" />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <LogoImage variant="square" size="large" />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <LogoImage variant="circle" size="large" />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Medium</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <LogoImage variant="default" size="medium" />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <LogoImage variant="square" size="medium" />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <LogoImage variant="circle" size="medium" />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Small</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <LogoImage variant="default" size="small" />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <LogoImage variant="square" size="small" />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <LogoImage variant="circle" size="small" />
                </Component>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="logo" className={styles.section}>
        <h2 className={styles.sectionTitle}>Logo</h2>
        <ComponentRelations componentId="logo" />
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Sizes</h3>
          <div className={styles.iconRow}>
            <div className={styles.iconItem}>
              <Component>
                <Logo size="small" />
              </Component>
              <span className={styles.iconLabel}>Small</span>
            </div>
            <div className={styles.iconItem}>
              <Component>
                <Logo size="medium" />
              </Component>
              <span className={styles.iconLabel}>Medium</span>
            </div>
            <div className={styles.iconItem}>
              <Component>
                <Logo size="large" />
              </Component>
              <span className={styles.iconLabel}>Large</span>
            </div>
          </div>
        </div>
      </section>

      <section id="sprite-animation" className={styles.section}>
        <h2 className={styles.sectionTitle}>SpriteAnimation</h2>
        <ComponentRelations componentId="sprite-animation" />
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Default</h3>
          <div className={styles.iconRow}>
            <Component>
              <SpriteAnimation variant="default" size="large" />
            </Component>
            <Component>
              <SpriteAnimation variant="default" size="medium" />
            </Component>
            <Component>
              <SpriteAnimation variant="default" size="small" />
            </Component>
          </div>
        </div>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Drop</h3>
          <div className={styles.iconRow}>
            <Component>
              <SpriteAnimation variant="drop" size="large" />
            </Component>
            <Component>
              <SpriteAnimation variant="drop" size="medium" />
            </Component>
            <Component>
              <SpriteAnimation variant="drop" size="small" />
            </Component>
          </div>
        </div>
      </section>

      <section id="water-drop" className={styles.section}>
        <h2 className={styles.sectionTitle}>WaterDrop</h2>
        <ComponentRelations componentId="water-drop" />
        <div className={styles.showcaseBlock}>
          <div className={styles.iconRow}>
            <div className={styles.iconItem}>
              <Component>
                <WaterDrop type="me" />
              </Component>
              <span className={styles.iconLabel}>Primary</span>
            </div>
            <div className={styles.iconItem}>
              <Component>
                <WaterDrop type="other" />
              </Component>
              <span className={styles.iconLabel}>Secondary</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
