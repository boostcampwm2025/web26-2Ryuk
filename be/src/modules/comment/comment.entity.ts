import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PrimaryUuidColumn, UuidColumn } from '@src/common/decorators/primary-uuid-column.decorator';
import { Post } from '@src/modules/post/post.entity';
import { User } from '@src/modules/user/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('comment')
export class Comment {
  @PrimaryUuidColumn()
  id: string = uuidv4();

  @UuidColumn()
  post_id: string;

  @UuidColumn()
  commenter_id: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commenter_id' })
  commenter: User;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  create_date: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  update_date: Date;
}
