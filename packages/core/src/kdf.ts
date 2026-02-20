import { argon2id } from "@noble/hashes/argon2";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha2";
import { randomBytes } from "node:crypto";
import type { KdfParams } from "@vault6/shared";

export const DEFAULT_KDF_PARAMS: KdfParams = {
  memoryKiB: 64 * 1024,
  iterations: 3,
  parallelism: 1,
  outputLen: 32
};

const te = new TextEncoder();

export function generateSalt(bytes = 16): Uint8Array {
  return randomBytes(bytes);
}

export function deriveMasterKey(
  masterPassword: string,
  salt: Uint8Array,
  params: KdfParams = DEFAULT_KDF_PARAMS
): Uint8Array {
  return argon2id(masterPassword, salt, {
    t: params.iterations,
    m: params.memoryKiB,
    p: params.parallelism,
    dkLen: params.outputLen
  });
}

export function deriveSubkey(masterKey: Uint8Array, label: string, length = 32): Uint8Array {
  return hkdf(sha256, masterKey, undefined, te.encode(`vault6:${label}`), length);
}

export function toBase64(data: Uint8Array): string {
  return Buffer.from(data).toString("base64");
}

export function fromBase64(data: string): Uint8Array {
  return Buffer.from(data, "base64");
}
