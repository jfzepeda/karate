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

const overlayOpenListeners = new Set();
const overlayCloseListeners = new Set();
const chordListeningListeners = new Set();
ipcRenderer.on("karate:overlay-open", (_evt, payload) => {
  for (const cb of overlayOpenListeners) {
    try { cb(payload); } catch { /* ignore */ }
  }
});
ipcRenderer.on("karate:overlay-close", () => {
  for (const cb of overlayCloseListeners) {
    try { cb(); } catch { /* ignore */ }
  }
});
ipcRenderer.on("karate:chord-listening", () => {
  for (const cb of chordListeningListeners) {
    try { cb(); } catch { /* ignore */ }
  }
});

function makeFanout() { return new Set(); }
const netStateListeners = makeFanout();
const netStatusListeners = makeFanout();
const netAckListeners = makeFanout();
const netRejectedListeners = makeFanout();
const netRivalListeners = makeFanout();
ipcRenderer.on("karate:network-state", (_evt, payload) => {
  for (const cb of netStateListeners) { try { cb(payload); } catch {} }
});
ipcRenderer.on("karate:network-status", (_evt, payload) => {
  for (const cb of netStatusListeners) { try { cb(payload); } catch {} }
});
ipcRenderer.on("karate:network-action-ack", (_evt, payload) => {
  for (const cb of netAckListeners) { try { cb(payload); } catch {} }
});
ipcRenderer.on("karate:network-action-rejected", (_evt, payload) => {
  for (const cb of netRejectedListeners) { try { cb(payload); } catch {} }
});
ipcRenderer.on("karate:network-rival-server", (_evt, payload) => {
  for (const cb of netRivalListeners) { try { cb(payload); } catch {} }
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

  // Configuration overlay surface. The renderer cannot trigger overlay
  // open — only the main-process chord detector can. The renderer may
  // request a programmatic close (e.g. after an unrecoverable error).
  overlay: {
    onOpen(cb) {
      overlayOpenListeners.add(cb);
      return () => overlayOpenListeners.delete(cb);
    },
    onClose(cb) {
      overlayCloseListeners.add(cb);
      return () => overlayCloseListeners.delete(cb);
    },
    onListening(cb) {
      chordListeningListeners.add(cb);
      return () => chordListeningListeners.delete(cb);
    },
    requestClose() {
      return ipcRenderer.invoke("karate:overlay-close-request");
    },
  },

  // Network / multiplayer surface.
  network: {
    getStatus() { return ipcRenderer.invoke("karate:network-get-status"); },
    setMode(mode) { return ipcRenderer.invoke("karate:network-set-mode", mode); },
    importLocalState(state) { return ipcRenderer.invoke("karate:network-import-local-state", state); },
    sendAction(action) { return ipcRenderer.invoke("karate:network-send-action", action); },
    listDiscoveredServers() { return ipcRenderer.invoke("karate:network-list-discovered-servers"); },
    connectTo(serverId) { return ipcRenderer.invoke("karate:network-connect-to", serverId); },
    disconnectAllClients() { return ipcRenderer.invoke("karate:network-disconnect-all-clients"); },
    onState(cb) {
      netStateListeners.add(cb);
      return () => netStateListeners.delete(cb);
    },
    onStatus(cb) {
      netStatusListeners.add(cb);
      return () => netStatusListeners.delete(cb);
    },
    onAck(cb) {
      netAckListeners.add(cb);
      return () => netAckListeners.delete(cb);
    },
    onRejected(cb) {
      netRejectedListeners.add(cb);
      return () => netRejectedListeners.delete(cb);
    },
    onRivalServer(cb) {
      netRivalListeners.add(cb);
      return () => netRivalListeners.delete(cb);
    },
  },
});
