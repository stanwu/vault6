import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { applyKeyAndMigrate, closeDb, getOne, keyToHex, openSqlcipher, runSql } from "../src/sqlcipher.js";
import { migrateV1 } from "../src/migrations.js";

function randomKey(): Uint8Array {
  return randomBytes(32);
}

let tempRoot = "";

afterEach(() => {
  if (tempRoot) {
    rmSync(tempRoot, { recursive: true, force: true });
    tempRoot = "";
  }
});

describe("sqlcipher encryption", () => {
  it("fails with wrong key and succeeds with right key", async () => {
    tempRoot = mkdtempSync(join(tmpdir(), "vault6-db-test-"));
    const dbPath = join(tempRoot, "vault.db");

    const rightKey = randomKey();
    const wrongKey = randomKey();

    const db = openSqlcipher(dbPath);
    await applyKeyAndMigrate(db, keyToHex(rightKey));
    await migrateV1(db);
    await runSql(db, "INSERT INTO metadata(key, value) VALUES('known', 'secret-value');");
    await closeDb(db);

    const wrongDb = openSqlcipher(dbPath);
    await applyKeyAndMigrate(wrongDb, keyToHex(wrongKey));
    await expect(getOne<{ value: string }>(wrongDb, "SELECT value FROM metadata WHERE key='known';")).rejects.toBeTruthy();
    await closeDb(wrongDb);

    const okDb = openSqlcipher(dbPath);
    await applyKeyAndMigrate(okDb, keyToHex(rightKey));
    const row = await getOne<{ value: string }>(okDb, "SELECT value FROM metadata WHERE key='known';");
    expect(row.value).toBe("secret-value");
    await closeDb(okDb);
  });
});
