import { Pool } from "pg";
import { getDatabaseUrl } from "./env";

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

export function getPool() {
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString: getDatabaseUrl()
    });
  }

  return globalForPg.pgPool;
}
