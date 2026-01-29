import { Entity, Column } from 'typeorm';
import { PrimaryUuidColumn } from '@src/common/decorators/primary-uuid-column.decorator';
import { v4 as uuidv4 } from 'uuid';

export enum GameType {
  COMPETITION = 'competition',
  COOPERATION = 'cooperation',
}

@Entity('game')
export class Game {
  @PrimaryUuidColumn()
  id: string = uuidv4();

  @Column({ type: 'varchar', length: 20 })
  title: string;

  @Column({ type: 'int' })
  time: number;

  @Column({
    type: 'enum',
    enum: GameType,
  })
  type: GameType;

  @Column({ type: 'int', nullable: true })
  max_players: number;

  @Column({ type: 'int', nullable: true })
  min_players: number;

  @Column({ type: 'text', nullable: true })
  description: string;
}
