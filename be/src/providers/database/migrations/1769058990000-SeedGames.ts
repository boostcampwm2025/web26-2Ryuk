import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedGames1769058990000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 게임 데이터 삽입
    await queryRunner.query(`
      INSERT INTO \`game\` (\`id\`, \`title\`, \`type\`, \`description\`, \`min_players\`, \`max_players\`, \`time\`)
      VALUES
        (UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440001'), '비커 채우기', 'competition', '제한 시간 동안 스페이스바를 빠르게 연타하여 비커를 채우세요!', 1, 10, 30),
        (UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440002'), '반응 속도 테스트', 'competition', '화면에 나타나는 신호에 최대한 빨리 반응하세요!', 1, 10, 30)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 게임 데이터 삭제
    await queryRunner.query(`
      DELETE FROM \`game\`
      WHERE \`id\` IN (
        UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440001'),
        UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440002')
      )
    `);
  }
}
