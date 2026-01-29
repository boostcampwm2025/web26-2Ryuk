'use client';

import styles from './postListRow.module.css';
import { DefaultChip, PrimaryChip, SecondaryChip } from '@/app/components/shared/chip/Chip';
import DateUtil from '@/utils/date';
import { PostListRowProps } from './type';
import NumberUtil from '@/utils/number';
import { PostCategory } from '@/app/features/post/dtos/type';

function PostCategoryChip({ category }: { category: PostCategory }) {
  switch (category) {
    case 'notice':
      return <PrimaryChip label="공지" size="medium" />;
    case 'free':
      return <DefaultChip label="자유" size="medium" />;
  }
}

function PostListRow({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  id,
  title,
  content,
  category,
  authorNickname,
  viewCount = 0,
  likeCount = 0,
  commentCount = 0,
  createDate,
}: PostListRowProps) {
  const relativeTimeText = DateUtil.fromNow(createDate);
  const commentCountText = NumberUtil.formatCompact(commentCount);

  return (
    <li className={styles.postListRow}>
      <div className={styles.category}>
        <PostCategoryChip category={category} />
      </div>
      <div className={styles.content}>
        <div className={styles.main}>
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <SecondaryChip icon="message" label={commentCountText} size="medium" />
          </div>
          <p className={styles.description}>{content}</p>
        </div>
        <span className={styles.author}>{authorNickname}</span>
        <span className={styles.timestamp}>{relativeTimeText}</span>
        <span className={styles.metric}>{viewCount}</span>
        <span className={styles.metric}>{likeCount}</span>
      </div>
    </li>
  );
}

export default PostListRow;
