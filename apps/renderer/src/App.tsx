import { useEffect, useMemo, useState } from "react";
import type { VaultRecord } from "@vault6/shared";

type Mode = "locked" | "unlocked";

const mockItems: VaultRecord[] = [
  {
    id: "1",
    title: "GitHub",
    subtitle: "stan@example.com",
    category: "logins",
    favorite: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: "2",
    title: "Personal Note",
    subtitle: "Recovery codes",
    category: "secure-notes",
    favorite: false,
    updatedAt: new Date().toISOString()
  }
];

export function App() {
  const [mode, setMode] = useState<Mode>("locked");
  const [dbPath, setDbPath] = useState("./vaults/personal.vault.db");
  const [masterPassword, setMasterPassword] = useState("");
  const [vaultName, setVaultName] = useState("Personal");
  const [selectedId, setSelectedId] = useState(mockItems[0]?.id ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!window.vaultApi) {
      setError("vaultApi is unavailable. Check preload loading.");
      return;
    }

    window.vaultApi
      .getStatus()
      .then((status) => setMode(status.isLocked ? "locked" : "unlocked"))
      .catch(() => setMode("locked"));

    const unsub = window.vaultApi.onLocked(() => setMode("locked"));
    return () => unsub();
  }, []);

  const selected = useMemo(() => mockItems.find((item) => item.id === selectedId), [selectedId]);

  async function onCreateVault() {
    if (!window.vaultApi) {
      setError("vaultApi is unavailable. Check preload loading.");
      return;
    }
    setError("");
    try {
      await window.vaultApi.createVault({ dbPath, masterPassword, name: vaultName });
      setMode("unlocked");
    } catch (e) {
      setError((e as Error).message || "Create vault failed");
    }
  }

  async function onUnlockVault() {
    if (!window.vaultApi) {
      setError("vaultApi is unavailable. Check preload loading.");
      return;
    }
    setError("");
    try {
      await window.vaultApi.unlockVault({ dbPath, masterPassword });
      setMode("unlocked");
    } catch (e) {
      setError((e as Error).message || "Unlock failed");
    }
  }

  async function onLock() {
    if (!window.vaultApi) {
      setError("vaultApi is unavailable. Check preload loading.");
      return;
    }
    await window.vaultApi.lockVault();
    setMode("locked");
  }

  if (mode === "locked") {
    return (
      <div className="lock-screen">
        <div className="lock-card">
          <h1>Vault6</h1>
          <p>Unlock your local vault</p>
          <label>
            Vault DB Path
            <input value={dbPath} onChange={(e) => setDbPath(e.target.value)} />
          </label>
          <label>
            Vault Name
            <input value={vaultName} onChange={(e) => setVaultName(e.target.value)} />
          </label>
          <label>
            Master Password
            <input
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
            />
          </label>
          {error ? <div className="error">{error}</div> : null}
          <div className="actions">
            <button onClick={onUnlockVault}>Unlock</button>
            <button onClick={onCreateVault}>Create New Vault</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="pane sidebar">
        <div className="pane-header">Vaults</div>
        <button className="vault-btn active">{vaultName}</button>
        <div className="group-title">Categories</div>
        <ul className="simple-list">
          <li>Logins</li>
          <li>Secure Notes</li>
          <li>Credit Cards</li>
          <li>Identities</li>
          <li>Software Licenses</li>
        </ul>
      </aside>

      <main className="pane list-pane">
        <div className="pane-header">
          <input className="search" placeholder="Search" />
        </div>
        <ul className="items">
          {mockItems.map((item) => (
            <li
              key={item.id}
              className={item.id === selectedId ? "item selected" : "item"}
              onClick={() => setSelectedId(item.id)}
            >
              <div className="item-title">{item.title}</div>
              <div className="item-subtitle">{item.subtitle}</div>
            </li>
          ))}
        </ul>
      </main>

      <section className="pane detail-pane">
        <div className="pane-header detail-head">
          <span>Detail</span>
          <button onClick={onLock}>Lock</button>
        </div>
        {selected ? (
          <div className="detail-body">
            <h1>{selected.title}</h1>
            <div className="field-row">
              <span>Username</span>
              <button>Copy</button>
            </div>
            <div className="field-row">
              <span>Password</span>
              <button>Reveal</button>
            </div>
          </div>
        ) : (
          <div className="empty">No item selected</div>
        )}
      </section>
    </div>
  );
}
