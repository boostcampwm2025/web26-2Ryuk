import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleIdToUser1769608123639 implements MigrationInterface {
  name = 'AddGoogleIdToUser1769608123639';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` ADD \`google_id\` varchar(255) NULL`);
    await queryRunner.query(`ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_7adac5c0b28492eb292d4a9387\` (\`google_id\`)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP INDEX \`IDX_7adac5c0b28492eb292d4a9387\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`google_id\``);
  }
}
