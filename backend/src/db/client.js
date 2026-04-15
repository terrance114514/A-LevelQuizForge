import pg from "pg";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";

const { Pool } = pg;

let pool = null;

function createPool() {
  return new Pool({
    connectionString: env.databaseUrl,
    ssl: env.dbSsl ? { rejectUnauthorized: false } : undefined,
  });
}

export function isDbEnabled() {
  return env.dbEnabled;
}

export function getPool() {
  if (!isDbEnabled()) {
    return null;
  }

  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export function assertDbEnabled() {
  if (!isDbEnabled()) {
    throw new ApiError(
      503,
      "PostgreSQL is not configured. Set DATABASE_URL to enable DB-backed APIs.",
      "DB_DISABLED"
    );
  }
}

export async function query(sql, params = []) {
  assertDbEnabled();
  const pgPool = getPool();
  return pgPool.query(sql, params);
}

export async function checkDbConnection() {
  if (!isDbEnabled()) {
    return { enabled: false, ok: false, reason: "DATABASE_URL is not set" };
  }

  try {
    const result = await query("select now() as now");
    return { enabled: true, ok: true, now: result.rows[0].now };
  } catch (error) {
    return { enabled: true, ok: false, reason: error.message };
  }
}
