import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { applyKeyAndMigrate, closeDb, getOne, keyToHex, openSqlcipher } from "../src/sqlcipher.js";
import { migrateV1 } from "../src/migrations.js";

let tempRoot = "";

afterEach(() => {
  if (tempRoot) {
    rmSync(tempRoot, { recursive: true, force: true });
    tempRoot = "";
  }
});

describe("migrateV1", () => {
  it("creates required tables and index", async () => {
    tempRoot = mkdtempSync(join(tmpdir(), "vault6-migration-test-"));
    const dbPath = join(tempRoot, "vault.db");
    const db = openSqlcipher(dbPath);

    await applyKeyAndMigrate(db, keyToHex(randomBytes(32)));
    await migrateV1(db);

    const metadataTable = await getOne<{ count: number }>(
      db,
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name='metadata';"
    );
    const itemsTable = await getOne<{ count: number }>(
      db,
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name='vault_items';"
    );
    const updatedIndex = await getOne<{ count: number }>(
      db,
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type='index' AND name='idx_vault_items_updated_at';"
    );

    expect(metadataTable.count).toBe(1);
    expect(itemsTable.count).toBe(1);
    expect(updatedIndex.count).toBe(1);

    await closeDb(db);
  });
});

