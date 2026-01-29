'use client';

import styles from './pageTitleSection.module.css';
import CSSUtil from '@/utils/css';
import useResponsive from '@/app/hooks/useResponsive';
import {
  BoardPageTitleSectionProps,
  GamePageTitleSectionProps,
  GameListPageTitleSectionProps,
  PageTitleSectionProps,
  RankingPageTitleSectionProps,
} from './type';
import { PrimaryTextButton } from '@/app/components/shared/button/TextButton';
import SearchForm from '@/app/components/shared/form/search/SearchForm';
import RadioButton from '@/app/components/shared/radioButton/RadioButton';
import { GAME_IDS } from '@/app/shared/constant';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function PageTitleSection({ label, title, description, children }: PageTitleSectionProps) {
  const { status } = useResponsive();

  const containerClassName = CSSUtil.buildCls(styles.container, styles[status]);

  return (
    <div className={containerClassName}>
      <div className={styles.content}>
        {label && <span className={styles.label}>{label}</span>}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}

export function BoardPageTitleSection({ onSearch, onCreate }: BoardPageTitleSectionProps) {
  return (
    <PageTitleSection label="BOARD" title="게시판" description="다른 사람들과 소통해보세요.">
      <SearchForm placeholder="제목, 내용, 작성자 검색" onSubmit={onSearch} />
      <PrimaryTextButton text="글 쓰기" size="medium" iconName="add" onClick={onCreate} />
    </PageTitleSection>
  );
}

export function GameListPageTitleSection({ onSearch }: GameListPageTitleSectionProps) {
  return (
    <PageTitleSection
      label="MINIGAMES"
      title="미니게임"
      description="또록이와 즐거운 미니게임들을 즐겨보세요!"
    >
      <SearchForm placeholder="게임 검색" onSubmit={onSearch} />
      <RadioButton name="game-filter" values={['전체', '경쟁', '협동']} />
    </PageTitleSection>
  );
}

export function GamePageTitleSection({ gameId }: GamePageTitleSectionProps) {
  switch (gameId) {
    case GAME_IDS.BEAKER:
      return (
        <PageTitleSection
          label="MINIGAMES"
          title="비커 채우기"
          description="제한시간 동안 스페이스바를 빠르게 눌러 비커를 채워보세요."
        />
      );
  }
  return null;
}
type RankingView = 'group' | 'all';

const rankingViews: { value: RankingView; label: string }[] = [
  { value: 'group', label: '그룹' },
  { value: 'all', label: '전체' },
];

export function RankingPageTitleSection({
  onChange,
  view = 'group',
}: RankingPageTitleSectionProps) {
  const [selectedView, setSelectedView] = useState<RankingView>(view);

  useEffect(() => {
    setSelectedView(view);
  }, [view]);

  const handleSelectView = useCallback(
    (index: number) => {
      const next = rankingViews[index];
      if (!next || selectedView === next.value) return;
      setSelectedView(next.value);
      onChange?.(next.value);
    },
    [onChange, selectedView],
  );

  const selectedIndex = useMemo(
    () => rankingViews.findIndex((item) => item.value === selectedView),
    [selectedView],
  );

  return (
    <PageTitleSection
      label="RANKINGS"
      title="게임 랭킹"
      description="지금, 더 나은 기록에 도전해보세요!"
    >
      <RadioButton
        key={selectedView}
        name="ranking-view"
        values={rankingViews.map((item) => item.label)}
        initialSelected={Math.max(selectedIndex, 0)}
        onChange={handleSelectView}
      />
    </PageTitleSection>
  );
}
