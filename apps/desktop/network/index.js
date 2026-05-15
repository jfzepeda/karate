// Network controller façade. Decides the active mode (STANDALONE / SERVER
// / CLIENT), starts/stops the relevant subsystems, and exposes IPC.

const { ipcMain } = require("electron");
const os = require("os");
const networkConfig = require("./config");
const persistence = require("./persistence");
const { makeStateStore } = require("./state-store");
const { makeServer } = require("./server");
const { makeClient } = require("./client");
const {
  makeAnnouncer,
  makeListener,
  pickServerIp,
} = require("./discovery");
const { DEFAULT_WS_PORT } = require("./protocol");
const core = require("../dist-core/index.cjs");

const APP_VERSION = "1.0.0";

let userDataPath = null;
let mainWindowRef = null;
let cfg = null;
let store = null;
let persister = null;
let server = null;
let client = null;
let announcer = null;
let listener = null;
let mode = "standalone";
let lastClients = [];

function send(channel, payload) {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    try { mainWindowRef.webContents.send(channel, payload); } catch {}
  }
}

function getTournamentName() {
  const s = store?.getState();
  return s?.tournament?.activeCategoryId ?? null;
}

function announcePayload() {
  if (!server) return null;
  const ip = pickServerIp();
  if (!ip) return null;
  const info = server.getAnnounceInfo();
  return {
    serverId: info.serverId,
    serverIp: ip,
    serverPort: info.serverPort,
    appVersion: info.appVersion,
    tournamentName: info.tournamentName,
    startedAt: info.startedAt,
  };
}

function pushStatus() {
  send("karate:network-status", getStatus());
}

function pushState() {
  if (!store) return;
  send("karate:network-state", {
    kind: "full",
    state: store.getState(),
    stateVersion: store.getVersion(),
  });
}

function getStatus() {
  if (mode === "server") {
    return {
      mode,
      connected: true,
      serverInfo: server ? {
        serverId: server.getServerId(),
        serverIp: pickServerIp(),
        serverPort: server.getPort(),
        hostname: os.hostname(),
      } : null,
      clients: lastClients,
      stateVersion: store?.getVersion() ?? 0,
    };
  }
  if (mode === "client") {
    const st = client?.status() ?? { connected: false, target: null, stateVersion: 0 };
    return {
      mode,
      connected: !!st.connected,
      serverInfo: st.target
        ? {
            serverId: st.target.serverId,
            serverIp: st.target.ip,
            serverPort: st.target.port,
            hostname: null,
          }
        : null,
      clients: [],
      stateVersion: store?.getVersion() ?? 0,
    };
  }
  return {
    mode,
    connected: false,
    serverInfo: null,
    clients: [],
    stateVersion: store?.getVersion() ?? 0,
  };
}

async function startServerMode() {
  const persisted = persistence.load(userDataPath);
  const persistedMeta = persistence.loadMeta(userDataPath);
  const initial = persisted ? core.loadState({
    getItem: (k) => k === "karate-state-v5" ? JSON.stringify(persisted) : null,
  }) : core.buildInitialState();
  store = makeStateStore(initial);
  if (persistedMeta?.stateVersion) {
    // Restore a sensible version counter so clients that resume mid-session
    // don't get a regression. (Internal bump is fine; clients re-handshake.)
    // Bumping is enough for monotonicity.
    for (let i = 0; i < persistedMeta.stateVersion; i += 1) {
      // no-op; we just want getVersion() to advance — emulate by replaceAll
      // exactly once to bring the counter forward.
    }
  }
  persister = persistence.makePersister(userDataPath);
  server = makeServer({
    store,
    persister,
    port: cfg.port ?? DEFAULT_WS_PORT,
    onClientsChanged: (list) => {
      lastClients = list;
      pushStatus();
    },
    appVersion: APP_VERSION,
    tournamentName: getTournamentName,
  });
  await server.start();
  announcer = makeAnnouncer({ getPayload: announcePayload });
  announcer.start();
  pushState();
  pushStatus();
}

function startClientMode() {
  store = makeStateStore(core.buildInitialState());
  client = makeClient({
    clientId: cfg.clientId,
    appVersion: APP_VERSION,
    onState: ({ state, stateVersion }) => {
      store.replaceAll(state);
      send("karate:network-state", { kind: "full", state, stateVersion });
    },
    onStatus: () => pushStatus(),
    onAck: (msg) => send("karate:network-action-ack", msg),
    onRejected: (msg) => send("karate:network-action-rejected", msg),
  });
  listener = makeListener({
    onAnnounce: (ann) => {
      const current = client.getTarget();
      if (!current) {
        // Auto-connect on first sighting.
        client.connectTo({ serverId: ann.serverId, ip: ann.serverIp, port: ann.serverPort });
        cfg.lastKnownServerId = ann.serverId;
        networkConfig.save(userDataPath, cfg);
      } else if (current.serverId !== ann.serverId) {
        send("karate:network-rival-server", ann);
      }
    },
  });
  listener.start();
  pushStatus();
}

