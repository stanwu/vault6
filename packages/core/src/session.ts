import type { KdfParams } from "@vault6/shared";
import { deriveMasterKey, deriveSubkey, fromBase64 } from "./kdf.js";

export interface VaultSession {
  masterKey: Uint8Array;
  dbKey: Uint8Array;
  wrapKey: Uint8Array;
}

export function openSession(masterPassword: string, saltB64: string, kdf: KdfParams): VaultSession {
  const salt = fromBase64(saltB64);
  const masterKey = deriveMasterKey(masterPassword, salt, kdf);

  return {
    masterKey,
    dbKey: deriveSubkey(masterKey, "db-key"),
    wrapKey: deriveSubkey(masterKey, "wrap-key")
  };
}
