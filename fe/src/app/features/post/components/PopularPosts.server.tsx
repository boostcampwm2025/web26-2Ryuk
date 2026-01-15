'use client';

import PopularPosts from './PopularPosts';
import { PostConverter } from '../dtos/Post';
import postListCardMock from '@/mocks/data/postListCard.json';
import { PopularPostsSectionServerProps } from './type';

export default function PopularPostsSection({ viewCount = 2 }: PopularPostsSectionServerProps) {
  const posts = postListCardMock.posts.map((post) => PostConverter.toData(post));
  return <PopularPosts posts={posts} viewCount={viewCount} />;
}
