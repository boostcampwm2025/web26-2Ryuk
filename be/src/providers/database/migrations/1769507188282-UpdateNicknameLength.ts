import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateNicknameLength1769507188282 implements MigrationInterface {
  name = 'UpdateNicknameLength1769507188282';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`nickname\``);
    await queryRunner.query(`ALTER TABLE \`user\` ADD \`nickname\` varchar(50) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`nickname\``);
    await queryRunner.query(`ALTER TABLE \`user\` ADD \`nickname\` varchar(8) NOT NULL`);
  }
}
