'use client';

import { useState } from 'react';
import styles from '@/app/components/helpers/components.module.css';
import Icon from '@/app/components/shared/icon/Icon';
import BrandIcon from '@/app/components/shared/icon/Brand';
import IconCircleDefault from '@/app/components/shared/icon/IconCircle';
import * as IconCircle from '@/app/components/shared/icon/IconCircle';
import * as IconButton from '@/app/components/shared/icon/IconButton';
import * as TextButton from '@/app/components/shared/button/TextButton';
import * as Textfield from '@/app/components/shared/textfield/Textfield';
import * as Slider from '@/app/components/shared/slider/Slider';
import ProgressBar from '@/app/components/shared/progressBar/ProgressBar';
import RemainingTimeBar from '@/app/components/shared/remainingTimeBar/RemainingTimeBar';
import * as Chip from '@/app/components/shared/chip/Chip';
import * as ChipButton from '@/app/components/shared/chip/ChipButton';
import Toggle from '@/app/components/shared/toggle/Toggle';
import ToggleChip from '@/app/components/shared/chip/ToggleChip';
import StatusChip from '@/app/components/shared/chip/StatusChip';
import Stepper from '@/app/components/shared/stepper/Stepper';
import TagSelector from '@/app/components/shared/tag/TagSelector';
import Component from '@/app/components/helpers/Component';
import SearchForm from '@/app/components/shared/form/search/SearchForm';
import MessageForm from '@/app/components/shared/form/message/MessageForm';
import ParticipantStepper from '@/app/components/shared/stepper/ParticipantStepper';
import { TextTooltip } from '@/app/components/shared/tooltip/TextTooltip';
import GoBackButton from '@/app/components/shared/button/GoBackButton';
import RadioButton from '@/app/components/shared/radioButton/RadioButton';
import Dropdown from '@/app/components/shared/dropdown/Dropdown';
import ComponentRelations from '@/app/components/helpers/ComponentRelations';
import Avatar from '@/app/components/shared/profile/Avatar';
import AvatarCount from '@/app/components/shared/profile/AvatarCount';
import PageIndicator from '@/app/components/shared/pageIndicator/PageIndicator';
import LoginButtonWithModal from '@/app/components/shared/button/LoginButtonWithModal';
import { ProfileRow, ProfileColumn } from '@/app/components/shared/profile/Profile';
import Avatars from '@/app/components/shared/profile/Avatars';
import profilesMock from '@/mocks/data/profiles.json';
import Paths from '@/app/shared/path';
import Table from '@/app/components/table/Table';
import { RankCoin } from '@/app/components/shared/coin';
import type { TableColumn } from '@/app/components/table/types';
import type { GamePlayerResultItemData } from '@/app/features/game/dtos/data';
import { GameConverter } from '@/app/features/game/dtos/converter';
import resultsMock from '@/mocks/data/results.json';
import {
  GithubAuthButton,
  GoogleAuthButton,
  MbwtAuthButton,
} from '@/app/features/auth/components/AuthButton';

const sharedTableColumns: TableColumn<GamePlayerResultItemData>[] = [
  {
    key: 'rank',
    header: '순위',
    width: 80,
    render: (row) => <RankCoin rank={row.rank} />,
  },
  {
    key: 'player',
    header: '프로필',
    width: 200,
    render: (row) => <span>{row.nickname}</span>,
  },
  {
    key: 'score',
    header: '점수',
    width: 120,
    render: (row) => <span>{Number(row.score).toLocaleString()}</span>,
  },
  {
    key: 'id',
    header: '아이디',
    width: 'auto',
    render: (row) => <span>{row.playerId.slice(0, 8)}</span>,
  },
];

interface SharedComponentsProps {
  iconList: string[];
}

