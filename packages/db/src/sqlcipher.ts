import type { Database } from "@journeyapps/sqlcipher";
import sqlite3 from "@journeyapps/sqlcipher";

export function openSqlcipher(dbPath: string): Database {
  return new sqlite3.Database(dbPath);
}

function run(db: Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, (err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export async function applyKeyAndMigrate(db: Database, keyHex: string): Promise<void> {
  await run(db, `PRAGMA key = "x'${keyHex}'";`);
  await run(db, "PRAGMA cipher_migrate;");
}

export function closeDb(db: Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export function keyToHex(key: Uint8Array): string {
  return Buffer.from(key).toString("hex");
}

export function getOne<T>(db: Database, sql: string): Promise<T> {
  return new Promise((resolve, reject) => {
    db.get(sql, (err: Error | null, row: T) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

export async function runSql(db: Database, sql: string): Promise<void> {
  await run(db, sql);
}
