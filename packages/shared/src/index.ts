export type Category =
  | "logins"
  | "secure-notes"
  | "credit-cards"
  | "identities"
  | "software-licenses";

export interface VaultRecord {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  favorite: boolean;
  updatedAt: string;
}

export interface KdfParams {
  memoryKiB: number;
  iterations: number;
  parallelism: number;
  outputLen: number;
}

export interface VaultMetadata {
  id: string;
  name: string;
  saltB64: string;
  kdf: KdfParams;
}

export interface UnlockRequest {
  dbPath: string;
  masterPassword: string;
}

export interface CreateVaultRequest extends UnlockRequest {
  name: string;
}
