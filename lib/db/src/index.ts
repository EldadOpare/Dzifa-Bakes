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

// SSL was turned on for any non-local host, since Supabase and most hosted
// Postgres providers required it and did not present a certificate the
// default Node trust store recognized.
const isLocal = /^(localhost|127\.0\.0\.1)$/.test(new URL(connectionString).hostname);

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  // The pool was kept small outside local dev, since each Vercel function
  // invocation started a fresh process. Supabase's connection pooler
  // (port 6543, see .env.example) was meant to handle the rest.
  max: isLocal ? undefined : 1,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
