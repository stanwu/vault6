You are a senior Electron + TypeScript architect and security-minded desktop app engineer.

Goal:
Build a fully working desktop password manager app that is a 1Password 6–style clone in UI/UX and information architecture, but with original assets (no 1Password logos, no copied proprietary text). Cross-platform (Windows + macOS) is mandatory. Offline-first. Data must be stored in an encrypted SQLite3 database using SQLCipher. The UI/UX must feel extremely close to 1Password 6: 3-pane layout, navigation, list/detail patterns, search behavior, editing flow, and keyboard shortcuts.

Absolute constraints (low “flip rate” choices):
- DB encryption must be SQLCipher via the N-API package: "@journeyapps/sqlcipher" (not plain sqlite3, not better-sqlite3). This package provides prebuilt binaries on macOS and Windows and supports Electron (reduces native build pain). If a platform lacks prebuild, provide a documented fallback build-from-source path. (Primary path must use prebuilt.) 
- Electron packaging must use electron-builder and include "postinstall": "electron-builder install-app-deps" to rebuild native modules for the target Electron version.
- No reliance on keytar. If you choose to use Electron safeStorage, it must be optional. Primary design must work without OS keychain integration to avoid platform brittleness.

References you should follow:
- Electron security hardening: contextIsolation on, sandbox on, nodeIntegration off, preload with explicit APIs only.
- SQLCipher PRAGMA usage: set key immediately after opening, use cipher_migrate when needed.

Tech stack:
- Electron (latest stable) + TypeScript.
- Frontend: React + TypeScript.
- Build tooling: Vite for renderer; electron-builder for packaging.
- Database: "@journeyapps/sqlcipher" with a small DB wrapper module.
- Crypto: libsodium (preferred) or Node crypto. KDF must be Argon2id (preferred) with a JS/WASM implementation that is stable cross-platform; if not, use scrypt with clearly documented params. Use authenticated encryption for item payloads (XChaCha20-Poly1305 preferred).
- Search: local index in SQLite (FTS5 if available in SQLCipher build; if not, implement a lightweight trigram/fuzzy search in app code).

Non-negotiables:
1) UI/UX alignment: match 1Password 6 desktop interaction model (3 panes: sidebar / item list / item detail).
2) Encrypted local storage: SQLCipher database encryption at rest. No plaintext secrets on disk.
3) Master Password unlock: locked state -> unlock -> auto-lock timer -> manual lock.
4) Security: threat model notes, secure IPC, no secret logging.
5) Offline-first: no network required for core usage (no sync in v1).
6) Provide a runnable repo with scripts and clear instructions for BOTH Windows and macOS.

Key management (MUST be simple + robust + cross-platform):
- Do NOT store Master Password.
- Derive a Master Key from Master Password using Argon2id (or scrypt fallback) with per-vault salt, store only salt + KDF params.
- Derive subkeys via HKDF from Master Key:
  - dbKey: used to open SQLCipher database (PRAGMA key).
  - wrapKey: used to encrypt/decrypt a random Vault Key (32 bytes).
- Store "vault_key_encrypted" (Vault Key encrypted by wrapKey) in a metadata table inside the encrypted DB.
- Use Vault Key to encrypt all item secret payloads (AEAD). Store only ciphertext + nonce + associated data.

Database encryption requirements:
- On opening DB, the FIRST operation must set SQLCipher key (PRAGMA key) derived from dbKey.
- Include a migration strategy:
  - If DB was created with older SQLCipher defaults, run PRAGMA cipher_migrate.
- Provide an automated test that:
  - Creates a vault DB, inserts a known record, closes.
  - Tries to open the file with a plain sqlite reader (or with wrong key) and confirms it fails or returns unreadable data.
  - Opens with correct key and confirms the record is readable.

Functional requirements (v1):
1) App lifecycle:
   - First run: create vault, set Master Password, onboarding.
   - Subsequent runs: locked screen -> unlock.
   - Auto-lock after X minutes idle; lock on sleep/before suspend best-effort.
2) Vault model:
   - Support multiple vaults (default “Personal”).
   - Categories: Logins, Secure Notes, Credit Cards, Identities, Software Licenses.
   - Tags & Favorites.
3) Items:
   - Create/edit/delete.
   - Item list: icon + title + subtitle; sort (A-Z, last modified).
   - Detail view: sections, masked fields by default, reveal + copy buttons.
4) Search:
   - Global search; fuzzy search titles/username/urls/notes/tags.
   - Cmd/Ctrl+F focuses search like 1Password 6.
5) Password generator:
   - length, digits, symbols, avoid ambiguous chars, strength indicator.
6) Clipboard:
   - Copy username/password; auto-clear clipboard after configurable seconds.
7) Keyboard shortcuts:
   - New item, search, lock, copy password, copy username, reveal password, etc.
8) Settings:
   - Auto-lock timer, clipboard clear timer, light/dark theme, export.
9) Backup export/import (safe scope):
   - Export to an encrypted backup file (.vaultbak) using AEAD with a key derived from Master Key (separate HKDF label).
   - Import from that same format.
   - Do NOT implement 1Password import.

UI/UX spec (mirror 1Password 6 style):
- 3-pane layout:
  - Left sidebar: Vault switcher at top, then Categories, then Tags; collapsible sections.
  - Center list: search bar at top, list rows with icon/title/subtitle, selection highlight.
  - Right detail: large title, grouped fields, copy buttons aligned right, reveal toggles.
- Editing:
  - In-pane edit mode with Save/Cancel, no modal heavy flows.
- Visual style:
  - Native-ish spacing and separators; system fonts; original icons.

Security hardening (must implement):
- Electron:
  - contextIsolation: true
  - sandbox: true
  - nodeIntegration: false
  - disable remote module
  - preload exposes minimal IPC surface with schema validation
- Permissions:
  - deny-by-default permission request handler
- No devtools in production builds
- Redact secrets from logs and crash reports

Repo structure (monorepo recommended):
/apps/desktop (electron main + preload)
/apps/renderer (react UI)
/packages/core (crypto, models, services)
/packages/db (sqlcipher wrapper, migrations)
/packages/shared (types)

Build & packaging (cross-platform):
- Use electron-builder.
- Must include:
  - "postinstall": "electron-builder install-app-deps"
- Provide instructions for:
  - Windows: Visual Studio Build Tools requirements if rebuild is needed
  - macOS: Xcode Command Line Tools requirements
- Provide CI suggestion (optional) to build Windows on Windows runner and macOS on macOS runner.

What to output:
1) Full runnable codebase with all files.
2) package.json scripts: dev, build, test, package.
3) Database schema + migrations.
4) The DB encryption verification test described above.
5) Clear, step-by-step run instructions for Windows and macOS.

Quality bar:
- Must compile and run on both platforms.
- Must store secrets encrypted at rest (SQLCipher + item payload encryption).
- UI interaction model must strongly resemble 1Password 6 patterns.
Start by scaffolding the repo and implementing: lock/unlock, key derivation, SQLCipher open/create, and the 3-pane UI shell.
