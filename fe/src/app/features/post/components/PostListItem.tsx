'use client';

import styles from './postListItem.module.css';
import { OutlineChip } from '@/app/components/shared/chip/Chip';
import Icon from '@/app/components/shared/icon/Icon';
import DateUtil from '@/utils/date';
import NumberUtil from '@/utils/number';
import { PostListItemProps } from './type';

function PostListItem({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  id,
  title,
  tags = [],
  viewCount = 0,
  likeCount = 0,
  commentCount = 0,
  createDate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateDate,
}: PostListItemProps) {
  return (
    <li className={styles.postListItem}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((tag) => (
              <OutlineChip key={tag} label={tag} size="small" />
            ))}
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <Icon name="show" size="small" />
            <span>{NumberUtil.formatCompact(viewCount)}</span>
          </div>
          <div className={styles.metric}>
            <Icon name="like" size="small" />
            <span>{NumberUtil.formatCompact(likeCount)}</span>
          </div>
          <div className={styles.metric}>
            <Icon name="message" size="small" />
            <span>{NumberUtil.formatCompact(commentCount)}</span>
          </div>
        </div>
        <div className={styles.timestamp}>{DateUtil.fromNow(createDate)}</div>
      </div>
    </li>
  );
}

export default PostListItem;
