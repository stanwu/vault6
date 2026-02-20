import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { fromBase64, toBase64 } from "./kdf.js";

export interface WrappedKey {
  nonceB64: string;
  ciphertextB64: string;
  tagB64: string;
}

export function createVaultKey(): Uint8Array {
  return randomBytes(32);
}

export function wrapVaultKey(vaultKey: Uint8Array, wrapKey: Uint8Array): WrappedKey {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", wrapKey, nonce);
  const ciphertext = Buffer.concat([cipher.update(vaultKey), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    nonceB64: toBase64(nonce),
    ciphertextB64: toBase64(ciphertext),
    tagB64: toBase64(tag)
  };
}

export function unwrapVaultKey(wrapped: WrappedKey, wrapKey: Uint8Array): Uint8Array {
  const nonce = fromBase64(wrapped.nonceB64);
  const ciphertext = fromBase64(wrapped.ciphertextB64);
  const tag = fromBase64(wrapped.tagB64);

  const decipher = createDecipheriv("aes-256-gcm", wrapKey, nonce);
  decipher.setAuthTag(Buffer.from(tag));

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
