import { Pool } from "pg";

const pool =
  globalThis.__pgPool ??
  new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
}

export default pool;

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}
