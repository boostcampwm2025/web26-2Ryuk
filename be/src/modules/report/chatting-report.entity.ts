import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PrimaryUuidColumn, UuidColumn } from '@src/common/decorators/primary-uuid-column.decorator';
import { User } from '@src/modules/user/user.entity';
import { v4 as uuidv4 } from 'uuid';

export enum ChatType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
}

@Entity('chatting_report')
export class ChattingReport {
  @PrimaryUuidColumn()
  id: string = uuidv4();

  @Column({ type: 'enum', enum: ChatType })
  type: ChatType;

  @UuidColumn({ nullable: true })
  room_id: string;

  @UuidColumn()
  reporter_id: string;

  @UuidColumn()
  target_id: string;

  // 관계 설정: 한 명의 유저는 여러 번 신고할 수 있음
  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  // 관계 설정: 한 명의 유저는 여러 번 신고당할 수 있음
  @ManyToOne(() => User)
  @JoinColumn({ name: 'target_id' })
  target: User;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '신고 내용 또는 AI 가공 답변',
  })
  content: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({ type: 'boolean', default: false })
  is_accepted: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  create_date: Date;
}
