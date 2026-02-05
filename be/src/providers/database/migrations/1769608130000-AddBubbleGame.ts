import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBubbleGame1769608130000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 게임 데이터 삽입
    await queryRunner.query(`
      INSERT INTO \`game\` (\`id\`, \`title\`, \`type\`, \`description\`, \`min_players\`, \`max_players\`, \`time\`)
      VALUES
        (UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440003'), '물방울 캐치', 'competition', '터지기 직전의 물방울을 정확한 순간에 포착하세요!', 1, 10, 30)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 게임 데이터 삭제
    await queryRunner.query(`
      DELETE FROM \`game\`
      WHERE \`id\` IN (
        UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440003')
      )
    `);
  }
}
