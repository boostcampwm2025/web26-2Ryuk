import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1769058989696 implements MigrationInterface {
  name = 'Migration1769058989696';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` binary(16) NOT NULL, \`email\` varchar(255) NOT NULL, \`nickname\` varchar(8) NOT NULL, \`profile_image\` varchar(255) NULL, \`role\` enum ('USER', 'ADMIN') NOT NULL DEFAULT 'USER', \`is_blacklisted\` tinyint NOT NULL DEFAULT 0, \`warning_count\` int NOT NULL DEFAULT '0', \`create_date\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`update_date\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`chatting_report\` (\`id\` binary(16) NOT NULL, \`type\` enum ('TEXT', 'VOICE') NOT NULL, \`room_id\` binary(16) NULL, \`reporter_id\` binary(16) NOT NULL, \`target_id\` binary(16) NOT NULL, \`reason\` text NOT NULL, \`content\` text NULL COMMENT '신고 내용 또는 AI 가공 답변', \`status\` enum ('PENDING', 'PROCESSED') NOT NULL DEFAULT 'PENDING', \`is_accepted\` tinyint NOT NULL DEFAULT 0, \`create_date\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`post\` (\`id\` binary(16) NOT NULL, \`author_id\` binary(16) NOT NULL, \`type\` enum ('NORMAL', 'NOTICE') NOT NULL DEFAULT 'NORMAL', \`title\` varchar(30) NOT NULL, \`is_pinned\` tinyint NOT NULL DEFAULT 0, \`content\` text NOT NULL, \`view_count\` int NOT NULL DEFAULT '0', \`create_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`delete_date\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`post_picture\` (\`id\` binary(16) NOT NULL, \`post_id\` binary(16) NOT NULL, \`url\` varchar(2048) NOT NULL, \`size\` bigint NOT NULL, \`filename\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`post_like\` (\`post_id\` binary(16) NOT NULL, \`user_id\` binary(16) NOT NULL, PRIMARY KEY (\`post_id\`, \`user_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`chatting_log\` (\`id\` binary(16) NOT NULL, \`room_id\` binary(16) NULL, \`sender_id\` binary(16) NOT NULL, \`content\` text NOT NULL, \`create_date\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`room_type\` enum ('GLOBAL', 'LOCAL') NOT NULL, INDEX \`IDX_457b253f95425da0bf5339fbf9\` (\`room_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`game\` (\`id\` binary(16) NOT NULL, \`title\` varchar(20) NOT NULL, \`time\` int NOT NULL, \`type\` enum ('competition', 'cooperation') NOT NULL, \`max_players\` int NULL, \`min_players\` int NULL, \`description\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`game_record\` (\`id\` binary(16) NOT NULL, \`user_id\` binary(16) NOT NULL, \`game_id\` binary(16) NOT NULL, \`score\` int NOT NULL, \`achieve_date\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`comment\` (\`id\` binary(16) NOT NULL, \`post_id\` binary(16) NOT NULL, \`commenter_id\` binary(16) NOT NULL, \`content\` text NOT NULL, \`create_date\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`update_date\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatting_report\` ADD CONSTRAINT \`FK_d4d87a8040c8d07c9f5e5c9b66e\` FOREIGN KEY (\`reporter_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatting_report\` ADD CONSTRAINT \`FK_5e913ed81347095711ee5eb382d\` FOREIGN KEY (\`target_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post\` ADD CONSTRAINT \`FK_2f1a9ca8908fc8168bc18437f62\` FOREIGN KEY (\`author_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_picture\` ADD CONSTRAINT \`FK_cd9eace3863ff6e37373f665c71\` FOREIGN KEY (\`post_id\`) REFERENCES \`post\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_like\` ADD CONSTRAINT \`FK_a7ec6ac3dc7a05a9648c418f1ad\` FOREIGN KEY (\`post_id\`) REFERENCES \`post\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`post_like\` ADD CONSTRAINT \`FK_c635b15915984c8cdb520a1fef3\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`game_record\` ADD CONSTRAINT \`FK_d730eaba4213c2718538bb003df\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`game_record\` ADD CONSTRAINT \`FK_033f917d9bcc2c69b14909bb0a2\` FOREIGN KEY (\`game_id\`) REFERENCES \`game\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`comment\` ADD CONSTRAINT \`FK_8aa21186314ce53c5b61a0e8c93\` FOREIGN KEY (\`post_id\`) REFERENCES \`post\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`comment\` ADD CONSTRAINT \`FK_2790b94a3bb7b6b9d38fd12d074\` FOREIGN KEY (\`commenter_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`comment\` DROP FOREIGN KEY \`FK_2790b94a3bb7b6b9d38fd12d074\``);
    await queryRunner.query(`ALTER TABLE \`comment\` DROP FOREIGN KEY \`FK_8aa21186314ce53c5b61a0e8c93\``);
    await queryRunner.query(`ALTER TABLE \`game_record\` DROP FOREIGN KEY \`FK_033f917d9bcc2c69b14909bb0a2\``);
    await queryRunner.query(`ALTER TABLE \`game_record\` DROP FOREIGN KEY \`FK_d730eaba4213c2718538bb003df\``);
    await queryRunner.query(`ALTER TABLE \`post_like\` DROP FOREIGN KEY \`FK_c635b15915984c8cdb520a1fef3\``);
    await queryRunner.query(`ALTER TABLE \`post_like\` DROP FOREIGN KEY \`FK_a7ec6ac3dc7a05a9648c418f1ad\``);
    await queryRunner.query(`ALTER TABLE \`post_picture\` DROP FOREIGN KEY \`FK_cd9eace3863ff6e37373f665c71\``);
    await queryRunner.query(`ALTER TABLE \`post\` DROP FOREIGN KEY \`FK_2f1a9ca8908fc8168bc18437f62\``);
    await queryRunner.query(`ALTER TABLE \`chatting_report\` DROP FOREIGN KEY \`FK_5e913ed81347095711ee5eb382d\``);
    await queryRunner.query(`ALTER TABLE \`chatting_report\` DROP FOREIGN KEY \`FK_d4d87a8040c8d07c9f5e5c9b66e\``);
    await queryRunner.query(`DROP TABLE \`comment\``);
    await queryRunner.query(`DROP TABLE \`game_record\``);
    await queryRunner.query(`DROP TABLE \`game\``);
    await queryRunner.query(`DROP INDEX \`IDX_457b253f95425da0bf5339fbf9\` ON \`chatting_log\``);
    await queryRunner.query(`DROP TABLE \`chatting_log\``);
    await queryRunner.query(`DROP TABLE \`post_like\``);
    await queryRunner.query(`DROP TABLE \`post_picture\``);
    await queryRunner.query(`DROP TABLE \`post\``);
    await queryRunner.query(`DROP TABLE \`chatting_report\``);
    await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
    await queryRunner.query(`DROP TABLE \`user\``);
  }
}
