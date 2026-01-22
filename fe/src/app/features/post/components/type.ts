import { PostListItemData, PostListRowData } from '../dtos/type';

export interface PostListItemProps extends PostListItemData {}

export interface PostListRowProps extends PostListRowData {}

export interface PopularPostsSectionProps {
  posts: PostListItemData[];
  viewCount?: number;
}

export interface PopularPostsSectionServerProps {
  viewCount?: number;
}
