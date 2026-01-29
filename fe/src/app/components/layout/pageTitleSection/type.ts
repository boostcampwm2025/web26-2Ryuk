import { ReactNode } from 'react';

export interface PageTitleSectionProps {
  label: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export interface BoardPageTitleSectionProps {
  onSearch?: (query: string) => void;
  onCreate?: () => void;
}

export interface GameListPageTitleSectionProps {
  onSearch?: (query: string) => void;
  children?: ReactNode;
}

export interface GamePageTitleSectionProps {
  gameId?: string;
  children?: ReactNode;
}

export type RankingViewType = 'group' | 'all';

export interface RankingPageTitleSectionProps {
  view?: RankingViewType;
  onChange?: (view: RankingViewType) => void;
  children?: ReactNode;
}
