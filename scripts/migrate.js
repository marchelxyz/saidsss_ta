const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const shouldRun = process.env.RUN_MIGRATIONS === "true";
if (!shouldRun) {
  console.log("[migrate] RUN_MIGRATIONS is not true, skip.");
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!databaseUrl) {
  console.error("[migrate] DATABASE_URL is not set.");
  process.exit(1);
}

const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf8");

async function run() {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(schemaSql);
    console.log("[migrate] schema applied");
  } catch (error) {
    console.error("[migrate] failed", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
