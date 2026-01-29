import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1769412463492 implements MigrationInterface {
  name = 'Migration1769412463492';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`curse_word\` (\`id\` binary(16) NOT NULL, \`word\` varchar(15) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`curse_word\``);
  }
}
