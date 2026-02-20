import { dirname, join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  DEFAULT_KDF_PARAMS,
  createVaultKey,
  deriveMasterKey,
  deriveSubkey,
  fromBase64,
  generateSalt,
  toBase64,
  unwrapVaultKey,
  wrapVaultKey
} from "@vault6/core";
import { applyKeyAndMigrate, closeDb, getOne, keyToHex, migrateV1, openSqlcipher, runSql } from "@vault6/db";
import type { KdfParams } from "@vault6/shared";

const { BrowserWindow, app, ipcMain, powerMonitor, session } = require("electron") as typeof import("electron");

const createVaultSchema = z.object({
  dbPath: z.string().min(1),
  masterPassword: z.string().min(8),
  name: z.string().min(1)
});

const unlockSchema = z.object({
  dbPath: z.string().min(1),
  masterPassword: z.string().min(8)
});

interface VaultMetaFile {
  vaultId: string;
  vaultName: string;
  saltB64: string;
  kdf: KdfParams;
}

let mainWindow: InstanceType<typeof BrowserWindow> | null = null;
let isLocked = true;
let lockTimer: NodeJS.Timeout | null = null;
let activeDbPath: string | null = null;

function metaFilePath(dbPath: string): string {
  return `${dbPath}.meta.json`;
}

function readMeta(dbPath: string): VaultMetaFile {
  return JSON.parse(readFileSync(metaFilePath(dbPath), "utf8")) as VaultMetaFile;
}

function writeMeta(dbPath: string, meta: VaultMetaFile): void {
  writeFileSync(metaFilePath(dbPath), JSON.stringify(meta, null, 2), "utf8");
}

function scheduleAutoLock(minutes = 5): void {
  if (lockTimer) {
    clearTimeout(lockTimer);
  }
  lockTimer = setTimeout(() => {
    isLocked = true;
    mainWindow?.webContents.send("vault:locked", { reason: "timeout" });
  }, minutes * 60 * 1000);
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: !app.isPackaged
    }
  });

  if (!app.isPackaged) {
    const devUrl =
      process.env.ELECTRON_RENDERER_URL ?? process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.webContents.on("did-fail-load", (_event, code, desc, url) => {
    console.error("Renderer load failed:", { code, desc, url });
    if (!app.isPackaged && code === -102) {
      const retryUrl =
        process.env.ELECTRON_RENDERER_URL ?? process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";
      setTimeout(() => {
        mainWindow?.loadURL(retryUrl);
      }, 800);
    }
  });

  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    console.log("Renderer console:", { level, message, line, sourceId });
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer process gone:", details);
  });
}

function ensureDbFolder(dbPath: string): void {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function denyByDefaultPermissions(): void {
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });
}

async function createVault(raw: unknown) {
  const input = createVaultSchema.parse(raw);
  ensureDbFolder(input.dbPath);

  const salt = generateSalt(16);
  const masterKey = deriveMasterKey(input.masterPassword, salt, DEFAULT_KDF_PARAMS);
  const dbKey = deriveSubkey(masterKey, "db-key");
  const wrapKey = deriveSubkey(masterKey, "wrap-key");
  const vaultKey = createVaultKey();
  const wrappedVaultKey = wrapVaultKey(vaultKey, wrapKey);
  const vaultId = randomUUID();

  const db = openSqlcipher(input.dbPath);
  await applyKeyAndMigrate(db, keyToHex(dbKey));
  await migrateV1(db);

  await runSql(
    db,
    `INSERT OR REPLACE INTO metadata(key, value) VALUES
      ('vault_id', '${vaultId}'),
      ('vault_name', '${input.name.replaceAll("'", "''")}'),
      ('vault_key_encrypted', '${JSON.stringify(wrappedVaultKey).replaceAll("'", "''")}');`
  );

  await closeDb(db);

  writeMeta(input.dbPath, {
    vaultId,
    vaultName: input.name,
    saltB64: toBase64(salt),
    kdf: DEFAULT_KDF_PARAMS
  });

  activeDbPath = input.dbPath;
  isLocked = false;
  scheduleAutoLock(5);

  return { ok: true };
}

async function unlockVault(raw: unknown) {
  const input = unlockSchema.parse(raw);
  const meta = readMeta(input.dbPath);
  const salt = fromBase64(meta.saltB64);

  const masterKey = deriveMasterKey(input.masterPassword, salt, meta.kdf);
  const dbKey = deriveSubkey(masterKey, "db-key");
  const wrapKey = deriveSubkey(masterKey, "wrap-key");

  const db = openSqlcipher(input.dbPath);
  await applyKeyAndMigrate(db, keyToHex(dbKey));

  const row = await getOne<{ value: string }>(db, "SELECT value FROM metadata WHERE key='vault_key_encrypted';");
  const wrapped = JSON.parse(row.value) as { nonceB64: string; ciphertextB64: string; tagB64: string };
  unwrapVaultKey(wrapped, wrapKey);

  await closeDb(db);

  activeDbPath = input.dbPath;
  isLocked = false;
  scheduleAutoLock(5);

  return { ok: true };
}

function lockVault() {
  isLocked = true;
  activeDbPath = null;
  if (lockTimer) {
    clearTimeout(lockTimer);
    lockTimer = null;
  }
  return { ok: true };
}

app.whenReady().then(() => {
  denyByDefaultPermissions();
  createMainWindow();

  ipcMain.handle("vault:create", (_event, payload) => createVault(payload));
  ipcMain.handle("vault:unlock", (_event, payload) => unlockVault(payload));
  ipcMain.handle("vault:lock", () => lockVault());
  ipcMain.handle("vault:status", () => ({ isLocked, dbPath: activeDbPath }));

  powerMonitor.on("suspend", () => {
    lockVault();
    mainWindow?.webContents.send("vault:locked", { reason: "suspend" });
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
