import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCurseWords1769458990001 implements MigrationInterface {
  private readonly CURSE_WORDS = [
    // 데모 발표용
    '바보',
    'babo',
    '멍청이',
    // 한국어 - 강한 비속어 및 변형
    '씨발',
    '시발',
    '씨벌',
    '쓰벌',
    '쌰갈',
    '시바',
    '씨빨',
    '씌발',
    '쒸발',
    '십팔',
    '씨부랄',
    '시부레',
    '존나',
    '좆나',
    '죤나',
    '조나',
    '개좆',
    '병신',
    '븅신',
    '뵹신',
    'ㅄ',
    'ㅂㅅ',
    '병쉰',
    '빙신',
    '비융신',
    '지랄',
    '지럴',
    '즤랄',
    'ㅈㄹ',
    '꺼져',
    '꺼저',
    '좆같다',
    '좆같네',
    '좆같이',
    '엿같다',
    '엿같네',
    '엿같이',
    '새끼',
    '새기',
    '새키',
    '색기',
    '섀끼',
    '씹새끼',
    '씹새',
    '씹세끼',
    '개새끼',
    '개새',
    '개새기',
    '개세끼',
    '개색기',
    '개쉐이',
    '개쉑',
    '닥쳐',
    '미친놈',
    '미친년',
    '좆밥',
    '좆빱',
    '조빱',
    '염병',
    '옘병',
    '씹할',
    '凸',

    // 영어 - 주요 비속어 (Slang)
    'fuck',
    'fucking',
    'fucker',
    'f*ck',
    'shit',
    'shitty',
    'shite',
    'damn',
    'goddamn',
    'hell',
    'bastard',
    'asshole',
    'ass',
    'arsehole',
    'bitch',
    'son of a bitch',
    'motherfucker',
    'stfu',
    'wtf',
    'omg',
    'retard',
    'bullshit',
    'crap',
    'piss off',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 비속어 데이터 삽입
    const values = this.CURSE_WORDS.map((word) => `(UNHEX(REPLACE(UUID(), '-', '')), '${word}')`).join(',\n        ');

    await queryRunner.query(`
      INSERT INTO \`curse_word\` (\`id\`, \`word\`)
      VALUES
        ${values}
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 비속어 데이터 삭제
    const words = this.CURSE_WORDS.map((word) => `'${word}'`).join(', ');

    await queryRunner.query(`
      DELETE FROM \`curse_word\`
      WHERE \`word\` IN (${words})
    `);
  }
}
