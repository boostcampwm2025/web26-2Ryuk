import { DataSourceOptions } from 'typeorm';
import { loadEnv } from '@src/config/env';
import * as path from 'path';

// 공통 ENV 로더 사용
loadEnv();

const isProduction = process.env.NODE_ENV === 'production';
const rootDir = process.cwd();

const databaseConfig: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: isProduction
    ? [path.join(rootDir, 'dist', '**', '*.entity.js')]
    : [path.join(rootDir, 'src', '**', '*.entity.ts')],
  migrations: isProduction
    ? [path.join(rootDir, 'dist', 'providers', 'database', 'migrations', '*.js')]
    : [path.join(rootDir, 'src', 'providers', 'database', 'migrations', '*.ts')],
  synchronize: false,
  logging: !isProduction,
};

export default databaseConfig;
