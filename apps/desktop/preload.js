// Preload script for Karate Tournament Electron windows.
//
// Exposes a tiny audited surface to the renderer at `window.__KARATE__`.
// Critical: no raw JWT, no master key, no machine fingerprint *as a secret*
// is exposed. The renderer can SEE its own machine fingerprint (it's not a
// secret — the server already received it in plaintext) but cannot read or
// write the JWT.

const { contextBridge, ipcRenderer } = require("electron");

function readArgFromArgv(flag) {
  for (const arg of process.argv) {
    if (typeof arg === "string" && arg.startsWith(flag)) {
      return arg.slice(flag.length);
    }
  }
  return null;
}

const serverUrl = readArgFromArgv("--karate-server-url=");

let kioskSession = null;
try {
  kioskSession = ipcRenderer.sendSync("karate:get-kiosk-session");
} catch { /* ignore */ }

const listeners = new Set();
ipcRenderer.on("karate:license-state", (_evt, envelope) => {
  for (const cb of listeners) {
    try { cb(envelope); } catch { /* ignore */ }
  }
});

contextBridge.exposeInMainWorld("__KARATE__", {
  isElectron: true,
  serverUrl,
  kioskSession,

  // License surface — read-only state plus the actions the renderer can
  // request. Renderer never sees the JWT itself.
  license: {
    async getBootstrap() {
      return await ipcRenderer.invoke("karate:get-license-bootstrap");
    },
    async getState() {
      return await ipcRenderer.invoke("karate:get-license-state");
    },
    async activateCode(code) {
      return await ipcRenderer.invoke("karate:activate-code", code);
    },
    async retryRenewal() {
      return await ipcRenderer.invoke("karate:retry-renewal");
    },
    async reset() {
      return await ipcRenderer.invoke("karate:reset-license");
    },
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  },

  openPublicWindow() {
    return ipcRenderer.invoke("karate:open-public-window");
  },
});
