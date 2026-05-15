// WebSocket server for SERVER mode. Owns the master timer tick. Each
// inbound action is run through the state-store reducer; on success the
// updated state is broadcast to every connected client.

const { WebSocketServer } = require("ws");
const crypto = require("crypto");
const os = require("os");
const {
  MSG,
  PROTOCOL_VERSION,
  DEFAULT_WS_PORT,
  PING_INTERVAL_MS,
  safeParse,
} = require("./protocol");
const { ActionRejectedError } = require("./state-store");

const MAX_BUFFERED_BYTES = 1024 * 1024;

function makeServer({
  store,
  persister,
  port = DEFAULT_WS_PORT,
  onClientsChanged,
  appVersion,
  tournamentName,
}) {
  let wss = null;
  let timerInterval = null;
  let pingInterval = null;
  let prevTimerRemaining = store.getState().timer.remaining;
  const clients = new Map(); // ws → meta
  const serverId = crypto.randomUUID();

  function broadcastState() {
    const snapshot = store.getState();
    const version = store.getVersion();
    const msg = JSON.stringify({
      type: MSG.FULL_STATE,
      stateVersion: version,
      state: snapshot,
    });
    for (const [ws] of clients) {
      if (ws.readyState !== ws.OPEN) continue;
      if (ws.bufferedAmount > MAX_BUFFERED_BYTES) {
        try { ws.terminate(); } catch {}
        continue;
      }
      try { ws.send(msg); } catch {}
    }
    persister.schedule(snapshot, version);
  }

  function sendClientList() {
    const list = Array.from(clients.values()).map((c) => ({
      clientId: c.clientId,
      hostname: c.hostname,
      role: c.role,
      connectedAt: c.connectedAt,
      rttMs: c.rttMs ?? null,
    }));
    if (typeof onClientsChanged === "function") onClientsChanged(list);
    const msg = JSON.stringify({ type: MSG.CLIENT_LIST, clients: list });
    for (const [ws] of clients) {
      if (ws.readyState === ws.OPEN) {
        try { ws.send(msg); } catch {}
      }
    }
  }

  function handleAction(ws, meta, action) {
    if (!action || typeof action.actionType !== "string") {
      try { ws.send(JSON.stringify({
        type: MSG.ACTION_REJECTED,
        actionId: action?.actionId ?? null,
        reason: "invalid",
        message: "missing actionType",
      })); } catch {}
      return;
    }
    try {
      const { version } = store.apply(action);
      try { ws.send(JSON.stringify({
        type: MSG.ACTION_ACK,
        actionId: action.actionId,
        newVersion: version,
      })); } catch {}
      broadcastState();
    } catch (err) {
      const reason = err instanceof ActionRejectedError ? err.reason : "invalid";
      try { ws.send(JSON.stringify({
        type: MSG.ACTION_REJECTED,
        actionId: action.actionId,
        reason,
        message: err.message,
      })); } catch {}
    }
  }

  function startTimerTick() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      const s = store.getState();
      const t = s.timer;
      if (!t.running || t.remaining <= 0) return;
      if (s.match.discipline === "kata") return;
      // Apply tick via a direct reducer call (internal action).
      const next = t.remaining - 1;
      t.remaining = Math.max(0, next);
      if (prevTimerRemaining > 15 && t.remaining === 15) {
        t.warnedAt = Date.now();
      }
      if (t.remaining === 0) {
        t.running = false;
        t.finished = true;
        t.expiredAt = Date.now();
      }
      prevTimerRemaining = t.remaining;
      // Manually bump version + broadcast.
      store.replaceAll(s);
      broadcastState();
    }, 1000);
  }

  function stopTimerTick() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function startPingLoop() {
    if (pingInterval) return;
    pingInterval = setInterval(() => {
      for (const [ws, meta] of clients) {
        if (ws.readyState !== ws.OPEN) continue;
        const now = Date.now();
        meta.pingSentAt = now;
        try { ws.send(JSON.stringify({ type: MSG.PING, ts: now })); } catch {}
      }
    }, PING_INTERVAL_MS);
  }

  function stopPingLoop() {
    if (pingInterval) { clearInterval(pingInterval); pingInterval = null; }
  }

  function getAnnounceInfo() {
    return {
      serverId,
      serverPort: port,
      appVersion,
      tournamentName: tournamentName?.() ?? null,
      startedAt: Date.now(),
    };
  }

  function start() {
    return new Promise((resolve, reject) => {
      try {
        wss = new WebSocketServer({ port, host: "0.0.0.0" });
      } catch (err) {
        reject(err); return;
      }
      wss.on("listening", () => {
        startTimerTick();
        startPingLoop();
        resolve({ port, serverId });
      });
      wss.on("error", (err) => {
        console.warn("[karate-network] ws server error:", err.message);
      });
      wss.on("connection", (ws) => {
        const meta = {
          clientId: null,
          hostname: null,
          role: "referee",
          connectedAt: Date.now(),
          rttMs: null,
          pingSentAt: 0,
        };
        clients.set(ws, meta);
        ws.on("message", (data) => {
          const msg = safeParse(data.toString("utf8"));
          if (!msg) return;
          if (msg.type === MSG.HELLO) {
            meta.clientId = String(msg.clientId || crypto.randomUUID());
            meta.hostname = String(msg.hostname || "(unknown)");
            meta.role = msg.role === "superadmin" ? "superadmin" : "referee";
            try { ws.send(JSON.stringify({
              type: MSG.WELCOME,
              serverId,
              protocolVersion: PROTOCOL_VERSION,
              appVersion,
              stateVersion: store.getVersion(),
              state: store.getState(),
              clientId: meta.clientId,
              now: Date.now(),
            })); } catch {}
            sendClientList();
            return;
          }
          if (msg.type === MSG.ACTION) {
            handleAction(ws, meta, msg);
            return;
          }
          if (msg.type === MSG.PONG) {
            if (meta.pingSentAt) {
              meta.rttMs = Date.now() - meta.pingSentAt;
            }
            return;
          }
          if (msg.type === MSG.REQUEST_FULL_STATE) {
            try { ws.send(JSON.stringify({
              type: MSG.FULL_STATE,
              stateVersion: store.getVersion(),
              state: store.getState(),
            })); } catch {}
            return;
          }
        });
        ws.on("close", () => {
          clients.delete(ws);
          sendClientList();
        });
        ws.on("error", () => {
          clients.delete(ws);
          sendClientList();
        });
      });
    });
  }

  async function stop() {
    stopTimerTick();
    stopPingLoop();
    for (const [ws] of clients) {
      try { ws.close(); } catch {}
    }
    clients.clear();
    if (wss) {
      await new Promise((r) => wss.close(() => r()));
      wss = null;
    }
    persister.flushNow();
  }

  function disconnectAll() {
    for (const [ws] of clients) {
      try { ws.close(); } catch {}
    }
  }

  function getClientList() {
    return Array.from(clients.values()).map((c) => ({
      clientId: c.clientId,
      hostname: c.hostname,
      role: c.role,
      connectedAt: c.connectedAt,
      rttMs: c.rttMs ?? null,
    }));
  }

  // Called when state was changed by a local (server-machine) renderer
  // action, so we still broadcast to everyone else.
  function notifyLocalChange() {
    broadcastState();
  }

  return {
    start,
    stop,
    disconnectAll,
    getClientList,
    notifyLocalChange,
    getAnnounceInfo,
    getServerId() { return serverId; },
    getPort() { return port; },
  };
}

module.exports = { makeServer };
