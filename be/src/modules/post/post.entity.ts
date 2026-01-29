import { Entity, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PrimaryUuidColumn, UuidColumn } from '@src/common/decorators/primary-uuid-column.decorator';
import { User } from '@src/modules/user/user.entity';
import { v4 as uuidv4 } from 'uuid';

export enum PostType {
  NORMAL = 'NORMAL',
  NOTICE = 'NOTICE',
}

@Entity('post')
export class Post {
  @PrimaryUuidColumn()
  id: string = uuidv4();

  @UuidColumn({
    name: 'author_id',
    type: 'binary',
    length: 16,
  })
  author_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'enum', enum: PostType, default: PostType.NORMAL })
  type: PostType;

  @Column({ length: 30 })
  title: string;

  @Column({ default: false })
  is_pinned: boolean;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 0 })
  view_count: number;

  @CreateDateColumn()
  create_date: Date;

  @UpdateDateColumn()
  update_date: Date;

  @DeleteDateColumn()
  delete_date: Date;
}
