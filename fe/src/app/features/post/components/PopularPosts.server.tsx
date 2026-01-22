'use client';

import PopularPosts from './PopularPosts';
import postListCardMock from '@/mocks/data/postListCard.json';
import { PopularPostsSectionServerProps } from './type';

export default function PopularPostsSection({ viewCount = 2 }: PopularPostsSectionServerProps) {
  const posts = postListCardMock.posts.map((post) => ({
    id: post.id,
    title: post.title,
    tags: post.tags ?? [],
    createDate: new Date(post.createDate),
    updateDate: post.updateDate ? new Date(post.updateDate) : undefined,
    viewCount: post.viewCount,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
  }));
  return <PopularPosts posts={posts} viewCount={viewCount} />;
}