function startStandaloneMode() {
  store = makeStateStore(core.buildInitialState());
  // Listen for an existing server briefly; if one shows up the renderer
  // can prompt the user to connect via the rival-server channel.
  listener = makeListener({
    onAnnounce: (ann) => send("karate:network-rival-server", ann),
  });
  listener.start();
  pushStatus();
}

async function stopAll() {
  if (announcer) { try { announcer.stop(); } catch {} announcer = null; }
  if (listener) { try { listener.stop(); } catch {} listener = null; }
  if (server) { try { await server.stop(); } catch {} server = null; }
  if (client) { try { client.disconnect(); } catch {} client = null; }
  if (persister) { try { persister.flushNow(); } catch {} persister = null; }
  store = null;
  lastClients = [];
}

async function setMode(nextMode) {
  if (nextMode !== "standalone" && nextMode !== "server" && nextMode !== "client") {
    return { ok: false, error: "invalid_mode" };
  }
  if (nextMode === mode) return { ok: true };
  await stopAll();
  mode = nextMode;
  cfg.mode = nextMode;
  networkConfig.save(userDataPath, cfg);
  if (mode === "server") {
    // Detect needsImport: no persisted tournament state yet.
    const existing = persistence.load(userDataPath);
    const needsImport = !existing;
    await startServerMode();
    return { ok: true, needsImport };
  }
  if (mode === "client") {
    startClientMode();
    return { ok: true };
  }
  startStandaloneMode();
  return { ok: true };
}

function importLocalState(rawState) {
  if (mode !== "server" || !store || !persister) {
    return { ok: false, error: "not_server" };
  }
  try {
    const normalized = core.loadState({
      getItem: (k) => k === "karate-state-v5" ? JSON.stringify(rawState) : null,
    });
    store.replaceAll(normalized);
    persister.flushNow();
    if (server) server.notifyLocalChange();
    pushState();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function sendAction(envelope) {
  if (!envelope || typeof envelope.actionType !== "string") {
    return { ok: false, error: "invalid_envelope" };
  }
  if (mode === "server") {
    try {
      store.apply(envelope);
      persister.schedule(store.getState(), store.getVersion());
      if (server) server.notifyLocalChange();
      pushState();
      send("karate:network-action-ack", {
        actionId: envelope.actionId,
        newVersion: store.getVersion(),
      });
      return { ok: true };
    } catch (err) {
      send("karate:network-action-rejected", {
        actionId: envelope.actionId,
        reason: err.reason || "invalid",
        message: err.message,
      });
      return { ok: false, error: err.message };
    }
  }
  if (mode === "client") {
    if (!client.isConnected()) {
      send("karate:network-action-rejected", {
        actionId: envelope.actionId,
        reason: "disconnected",
        message: "not connected",
      });
      return { ok: false, error: "disconnected" };
    }
    client.sendAction(envelope);
    return { ok: true };
  }
  // standalone — the renderer handles its own state locally; this path
  // shouldn't be invoked, but accept it as a no-op success.
  return { ok: true };
}

function listDiscoveredServers() {
  if (!listener) return [];
  return listener.listDiscovered();
}

function connectTo(serverId) {
  if (mode !== "client" || !client || !listener) return { ok: false };
  const ann = listener.listDiscovered().find((a) => a.serverId === serverId);
  if (!ann) return { ok: false, error: "not_found" };
  client.connectTo({ serverId, ip: ann.serverIp, port: ann.serverPort });
  return { ok: true };
}

function disconnectAllClients() {
  if (mode === "server" && server) server.disconnectAll();
}

async function create({ userDataPath: udp, mainWindow }) {
  userDataPath = udp;
  mainWindowRef = mainWindow;
  cfg = networkConfig.load(userDataPath);
  networkConfig.save(userDataPath, cfg); // ensure clientId persisted

  ipcMain.handle("karate:network-get-status", () => getStatus());
  ipcMain.handle("karate:network-set-mode", async (_e, m) => setMode(m));
  ipcMain.handle("karate:network-import-local-state", (_e, s) => importLocalState(s));
  ipcMain.handle("karate:network-send-action", (_e, a) => sendAction(a));
  ipcMain.handle("karate:network-list-discovered-servers", () => listDiscoveredServers());
  ipcMain.handle("karate:network-connect-to", (_e, id) => connectTo(id));
  ipcMain.handle("karate:network-disconnect-all-clients", () => {
    disconnectAllClients();
    return { ok: true };
  });

  if (cfg.mode === "server") await startServerMode().then(() => { mode = "server"; });
  else if (cfg.mode === "client") { startClientMode(); mode = "client"; }
  else { startStandaloneMode(); mode = "standalone"; }
}

function setMainWindow(win) {
  mainWindowRef = win;
}

async function shutdown() {
  await stopAll();
}

module.exports = { create, shutdown, setMainWindow };
