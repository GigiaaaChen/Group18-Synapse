import { Pool } from "pg";

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error("DATABASE_URL environment variable not set");
}

const connectionString = rawConnectionString.replace(
  "?sslmode=verify-full",
  "",
);

export const db = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export type DbPool = typeof db;
