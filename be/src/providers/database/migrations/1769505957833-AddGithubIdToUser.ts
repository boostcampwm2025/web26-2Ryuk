import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGithubIdToUser1769505957833 implements MigrationInterface {
  name = 'AddGithubIdToUser1769505957833';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` ADD \`github_id\` varchar(255) NULL`);
    await queryRunner.query(`ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_45bb0502759f0dd73c4fd8b13b\` (\`github_id\`)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP INDEX \`IDX_45bb0502759f0dd73c4fd8b13b\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`github_id\``);
  }
}
