import type { Database } from "@journeyapps/sqlcipher";
import { runSql } from "./sqlcipher.js";

export async function migrateV1(db: Database): Promise<void> {
  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `
  );

  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS vault_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      ciphertext BLOB,
      nonce BLOB,
      aad TEXT,
      favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `
  );

  await runSql(
    db,
    `
    CREATE INDEX IF NOT EXISTS idx_vault_items_updated_at ON vault_items(updated_at DESC);
  `
  );
}
