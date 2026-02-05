import { config } from 'dotenv';
import { resolve } from 'node:path';

export function loadEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const filename = `.env.${nodeEnv}`;

  config({ path: resolve(process.cwd(), filename) });
}
