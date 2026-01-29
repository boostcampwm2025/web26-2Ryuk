import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueIndexToGameRecord1769466000000 implements MigrationInterface {
  name = 'AddUniqueIndexToGameRecord1769466000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // game_record 테이블에 user_id와 game_id의 복합 유니크 인덱스 추가
    // 같은 사용자가 같은 게임에 대해 중복 기록을 가질 수 없도록 보장
    await queryRunner.query(
      `ALTER TABLE \`game_record\` ADD UNIQUE INDEX \`idx_user_game\` (\`user_id\`, \`game_id\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백 시 인덱스 제거
    await queryRunner.query(`ALTER TABLE \`game_record\` DROP INDEX \`idx_user_game\``);
  }
}
