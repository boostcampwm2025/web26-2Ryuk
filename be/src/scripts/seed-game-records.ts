import { DataSource } from 'typeorm';

import { GameRecord } from '@src/modules/game-record/game-record.entity';
import { Game } from '@src/modules/game/game.entity';
import { User } from '@src/modules/user/user.entity';
import databaseConfig from '@src/providers/database/database.config';
import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/*
1. 데이터베이스에서 게임과 사용자 데이터 조회
2. 각 사용자와 게임 조합으로 랜덤 게임 기록 생성
3. MySQL game_record 테이블에 데이터 삽입
4. 주의사항:
    - 기존 데이터가 있으면 자동으로 삭제 후 새로 삽입

로컬 환경에서 실행
- cd be
- pnpm seed:game-records

도커 컨테이너 내부에서 실행
- docker exec eryuk-server pnpm seed:game-records:docker
*/

/**
 * 랜덤 점수 생성 (0 ~ 10000)
 */
function getRandomScore(): number {
  return Math.floor(Math.random() * 10001);
}

/**
 * 랜덤 날짜 생성 (최근 30일 내)
 */
function getRandomDate(): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  date.setSeconds(Math.floor(Math.random() * 60));
  return date;
}

/**
 * 게임 기록 데이터 시드 스크립트
 */
async function seedGameRecords() {
  const dataSource = new DataSource(databaseConfig);

  try {
    await dataSource.initialize();
    Logger.log('데이터베이스 연결 성공');

    const gameRecordRepository = dataSource.getRepository(GameRecord);
    const gameRepository = dataSource.getRepository(Game);
    const userRepository = dataSource.getRepository(User);

    // 기존 게임 기록 확인
    const existingRecords = await gameRecordRepository.count();
    if (existingRecords > 0) {
      Logger.log(`⚠️  기존 게임 기록 ${existingRecords}개가 있습니다.`);
      Logger.log('기존 데이터를 모두 삭제하고 새로 삽입합니다...');
      // 기존 데이터 삭제
      await gameRecordRepository.createQueryBuilder().delete().from(GameRecord).execute();
      Logger.log('기존 데이터 삭제 완료');
    }

    // 게임과 사용자 데이터 조회
    const games = await gameRepository.find();
    const users = await userRepository.find();

    if (games.length === 0) {
      Logger.warn('⚠️  게임 데이터가 없습니다. 게임을 먼저 생성해주세요.');
      return;
    }

    if (users.length === 0) {
      Logger.warn('⚠️  사용자 데이터가 없습니다. 사용자를 먼저 생성해주세요.');
      return;
    }

    Logger.log(`게임 ${games.length}개, 사용자 ${users.length}명을 찾았습니다.`);

    // 각 사용자당 각 게임에 대해 1~3개의 랜덤 기록 생성
    const recordsToInsert: GameRecord[] = [];
    const recordsPerUserGame = 1;

    for (const user of users) {
      for (const game of games) {
        for (let i = 0; i < recordsPerUserGame; i++) {
          const gameRecord = new GameRecord();
          gameRecord.id = uuidv4();
          gameRecord.user_id = user.id;
          gameRecord.game_id = game.id;
          gameRecord.score = getRandomScore();
          gameRecord.achieve_date = getRandomDate();

          recordsToInsert.push(gameRecord);
        }
      }
    }

    Logger.log(`총 ${recordsToInsert.length}개의 게임 기록을 삽입합니다...`);

    // 배치 삽입 (성능 향상)
    // TypeORM의 save는 한 번에 너무 많은 데이터를 처리할 수 없으므로 청크 단위로 나눠서 삽입
    const chunkSize = 1000;
    for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
      const chunk = recordsToInsert.slice(i, i + chunkSize);
      await gameRecordRepository.save(chunk);
      Logger.log(`진행 중: ${Math.min(i + chunkSize, recordsToInsert.length)}/${recordsToInsert.length}개 삽입 완료`);
    }

    Logger.log(`✅ ${recordsToInsert.length}개의 게임 기록이 성공적으로 삽입되었습니다.`);
  } catch (error) {
    Logger.error('❌ 게임 기록 시드 중 오류 발생:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    Logger.log('데이터베이스 연결 종료');
  }
}

// 스크립트 실행
seedGameRecords()
  .then(() => {
    Logger.log('시드 완료');
    process.exit(0);
  })
  .catch((error) => {
    Logger.error('시드 실패:', error);
    process.exit(1);
  });
