import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Supabase needs SSL for anything that isn't localhost.
const isLocal = /^(localhost|127\.0\.0\.1)$/.test(new URL(connectionString).hostname);

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  // Small pool outside local dev, since each Vercel call is a fresh process.
  // Supabase's pooler (port 6543, see .env.example) handles the rest.
  max: isLocal ? undefined : 1,
});

// Supabase's pooler drops idle connections on its own schedule. Without this,
// that shows up as an unhandled error and crashes the whole process.
pool.on("error", (err) => {
  console.error("Postgres pool error (idle connection dropped, safe to ignore):", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
