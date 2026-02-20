# Vault6 POC

This repository contains a first-pass POC for a 1Password 6 style desktop vault app.

## Scope in this POC

- Monorepo layout for desktop, renderer, and shared packages
- Electron security defaults (`contextIsolation`, `sandbox`, `nodeIntegration: false`)
- Master password flow: create vault / unlock vault / lock
- Key derivation using Argon2id (`@noble/hashes`) + HKDF subkeys
- SQLCipher integration via `@journeyapps/sqlcipher`
- 3-pane shell UI (sidebar / list / detail)
- Unit tests for key derivation and SQLCipher wrong-key behavior

## Install

1. Install Node.js 22 LTS (recommended).
2. Run `npm install`.

### Native prerequisites

- Windows: Install Visual Studio Build Tools (Desktop development with C++).
- macOS: Install Xcode Command Line Tools (`xcode-select --install`).

> Primary path uses prebuilt binaries from `@journeyapps/sqlcipher`. If prebuild is unavailable, native toolchain is required.

## Run (development)

1. Start renderer in one terminal:
   - `npm run dev --workspace @vault6/renderer`
2. Start Electron shell in another terminal:
   - `npm run dev --workspace @vault6/desktop`

## Key management in this POC

- Master Password is never stored.
- A sidecar metadata file (`.meta.json`) stores only non-secret vault bootstrap data:
  - salt
  - KDF params
  - vault id/name
- Derived keys:
  - `dbKey` opens SQLCipher DB
  - `wrapKey` encrypts a random `vaultKey`
- Wrapped vault key is stored in encrypted `metadata` table.

## Tests

- `npm run test`

Includes DB encryption verification:
- open with correct key and read data succeeds
- open with wrong key fails

## Package

- `npm run package`

This uses `electron-builder`.

## License

MIT

本專案 100% 由 Codex 產生

## Next iterations

- Item CRUD + field-level AEAD payload encryption with `vaultKey`
- Fuzzy search and keyboard shortcuts
- Clipboard auto-clear, settings, backup import/export
