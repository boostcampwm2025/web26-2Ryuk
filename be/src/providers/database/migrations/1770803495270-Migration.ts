import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1770803495270 implements MigrationInterface {
  name = 'Migration1770803495270';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX \`idx_game_score\` ON \`game_record\` (\`game_id\`, \`score\`)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`idx_game_score\` ON \`game_record\``);
  }
}
