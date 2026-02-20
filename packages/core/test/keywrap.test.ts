import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { createVaultKey, unwrapVaultKey, wrapVaultKey } from "../src/keywrap.js";

describe("keywrap", () => {
  it("wraps and unwraps vault key with same wrapKey", () => {
    const vaultKey = createVaultKey();
    const wrapKey = randomBytes(32);

    const wrapped = wrapVaultKey(vaultKey, wrapKey);
    const unwrapped = unwrapVaultKey(wrapped, wrapKey);

    expect(Buffer.from(unwrapped).equals(Buffer.from(vaultKey))).toBe(true);
  });

  it("fails to unwrap with wrong wrapKey", () => {
    const vaultKey = createVaultKey();
    const rightWrapKey = randomBytes(32);
    const wrongWrapKey = randomBytes(32);
    const wrapped = wrapVaultKey(vaultKey, rightWrapKey);

    expect(() => unwrapVaultKey(wrapped, wrongWrapKey)).toThrow();
  });
});

