export {};

declare global {
  interface Window {
    vaultApi: {
      createVault(payload: { dbPath: string; masterPassword: string; name: string }): Promise<{ ok: boolean }>;
      unlockVault(payload: { dbPath: string; masterPassword: string }): Promise<{ ok: boolean }>;
      lockVault(): Promise<{ ok: boolean }>;
      getStatus(): Promise<{ isLocked: boolean; dbPath: string | null }>;
      onLocked(handler: (payload: { reason: string }) => void): () => void;
    };
  }
}
