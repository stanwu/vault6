import { describe, expect, it } from "vitest";
import { DEFAULT_KDF_PARAMS, deriveMasterKey, deriveSubkey, generateSalt, toBase64 } from "../src/kdf.js";
import { openSession } from "../src/session.js";

const TEST_KDF_PARAMS = {
  ...DEFAULT_KDF_PARAMS,
  memoryKiB: 8 * 1024,
  iterations: 1
};

describe("session", () => {
  it("derives dbKey and wrapKey from master password + salt", () => {
    const salt = generateSalt(16);
    const saltB64 = toBase64(salt);
    const session = openSession("master-pass-123", saltB64, TEST_KDF_PARAMS);

    const expectedMaster = deriveMasterKey("master-pass-123", salt, TEST_KDF_PARAMS);
    const expectedDbKey = deriveSubkey(expectedMaster, "db-key");
    const expectedWrapKey = deriveSubkey(expectedMaster, "wrap-key");

    expect(Buffer.from(session.masterKey).equals(Buffer.from(expectedMaster))).toBe(true);
    expect(Buffer.from(session.dbKey).equals(Buffer.from(expectedDbKey))).toBe(true);
    expect(Buffer.from(session.wrapKey).equals(Buffer.from(expectedWrapKey))).toBe(true);
  });
});

