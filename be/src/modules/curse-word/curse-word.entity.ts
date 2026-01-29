import { Entity, Column } from 'typeorm';
import { PrimaryUuidColumn } from '@src/common/decorators/primary-uuid-column.decorator';
import { v4 as uuidv4 } from 'uuid';

@Entity('curse_word')
export class CurseWord {
  @PrimaryUuidColumn()
  id: string = uuidv4();

  @Column({ type: 'varchar', length: 15 })
  word: string;
}
