import { describe, expect, it } from "vitest";
import { DEFAULT_KDF_PARAMS, deriveMasterKey, deriveSubkey, generateSalt } from "../src/kdf.js";

const TEST_KDF_PARAMS = {
  ...DEFAULT_KDF_PARAMS,
  memoryKiB: 8 * 1024,
  iterations: 1
};

describe("kdf", () => {
  it("derives deterministic key for same password+salt", () => {
    const salt = generateSalt(16);
    const a = deriveMasterKey("pass-123", salt, TEST_KDF_PARAMS);
    const b = deriveMasterKey("pass-123", salt, TEST_KDF_PARAMS);

    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  it("derives different subkeys by label", () => {
    const salt = generateSalt(16);
    const master = deriveMasterKey("pass-123", salt, TEST_KDF_PARAMS);
    const db = deriveSubkey(master, "db-key");
    const wrap = deriveSubkey(master, "wrap-key");

    expect(Buffer.from(db).equals(Buffer.from(wrap))).toBe(false);
  });
});
