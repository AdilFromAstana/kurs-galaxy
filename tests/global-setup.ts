import fs from 'fs';
import path from 'path';

/**
 * Загружает .env (если ещё не загружен) и переписывает DATABASE_URL,
 * заменяя докерный хост `db:5432` на `localhost:${POSTGRES_PORT}`,
 * чтобы тестовый раннер мог подключиться к Postgres извне контейнера.
 */
export default function globalSetup(): void {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=(.*?)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      // strip surrounding quotes
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }

  if (process.env.DATABASE_URL?.includes('@db:')) {
    const port = process.env.POSTGRES_PORT || '54390';
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
      /@db:\d+/,
      `@localhost:${port}`,
    );
  }
}
