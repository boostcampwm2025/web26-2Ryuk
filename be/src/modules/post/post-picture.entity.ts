import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PrimaryUuidColumn, UuidColumn } from '@src/common/decorators/primary-uuid-column.decorator';
import { Post } from '@src/modules/post/post.entity';

@Entity('post_picture')
export class PostPicture {
  @PrimaryUuidColumn()
  id: string;

  @UuidColumn()
  post_id: string;

  @ManyToOne(() => Post, (post) => post.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'varchar', length: 2048 })
  url: string;

  /**
   * 파일 용량 (Bytes)
   * MySQL BIGINT는 JS의 Number 범위를 넘을 수 있어
   * 안전하게 string으로 읽어온 뒤 숫자로 변환합니다.
   */
  @Column({
    type: 'bigint',
    transformer: {
      to: (value: number) => value, // DB에 저장할 땐 숫자 그대로
      from: (value: string) => Number.parseInt(value, 10), // DB에서 읽어올 땐 string을 숫자로 변환
    },
  })
  size: number;

  @Column({ type: 'varchar', length: 255 })
  filename: string;
}