export default function SharedComponents({ iconList }: SharedComponentsProps) {
  const sharedResultData = GameConverter.toGamePlayerRecordsData(resultsMock);
  const sharedTableData = sharedResultData.rankings;
  const sharedGetRowKey = (row: GamePlayerResultItemData) => row.playerId;
  const sharedHighlightRow = (row: GamePlayerResultItemData) => row.rank === 1;
  const [selectedDropdownValue, setSelectedDropdownValue] = useState('item2');
  const [pageIndicatorPage, setPageIndicatorPage] = useState(1);
  const pageIndicatorMax = 12;

  const handlePageIndicatorSelect = (page: number) => {
    setPageIndicatorPage((_) => {
      if (page < 1) return 1;
      if (page > pageIndicatorMax) return pageIndicatorMax;
      return page;
    });
  };

  return (
    <>
      <section id="icons" className={styles.section}>
        <h2 className={styles.sectionTitle}>Icons</h2>
        <div className={styles.iconGrid}>
          {iconList.map((iconName) => (
            <div key={iconName} className={styles.iconItem}>
              <div className={styles.iconWrapper}>
                <Icon name={iconName} size="medium" />
              </div>
              <span className={styles.iconLabel}>{iconName}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="brand-icons" className={styles.section}>
        <h2 className={styles.sectionTitle}>BrandIcons</h2>
        <ComponentRelations componentId="brand-icons" />
        <div className={styles.iconGrid}>
          {[
            { name: 'google', label: 'Google' },
            { name: 'github', label: 'Github' },
            { name: 'mbwt', label: 'MBWT' },
          ].map((item) => (
            <div key={item.name} className={styles.iconItem}>
              <div className={styles.iconWrapper}>
                <BrandIcon name={item.name} size="medium" />
              </div>
              <span className={styles.iconLabel}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="iconcircle" className={styles.section}>
        <h2 className={styles.sectionTitle}>IconCircle</h2>
        <div className={styles.chipTable}>
          <div className={styles.chipTableHeader}>
            <div className={styles.chipTableCell}></div>
            <div className={styles.chipTableCell}>Primary</div>
            <div className={styles.chipTableCell}>Secondary</div>
            <div className={styles.chipTableCell}>Outline</div>
            <div className={styles.chipTableCell}>Ghost</div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Large</div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircleDefault name="send" variant="primary" size="large" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircleDefault name="send" variant="secondary" size="large" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.Outline name="send" size="large" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.Ghost name="send" size="large" />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Medium</div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircleDefault name="send" variant="primary" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircleDefault name="send" variant="secondary" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.Outline name="send" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.Ghost name="send" size="medium" />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Small</div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.Primary name="send" size="small" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.Secondary name="send" size="small" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.Outline name="send" size="small" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.Ghost name="send" size="small" />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="icon-button" className={styles.section}>
        <h2 className={styles.sectionTitle}>IconButton</h2>
        <div className={styles.chipTable}>
          <div className={styles.chipTableHeader}>
            <div className={styles.chipTableCell}></div>
            <div className={styles.chipTableCell}>Primary</div>
            <div className={styles.chipTableCell}>Secondary</div>
            <div className={styles.chipTableCell}>Outline</div>
            <div className={styles.chipTableCell}>Ghost</div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Large</div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Primary name="send" size="large" />
              </Component>
              <Component>
                <IconButton.Primary name="send" size="large" disabled />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Secondary name="send" size="large" />
              </Component>
              <Component>
                <IconButton.Secondary name="send" size="large" disabled />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Outline name="send" size="large" />
              </Component>
              <Component>
                <IconButton.Outline name="send" size="large" disabled />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Ghost name="send" size="large" />
              </Component>
              <Component>
                <IconButton.Ghost name="send" size="large" disabled />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Medium</div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Primary name="send" size="medium" />
              </Component>
              <Component>
                <IconButton.Primary name="send" size="medium" disabled />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Secondary name="send" size="medium" />
              </Component>
              <Component>
                <IconButton.Secondary name="send" size="medium" disabled />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Outline name="send" size="medium" />
              </Component>
              <Component>
                <IconButton.Outline name="send" size="medium" disabled />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Ghost name="send" size="medium" />
              </Component>
              <Component>
                <IconButton.Ghost name="send" size="medium" disabled />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Small</div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Primary name="send" size="small" />
              </Component>
              <Component>
                <IconButton.Primary name="send" size="small" disabled />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Secondary name="send" size="small" />
              </Component>
              <Component>
                <IconButton.Secondary name="send" size="small" disabled />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Outline name="send" size="small" />
              </Component>
              <Component>
                <IconButton.Outline name="send" size="small" disabled />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconButton.Ghost name="send" size="small" />
              </Component>
              <Component>
                <IconButton.Ghost name="send" size="small" disabled />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="text-button" className={styles.section}>
        <h2 className={styles.sectionTitle}>TextButton</h2>
        <div className={styles.buttonTableContainer}>
          <div className={styles.chipTable}>
            <div className={styles.chipTableHeader}>
              <div className={styles.chipTableCell}></div>
              <div className={styles.chipTableCell}>Primary</div>
              <div className={styles.chipTableCell}>Secondary</div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Large</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Primary text="LargePrimary" size="large" />
                </Component>
                <Component>
                  <TextButton.Primary text="LargePrimary" size="large" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Secondary text="LargeSecondary" size="large" />
                </Component>
                <Component>
                  <TextButton.Secondary text="LargeSecondary" size="large" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Medium</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Primary text="MediumPrimary" size="medium" />
                </Component>
                <Component>
                  <TextButton.Primary text="MediumPrimary" size="medium" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Secondary text="MediumSecondary" size="medium" />
                </Component>
                <Component>
                  <TextButton.Secondary text="MediumSecondary" size="medium" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Small</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Primary text="SmallPrimary" size="small" />
                </Component>
                <Component>
                  <TextButton.Primary text="SmallPrimary" size="small" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Secondary text="SmallSecondary" size="small" />
                </Component>
                <Component>
                  <TextButton.Secondary text="SmallSecondary" size="small" disabled />
                </Component>
              </div>
            </div>
          </div>
          <div className={styles.chipTable}>
            <div className={styles.chipTableHeader}>
              <div className={styles.chipTableCell}></div>
              <div className={styles.chipTableCell}>Outline</div>
              <div className={styles.chipTableCell}>Ghost</div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Large</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Outline text="LargeOutline" size="large" />
                </Component>
                <Component>
                  <TextButton.Outline text="LargeOutline" size="large" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Ghost text="LargeGhost" size="large" />
                </Component>
                <Component>
                  <TextButton.Ghost text="LargeGhost" size="large" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Medium</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Outline text="MediumOutline" size="medium" />
                </Component>
                <Component>
                  <TextButton.Outline text="MediumOutline" size="medium" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Ghost text="MediumGhost" size="medium" />
                </Component>
                <Component>
                  <TextButton.Ghost text="MediumGhost" size="medium" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Small</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Outline text="SmallOutline" size="small" />
                </Component>
                <Component>
                  <TextButton.Outline text="SmallOutline" size="small" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Ghost text="SmallGhost" size="small" />
                </Component>
                <Component>
                  <TextButton.Ghost text="SmallGhost" size="small" disabled />
                </Component>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="text-button-icon" className={styles.section}>
        <h2 className={styles.sectionTitle}>TextButton w/ Icon</h2>
        <div className={styles.buttonTableContainer}>
          <div className={styles.chipTable}>
            <div className={styles.chipTableHeader}>
              <div className={styles.chipTableCell}></div>
              <div className={styles.chipTableCell}>Primary</div>
              <div className={styles.chipTableCell}>Secondary</div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Large</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Primary text="LargePrimary" size="large" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Primary text="LargePrimary" size="large" iconName="send" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Secondary text="LargeSecondary" size="large" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Secondary
                    text="LargeSecondary"
                    size="large"
                    iconName="send"
                    disabled
                  />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Medium</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Primary text="MediumPrimary" size="medium" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Primary text="MediumPrimary" size="medium" iconName="send" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Secondary text="MediumSecondary" size="medium" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Secondary
                    text="MediumSecondary"
                    size="medium"
                    iconName="send"
                    disabled
                  />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Small</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Primary text="SmallPrimary" size="small" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Primary text="SmallPrimary" size="small" iconName="send" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Secondary text="SmallSecondary" size="small" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Secondary
                    text="SmallSecondary"
                    size="small"
                    iconName="send"
                    disabled
                  />
                </Component>
              </div>
            </div>
          </div>
          <div className={styles.chipTable}>
            <div className={styles.chipTableHeader}>
              <div className={styles.chipTableCell}></div>
              <div className={styles.chipTableCell}>Outline</div>
              <div className={styles.chipTableCell}>Ghost</div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Large</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Outline text="LargeOutline" size="large" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Outline text="LargeOutline" size="large" iconName="send" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Ghost text="LargeGhost" size="large" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Ghost text="LargeGhost" size="large" iconName="send" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Medium</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Outline text="MediumOutline" size="medium" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Outline text="MediumOutline" size="medium" iconName="send" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Ghost text="MediumGhost" size="medium" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Ghost text="MediumGhost" size="medium" iconName="send" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Small</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Outline text="SmallOutline" size="small" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Outline text="SmallOutline" size="small" iconName="send" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <TextButton.Ghost text="SmallGhost" size="small" iconName="send" />
                </Component>
                <Component>
                  <TextButton.Ghost text="SmallGhost" size="small" iconName="send" disabled />
                </Component>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="go-back-button" className={styles.section}>
        <h2 className={styles.sectionTitle}>GoBackButton</h2>
        <ComponentRelations componentId="go-back-button" />
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Responsive</h3>
          <div className={styles.buttonColumn}>
            <Component>
              <GoBackButton />
            </Component>
          </div>
        </div>
      </section>

      <section id="text-field" className={styles.section}>
        <h2 className={styles.sectionTitle}>Textfield</h2>
        <div className={styles.textfieldRow}>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Primary</h3>
            <div className={styles.buttonColumn}>
              <div className={styles.circleItem}>
                <Component>
                  <Textfield.Primary placeholder="PrimaryTextfield" hidable />
                </Component>
                <span className={styles.iconLabel}>Primary hidable</span>
              </div>
              <div className={styles.circleItem}>
                <Component>
                  <Textfield.Primary placeholder="PrimaryTextfield" />
                </Component>
                <span className={styles.iconLabel}>Primary</span>
              </div>
            </div>
          </div>

          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Outline</h3>
            <div className={styles.buttonColumn}>
              <div className={styles.circleItem}>
                <Component>
                  <Textfield.Outline placeholder="OutlineTextfield" hidable />
                </Component>
                <span className={styles.iconLabel}>Outline hidable</span>
              </div>
              <div className={styles.circleItem}>
                <Component>
                  <Textfield.Outline placeholder="OutlineTextfield" />
                </Component>
                <span className={styles.iconLabel}>Outline</span>
              </div>
            </div>
          </div>

          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Default</h3>
            <div className={styles.buttonColumn}>
              <div className={styles.circleItem}>
                <Component>
                  <Textfield.Default placeholder="DefaultTextfield" hidable />
                </Component>
                <span className={styles.iconLabel}>Default hidable</span>
              </div>
              <div className={styles.circleItem}>
                <Component>
                  <Textfield.Default placeholder="DefaultTextfield" />
                </Component>
                <span className={styles.iconLabel}>Default</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="search-form" className={styles.section}>
        <h2 className={styles.sectionTitle}>Search Form</h2>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Default</h3>
          <div className={styles.buttonColumn}>
            <Component>
              <SearchForm placeholder="Search..." />
            </Component>
          </div>
        </div>
      </section>

      <section id="message-form" className={styles.section}>
        <h2 className={styles.sectionTitle}>Message Form</h2>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Default</h3>
          <div className={styles.buttonColumn}>
            <Component>
              <MessageForm placeholder="MessageForm" />
            </Component>
          </div>
        </div>
      </section>

      <section id="toggle" className={styles.section}>
        <h2 className={styles.sectionTitle}>Toggle</h2>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Default</h3>
          <div className={styles.iconRow}>
            <div className={styles.circleItem}>
              <Component>
                <Toggle />
              </Component>
              <span className={styles.iconLabel}>Off</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <Toggle initialChecked />
              </Component>
              <span className={styles.iconLabel}>On</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <Toggle disabled />
              </Component>
              <span className={styles.iconLabel}>Disabled</span>
            </div>
          </div>
        </div>
      </section>

      <section id="slider" className={styles.section}>
        <h2 className={styles.sectionTitle}>Slider</h2>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Primary</h3>
          <div className={styles.iconRow}>
            <div className={styles.circleItem}>
              <Component>
                <Slider.Primary value={0.5} />
              </Component>
              <span className={styles.iconLabel}>Primary</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <Slider.Primary value={0.5} disabled />
              </Component>
              <span className={styles.iconLabel}>Primary Disabled</span>
            </div>
          </div>
        </div>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Secondary</h3>
          <div className={styles.iconRow}>
            <div className={styles.circleItem}>
              <Component>
                <Slider.Secondary value={0.5} />
              </Component>
              <span className={styles.iconLabel}>Secondary</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <Slider.Secondary value={0.5} disabled />
              </Component>
              <span className={styles.iconLabel}>Secondary Disabled</span>
            </div>
          </div>
        </div>
      </section>

      <section id="progress-bar" className={styles.section}>
        <h2 className={styles.sectionTitle}>ProgressBar</h2>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Primary</h3>
          <div className={styles.iconRow}>
            {[0, 0.35, 0.75].map((value) => (
              <div key={`primary-${value}`} className={styles.circleItem}>
                <Component fullWidth>
                  <ProgressBar value={value} variant="primary" />
                </Component>
                <span className={styles.iconLabel}>{String(value * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Secondary</h3>
          <div className={styles.iconRow}>
            {[0, 0.35, 0.75].map((value) => (
              <div key={`secondary-${value}`} className={styles.circleItem}>
                <Component fullWidth>
                  <ProgressBar value={value} variant="secondary" />
                </Component>
                <span className={styles.iconLabel}>{String(value * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="remaining-time-bar" className={styles.section}>
        <h2 className={styles.sectionTitle}>RemainingTimeBar</h2>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>10초 카운트다운</h3>
          <Component fullWidth>
            <RemainingTimeBar totalDurationMs={10000} remainingMs={10000} variant="primary" />
          </Component>
          <Component fullWidth>
            <RemainingTimeBar totalDurationMs={3000} remainingMs={3000} variant="secondary" />
          </Component>
        </div>
      </section>

      <section id="chip" className={styles.section}>
        <h2 className={styles.sectionTitle}>Chip</h2>
        <div className={styles.chipTable}>
          <div className={styles.chipTableHeader}>
            <div className={styles.chipTableCell}></div>
            <div className={styles.chipTableCell}>Default</div>
            <div className={styles.chipTableCell}>Primary</div>
            <div className={styles.chipTableCell}>Secondary</div>
            <div className={styles.chipTableCell}>Outline</div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Large</div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Default label="large" size="large" />
              </Component>
              <Component>
                <Chip.Default label="large" size="large" icon="message" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Primary label="large" size="large" />
              </Component>
              <Component>
                <Chip.Primary label="large" size="large" icon="message" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Secondary label="large" size="large" />
              </Component>
              <Component>
                <Chip.Secondary label="large" size="large" icon="message" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Outline label="large" size="large" />
              </Component>
              <Component>
                <Chip.Outline label="large" size="large" icon="message" />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Medium</div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Default label="medium" size="medium" />
              </Component>
              <Component>
                <Chip.Default label="medium" size="medium" icon="message" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Primary label="medium" size="medium" />
              </Component>
              <Component>
                <Chip.Primary label="medium" size="medium" icon="message" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Secondary label="medium" size="medium" />
              </Component>
              <Component>
                <Chip.Secondary label="medium" size="medium" icon="message" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Outline label="medium" size="medium" />
              </Component>
              <Component>
                <Chip.Outline label="medium" size="medium" icon="message" />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Small</div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Default label="small" size="small" />
              </Component>
              <Component>
                <Chip.Default label="small" size="small" icon="message" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Primary label="small" size="small" />
              </Component>
              <Component>
                <Chip.Primary label="small" size="small" icon="message" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Secondary label="small" size="small" />
              </Component>
              <Component>
                <Chip.Secondary label="small" size="small" icon="message" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.Outline label="small" size="small" />
              </Component>
              <Component>
                <Chip.Outline label="small" size="small" icon="message" />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="success-variants" className={styles.section}>
        <h2 className={styles.sectionTitle}>Success Variants</h2>
        <div className={styles.chipTable}>
          <div className={styles.chipTableHeader}>
            <div className={styles.chipTableCell}></div>
            <div className={styles.chipTableCell}>Success Primary</div>
            <div className={styles.chipTableCell}>Success Secondary</div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>TextButton</div>
            <div className={styles.chipTableCell}>
              <Component>
                <TextButton.SuccessPrimary text="Success Primary" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <TextButton.SuccessSecondary text="Success Secondary" size="medium" />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Chip</div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.SuccessPrimary label="Success Primary" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.SuccessSecondary label="Success Secondary" size="medium" />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>IconCircle</div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.SuccessPrimary name="send" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.SuccessSecondary name="send" size="medium" />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="warning-variants" className={styles.section}>
        <h2 className={styles.sectionTitle}>Warning Variants</h2>
        <div className={styles.chipTable}>
          <div className={styles.chipTableHeader}>
            <div className={styles.chipTableCell}></div>
            <div className={styles.chipTableCell}>Warning Primary</div>
            <div className={styles.chipTableCell}>Warning Secondary</div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>TextButton</div>
            <div className={styles.chipTableCell}>
              <Component>
                <TextButton.WarningPrimary text="Warning Primary" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <TextButton.WarningSecondary text="Warning Secondary" size="medium" />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Chip</div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.WarningPrimary label="Warning Primary" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.WarningSecondary label="Warning Secondary" size="medium" />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>IconCircle</div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.WarningPrimary name="send" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.WarningSecondary name="send" size="medium" />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="error-variants" className={styles.section}>
        <h2 className={styles.sectionTitle}>Error Variants</h2>
        <div className={styles.chipTable}>
          <div className={styles.chipTableHeader}>
            <div className={styles.chipTableCell}></div>
            <div className={styles.chipTableCell}>Error Primary</div>
            <div className={styles.chipTableCell}>Error Secondary</div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>TextButton</div>
            <div className={styles.chipTableCell}>
              <Component>
                <TextButton.ErrorPrimary text="Error Primary" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <TextButton.ErrorSecondary text="Error Secondary" size="medium" />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>Chip</div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.ErrorPrimary label="Error Primary" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <Chip.ErrorSecondary label="Error Secondary" size="medium" />
              </Component>
            </div>
          </div>
          <div className={styles.chipTableRow}>
            <div className={styles.chipTableCell}>IconCircle</div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.ErrorPrimary name="send" size="medium" />
              </Component>
            </div>
            <div className={styles.chipTableCell}>
              <Component>
                <IconCircle.ErrorSecondary name="send" size="medium" />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="chip-button" className={styles.section}>
        <h2 className={styles.sectionTitle}>ChipButton</h2>
        <ComponentRelations componentId="chip-button" />
        <div className={styles.buttonTableContainer}>
          <div className={styles.chipTable}>
            <div className={styles.chipTableHeader}>
              <div className={styles.chipTableCell}></div>
              <div className={styles.chipTableCell}>Default</div>
              <div className={styles.chipTableCell}>Primary</div>
              <div className={styles.chipTableCell}>Secondary</div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Large</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Default label="LargeDefault" size="large" />
                </Component>
                <Component>
                  <ChipButton.Default label="LargeDefault" size="large" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Primary label="LargePrimary" size="large" />
                </Component>
                <Component>
                  <ChipButton.Primary label="LargePrimary" size="large" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Secondary label="LargeSecondary" size="large" />
                </Component>
                <Component>
                  <ChipButton.Secondary label="LargeSecondary" size="large" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Medium</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Default label="MediumDefault" size="medium" />
                </Component>
                <Component>
                  <ChipButton.Default label="MediumDefault" size="medium" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Primary label="MediumPrimary" size="medium" />
                </Component>
                <Component>
                  <ChipButton.Primary label="MediumPrimary" size="medium" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Secondary label="MediumSecondary" size="medium" />
                </Component>
                <Component>
                  <ChipButton.Secondary label="MediumSecondary" size="medium" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Small</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Default label="SmallDefault" size="small" />
                </Component>
                <Component>
                  <ChipButton.Default label="SmallDefault" size="small" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Primary label="SmallPrimary" size="small" />
                </Component>
                <Component>
                  <ChipButton.Primary label="SmallPrimary" size="small" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Secondary label="SmallSecondary" size="small" />
                </Component>
                <Component>
                  <ChipButton.Secondary label="SmallSecondary" size="small" disabled />
                </Component>
              </div>
            </div>
          </div>

          <div className={styles.chipTable}>
            <div className={styles.chipTableHeader}>
              <div className={styles.chipTableCell}></div>
              <div className={styles.chipTableCell}>Outline</div>
              <div className={styles.chipTableCell}>Ghost</div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Large</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Outline label="LargeOutline" size="large" />
                </Component>
                <Component>
                  <ChipButton.Outline label="LargeOutline" size="large" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Ghost label="LargeGhost" size="large" />
                </Component>
                <Component>
                  <ChipButton.Ghost label="LargeGhost" size="large" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Medium</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Outline label="MediumOutline" size="medium" />
                </Component>
                <Component>
                  <ChipButton.Outline label="MediumOutline" size="medium" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Ghost label="MediumGhost" size="medium" />
                </Component>
                <Component>
                  <ChipButton.Ghost label="MediumGhost" size="medium" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Small</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Outline label="SmallOutline" size="small" />
                </Component>
                <Component>
                  <ChipButton.Outline label="SmallOutline" size="small" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Ghost label="SmallGhost" size="small" />
                </Component>
                <Component>
                  <ChipButton.Ghost label="SmallGhost" size="small" disabled />
                </Component>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="chip-button-icon" className={styles.section}>
        <h2 className={styles.sectionTitle}>ChipButton w/ Icon</h2>
        <div className={styles.buttonTableContainer}>
          <div className={styles.chipTable}>
            <div className={styles.chipTableHeader}>
              <div className={styles.chipTableCell}></div>
              <div className={styles.chipTableCell}>Default</div>
              <div className={styles.chipTableCell}>Primary</div>
              <div className={styles.chipTableCell}>Secondary</div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Large</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Default label="LargeDefault" size="large" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Default label="LargeDefault" size="large" icon="message" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Primary label="LargePrimary" size="large" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Primary label="LargePrimary" size="large" icon="message" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Secondary label="LargeSecondary" size="large" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Secondary
                    label="LargeSecondary"
                    size="large"
                    icon="message"
                    disabled
                  />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Medium</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Default label="MediumDefault" size="medium" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Default label="MediumDefault" size="medium" icon="message" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Primary label="MediumPrimary" size="medium" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Primary label="MediumPrimary" size="medium" icon="message" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Secondary label="MediumSecondary" size="medium" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Secondary
                    label="MediumSecondary"
                    size="medium"
                    icon="message"
                    disabled
                  />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Small</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Default label="SmallDefault" size="small" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Default label="SmallDefault" size="small" icon="message" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Primary label="SmallPrimary" size="small" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Primary label="SmallPrimary" size="small" icon="message" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Secondary label="SmallSecondary" size="small" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Secondary
                    label="SmallSecondary"
                    size="small"
                    icon="message"
                    disabled
                  />
                </Component>
              </div>
            </div>
          </div>

          <div className={styles.chipTable}>
            <div className={styles.chipTableHeader}>
              <div className={styles.chipTableCell}></div>
              <div className={styles.chipTableCell}>Outline</div>
              <div className={styles.chipTableCell}>Ghost</div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Large</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Outline label="LargeOutline" size="large" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Outline label="LargeOutline" size="large" icon="message" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Ghost label="LargeGhost" size="large" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Ghost label="LargeGhost" size="large" icon="message" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Medium</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Outline label="MediumOutline" size="medium" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Outline label="MediumOutline" size="medium" icon="message" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Ghost label="MediumGhost" size="medium" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Ghost label="MediumGhost" size="medium" icon="message" disabled />
                </Component>
              </div>
            </div>
            <div className={styles.chipTableRow}>
              <div className={styles.chipTableCell}>Small</div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Outline label="SmallOutline" size="small" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Outline label="SmallOutline" size="small" icon="message" disabled />
                </Component>
              </div>
              <div className={styles.chipTableCell}>
                <Component>
                  <ChipButton.Ghost label="SmallGhost" size="small" icon="message" />
                </Component>
                <Component>
                  <ChipButton.Ghost label="SmallGhost" size="small" icon="message" disabled />
                </Component>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="toggle-chip" className={styles.section}>
        <h2 className={styles.sectionTitle}>ToggleChip</h2>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Sizes</h3>
          <div className={styles.iconRow}>
            <div className={styles.circleItem}>
              <Component>
                <ToggleChip label="large" size="large" />
              </Component>
              <span className={styles.iconLabel}>Large</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <ToggleChip label="medium" size="medium" />
              </Component>
              <span className={styles.iconLabel}>Medium</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <ToggleChip label="small" size="small" />
              </Component>
              <span className={styles.iconLabel}>Small</span>
            </div>
          </div>
        </div>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>States</h3>
          <div className={styles.iconRow}>
            <div className={styles.circleItem}>
              <Component>
                <ToggleChip label="unchecked" initialChecked={false} size="medium" />
              </Component>
              <span className={styles.iconLabel}>Unchecked</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <ToggleChip label="checked" initialChecked={true} size="medium" />
              </Component>
              <span className={styles.iconLabel}>Checked</span>
            </div>
          </div>
        </div>
      </section>

      <section id="status-chip" className={styles.section}>
        <h2 className={styles.sectionTitle}>StatusChip</h2>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Sizes</h3>
          <div className={styles.iconRow}>
            <div className={styles.circleItem}>
              <Component>
                <StatusChip status="success" label="small" size="small" />
              </Component>
              <span className={styles.iconLabel}>Small</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <StatusChip status="warning" label="medium" size="medium" />
              </Component>
              <span className={styles.iconLabel}>Medium</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <StatusChip status="error" label="large" size="large" />
              </Component>
              <span className={styles.iconLabel}>Large</span>
            </div>
          </div>
        </div>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Status</h3>
          <div className={styles.iconRow}>
            <div className={styles.circleItem}>
              <Component>
                <StatusChip status="success" label="Success" size="medium" />
              </Component>
              <span className={styles.iconLabel}>Success</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <StatusChip status="warning" label="Warning" size="medium" />
              </Component>
              <span className={styles.iconLabel}>Warning</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <StatusChip status="error" label="Error" size="medium" />
              </Component>
              <span className={styles.iconLabel}>Error</span>
            </div>
          </div>
        </div>
      </section>

      <section id="stepper" className={styles.section}>
        <h2 className={styles.sectionTitle}>Stepper</h2>
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Default</h3>
          <div className={styles.iconRow}>
            <div className={styles.circleItem}>
              <Component>
                <Stepper initialValue={0} />
              </Component>
              <span className={styles.iconLabel}>Default</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <Stepper initialValue={0} minValue={0} />
              </Component>
              <span className={styles.iconLabel}>With Min</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <Stepper initialValue={5} minValue={0} maxValue={10} />
              </Component>
              <span className={styles.iconLabel}>With Min/Max</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <Stepper initialValue={0} minValue={0} suffix="개" />
              </Component>
              <span className={styles.iconLabel}>With Suffix</span>
            </div>
          </div>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Participant</h3>
            <div className={styles.iconRow}>
              <div className={styles.circleItem}>
                <Component>
                  <ParticipantStepper />
                </Component>
                <span className={styles.iconLabel}>Participant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tag-selector" className={styles.section}>
        <h2 className={styles.sectionTitle}>TagSelector</h2>
        <div className={styles.chatRow}>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Default</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <TagSelector
                  defaultTags={['수다', '게임', '소통']}
                  selectedTags={['수다', '게임']}
                />
              </Component>
            </div>
          </div>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Empty</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <TagSelector />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="text-tooltip" className={styles.section}>
        <h2 className={styles.sectionTitle}>TextTooltip</h2>
        <div className={styles.chatRow}>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Basic</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <div className={styles.tooltipExample}>
                  <span data-anchor="tooltip-short" className={styles.tooltipAnchor}>
                    Hover me to see tooltip
                  </span>
                  <TextTooltip text="툴팁 메시지" anchorId="tooltip-short" />
                </div>
              </Component>
            </div>
          </div>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Long Text</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <div className={styles.tooltipExample}>
                  <span data-anchor="tooltip-long" className={styles.tooltipAnchor}>
                    Hover for long tooltip
                  </span>
                  <TextTooltip
                    text="매우매우매우매우매우매우매우매우매우매우매우매우매우 기이이이이이인 툴팁 메시지"
                    anchorId="tooltip-long"
                  />
                </div>
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="radio-button" className={styles.section}>
        <h2 className={styles.sectionTitle}>RadioButton</h2>
        <ComponentRelations componentId="radio-button" />
        <div className={styles.dropdownShowcaseRow}>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Default</h3>
            <Component>
              <RadioButton name="filter" values={['item 1', 'item 2', 'item 3']} />
            </Component>
          </div>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Game Filter</h3>
            <Component>
              <RadioButton name="game-filter" values={['전체', '경쟁', '협동']} />
            </Component>
          </div>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Disabled</h3>
            <Component>
              <RadioButton name="game-filter-disabled" values={['그룹', '전체']} disabled />
            </Component>
          </div>
        </div>
      </section>

      <section id="page-indicator" className={styles.section}>
        <h2 className={styles.sectionTitle}>PageIndicator</h2>
        <ComponentRelations componentId="page-indicator" />
        <div className={styles.showcaseBlock}>
          <Component>
            <PageIndicator
              page={pageIndicatorPage}
              maxPage={pageIndicatorMax}
              onPageSelect={handlePageIndicatorSelect}
            />
          </Component>
        </div>
      </section>

      <section id="dropdown" className={styles.section}>
        <h2 className={styles.sectionTitle}>Dropdown</h2>
        <ComponentRelations componentId="dropdown" />
        <div className={styles.dropdownShowcaseRow}>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Default</h3>
            <Component fullWidth>
              <Dropdown
                items={[
                  { label: 'Item 1', value: 'item1' },
                  { label: 'Item 2', value: 'item2' },
                  { label: 'Item 3', value: 'item3' },
                ]}
                placeholder="Dropdown"
              />
            </Component>
          </div>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>With Selected Value</h3>
            <Component fullWidth>
              <Dropdown
                items={[
                  { label: 'Item 1', value: 'item1' },
                  { label: 'Item 2', value: 'item2' },
                  { label: 'Item 3', value: 'item3' },
                ]}
                value={selectedDropdownValue}
                onChange={setSelectedDropdownValue}
                placeholder="Dropdown"
              />
            </Component>
          </div>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Disabled</h3>
            <Component fullWidth>
              <Dropdown
                items={[
                  { label: 'Item 1', value: 'item1' },
                  { label: 'Item 2', value: 'item2' },
                  { label: 'Item 3', value: 'item3' },
                ]}
                value="item1"
                placeholder="Dropdown"
                disabled
              />
            </Component>
          </div>
        </div>
      </section>

      <section id="auth-button" className={styles.section}>
        <h2 className={styles.sectionTitle}>AuthButton</h2>
        <ComponentRelations componentId="auth-button" />
        <div className={styles.showcaseBlock}>
          <div className={styles.buttonRow}>
            <div className={styles.buttonRowItem}>
              <Component fullWidth>
                <GoogleAuthButton />
              </Component>
            </div>
            <div className={styles.buttonRowItem}>
              <Component fullWidth>
                <GithubAuthButton />
              </Component>
            </div>
            <div className={styles.buttonRowItem}>
              <Component fullWidth>
                <MbwtAuthButton />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="login-modal-button" className={styles.section}>
        <h2 className={styles.sectionTitle}>LoginButtonWithModal</h2>
        <ComponentRelations componentId="login-modal-button" />
        <div className={styles.showcaseBlock}>
          <Component>
            <LoginButtonWithModal />
          </Component>
        </div>
      </section>

      <section id="avatar" className={styles.section}>
        <h2 className={styles.sectionTitle}>Avatar</h2>
        <ComponentRelations componentId="avatar" />
        <div className={styles.showcaseBlock}>
          <div className={styles.iconRow}>
            <div className={styles.circleItem}>
              <Component>
                <Avatar nickname="강하늘" />
              </Component>
              <span className={styles.iconLabel}>Default</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <Avatar nickname="강하늘" />
              </Component>
              <span className={styles.iconLabel}>Default</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <Avatar nickname="강하늘" isActive />
              </Component>
              <span className={styles.iconLabel}>Active</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <AvatarCount count={2} />
              </Component>
              <span className={styles.iconLabel}>Count</span>
            </div>
          </div>
        </div>
      </section>

      <section id="avatars" className={styles.section}>
        <h2 className={styles.sectionTitle}>Avatars</h2>
        <ComponentRelations componentId="avatars" />
        <div className={styles.showcaseBlock}>
          <div className={styles.circleItem}>
            <Component>
              <Avatars profiles={profilesMock.map(({ nickname }) => ({ nickname }))} />
            </Component>
            <span className={styles.iconLabel}>Avatars</span>
          </div>
        </div>
      </section>

      <section id="shared-table" className={styles.section}>
        <h2 className={styles.sectionTitle}>Shared Table</h2>
        <ComponentRelations componentId="shared-table" />
        <div className={styles.showcaseBlock}>
          <Component fullWidth>
            <Table
              columns={sharedTableColumns}
              data={sharedTableData}
              getRowKey={sharedGetRowKey}
              highlightRow={sharedHighlightRow}
            />
          </Component>
        </div>
      </section>

      <section id="profile" className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>
        <ComponentRelations componentId="profile" />
        <div className={styles.showcaseBlock}>
          <div className={styles.iconRow}>
            <div className={styles.circleItem}>
              <Component>
                <ProfileRow nickname="강하늘" />
              </Component>
              <span className={styles.iconLabel}>Row (default)</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <ProfileRow nickname="강하늘" profileImage={Paths.images('default_profile')} />
              </Component>
              <span className={styles.iconLabel}>Row + Avatar</span>
            </div>
            <div className={styles.circleItem}>
              <Component>
                <ProfileColumn nickname="강하늘" profileImage={Paths.images('default_profile')} />
              </Component>
              <span className={styles.iconLabel}>Column + Avatar</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
