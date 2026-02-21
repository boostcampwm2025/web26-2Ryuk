import { config } from 'dotenv';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

export function loadEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const filename = `.env.${nodeEnv}`;
  const filepath = resolve(process.cwd(), filename);

  if (existsSync(filepath)) {
    config({ path: filepath });
  }
}
