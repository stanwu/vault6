import { z } from "zod";

const { contextBridge, ipcRenderer } = require("electron") as typeof import("electron");

const createSchema = z.object({
  dbPath: z.string().min(1),
  masterPassword: z.string().min(8),
  name: z.string().min(1)
});

const unlockSchema = z.object({
  dbPath: z.string().min(1),
  masterPassword: z.string().min(8)
});

const api = {
  createVault: async (payload: unknown) => {
    const parsed = createSchema.parse(payload);
    return ipcRenderer.invoke("vault:create", parsed);
  },
  unlockVault: async (payload: unknown) => {
    const parsed = unlockSchema.parse(payload);
    return ipcRenderer.invoke("vault:unlock", parsed);
  },
  lockVault: async () => ipcRenderer.invoke("vault:lock"),
  getStatus: async () => ipcRenderer.invoke("vault:status"),
  onLocked: (handler: (payload: { reason: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: { reason: string }) => handler(payload);
    ipcRenderer.on("vault:locked", listener);
    return () => ipcRenderer.removeListener("vault:locked", listener);
  }
};

contextBridge.exposeInMainWorld("vaultApi", api);
