import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCurseWords1769608123640 implements MigrationInterface {
  private readonly INSERT_CURSE_WORDS = ['ㅅㅂ', 'ㅗ'];

  private readonly DELETE_CURSE_WORDS = ['꺼져', 'hell', 'ass', 'omg'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 비속어 데이터 삽입
    const values = this.INSERT_CURSE_WORDS.map((word) => `(UNHEX(REPLACE(UUID(), '-', '')), '${word}')`).join(
      ',\n        ',
    );

    await queryRunner.query(`
      INSERT INTO \`curse_word\` (\`id\`, \`word\`)
      VALUES
        ${values}
    `);
    // 비속어 데이터 삭제
    const words = this.DELETE_CURSE_WORDS.map((word) => `'${word}'`).join(', ');

    await queryRunner.query(`
      DELETE FROM \`curse_word\`
      WHERE \`word\` IN (${words})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 비속어 데이터 삭제
    const words = this.INSERT_CURSE_WORDS.map((word) => `'${word}'`).join(', ');

    await queryRunner.query(`
      DELETE FROM \`curse_word\`
      WHERE \`word\` IN (${words})
    `);

    // 비속어 데이터 삽입
    const values = this.DELETE_CURSE_WORDS.map((word) => `(UNHEX(REPLACE(UUID(), '-', '')), '${word}')`).join(
      ',\n        ',
    );

    await queryRunner.query(`
      INSERT INTO \`curse_word\` (\`id\`, \`word\`)
      VALUES
        ${values}
    `);
  }
}
