import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fail fast instead of hanging forever when the pool is exhausted —
  // a stuck pool previously made every request hang until a restart.
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Idle-client errors would otherwise crash the Node process; log them instead.
pool.on("error", (err) => {
  console.error("Unexpected pg pool error:", err);
});
export const db = drizzle(pool, { schema });
