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
  PENDING_TIMEOUT_MS,
  safeParse,
} = require("./protocol");
const { ActionRejectedError } = require("./state-store");

const MAX_BUFFERED_BYTES = 1024 * 1024;

function makeServer({
  store,
  persister,
  port = DEFAULT_WS_PORT,
  onClientsChanged,
  onConnectionRequest,
  onPendingChanged,
  isHostLicensed,
  appVersion,
  tournamentName,
}) {
  let wss = null;
  let timerInterval = null;
  let pingInterval = null;
  let engineInterval = null;
  let prevTimerRemaining = store.getState().timer.remaining;
  const clients = new Map(); // ws → meta
  const approvedClientIds = new Set(); // clientIds approved this session
  const serverId = crypto.randomUUID();

  function broadcastState() {
    const snapshot = store.getState();
    const version = store.getVersion();
    const msg = JSON.stringify({
      type: MSG.FULL_STATE,
      stateVersion: version,
      state: snapshot,
    });
    for (const [ws, meta] of clients) {
      if (meta.status !== "approved") continue;
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
    const list = Array.from(clients.values())
      .filter((c) => c.status === "approved")
      .map((c) => ({
        clientId: c.clientId,
        hostname: c.hostname,
        role: c.role,
        connectedAt: c.connectedAt,
        rttMs: c.rttMs ?? null,
      }));
    if (typeof onClientsChanged === "function") onClientsChanged(list);
    const msg = JSON.stringify({ type: MSG.CLIENT_LIST, clients: list });
    for (const [ws, meta] of clients) {
      if (meta.status !== "approved") continue;
      if (ws.readyState === ws.OPEN) {
        try { ws.send(msg); } catch {}
      }
    }
  }

  function getPendingList() {
    return Array.from(clients.values())
      .filter((c) => c.status === "pending")
      .map((c) => ({
        clientId: c.clientId,
        hostname: c.hostname,
        ip: c.ip,
        role: c.role,
        requestedAt: c.requestedAt,
      }));
  }

  function notifyPending() {
    if (typeof onPendingChanged === "function") {
      try { onPendingChanged(getPendingList()); } catch {}
    }
  }

  function findWsByClientId(clientId) {
    for (const [ws, meta] of clients) {
      if (meta.clientId === clientId) return { ws, meta };
    }
    return null;
  }

  function sendWelcome(ws, meta) {
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
  }

  function approveConnection(clientId) {
    const hit = findWsByClientId(clientId);
    if (!hit) return { ok: false, error: "not_found" };
    const { ws, meta } = hit;
    if (meta.status !== "pending") return { ok: false, error: "not_pending" };
    if (meta.pendingTimeout) {
      clearTimeout(meta.pendingTimeout);
      meta.pendingTimeout = null;
    }
    meta.status = "approved";
    approvedClientIds.add(clientId);
    sendWelcome(ws, meta);
    sendClientList();
    notifyPending();
    return { ok: true };
  }

  function rejectConnection(clientId, reason = "denied") {
    const hit = findWsByClientId(clientId);
    if (!hit) return { ok: false, error: "not_found" };
    const { ws, meta } = hit;
    if (meta.pendingTimeout) {
      clearTimeout(meta.pendingTimeout);
      meta.pendingTimeout = null;
    }
    try { ws.send(JSON.stringify({ type: MSG.CONNECTION_REJECTED, reason })); } catch {}
    try { ws.close(); } catch {}
    clients.delete(ws);
    notifyPending();
    return { ok: true };
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
        if (meta.status !== "approved") continue;
        const now = Date.now();
        meta.pingSentAt = now;
        try { ws.send(JSON.stringify({ type: MSG.PING, ts: now })); } catch {}
      }
    }, PING_INTERVAL_MS);
  }

  function stopPingLoop() {
    if (pingInterval) { clearInterval(pingInterval); pingInterval = null; }
  }

  function startEngineHeartbeat() {
    if (engineInterval) return;
    // Delay-detection / next-match-hint refresh. The engine is also ticked
    // synchronously after every action; this heartbeat catches passive
    // changes (rest timers expiring, areas falling behind expected pace)
    // without waiting for the next operator action.
    engineInterval = setInterval(() => {
      if (typeof store.tickEngineOnly === "function") {
        store.tickEngineOnly();
        broadcastState();
      }
    }, 30000);
  }

  function stopEngineHeartbeat() {
    if (engineInterval) { clearInterval(engineInterval); engineInterval = null; }
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
        startEngineHeartbeat();
        resolve({ port, serverId });
      });
      wss.on("error", (err) => {
        console.warn("[karate-network] ws server error:", err.message);
      });
      wss.on("connection", (ws, request) => {
        const rawIp = request?.socket?.remoteAddress || "";
        // Normalize ::ffff:192.168.x.x → 192.168.x.x for display.
        const ip = rawIp.startsWith("::ffff:") ? rawIp.slice(7) : rawIp;
        const meta = {
          clientId: null,
          hostname: null,
          ip,
          role: "referee",
          status: "awaiting-hello",  // "awaiting-hello" → "pending" → "approved"
          connectedAt: Date.now(),
          requestedAt: 0,
          pendingTimeout: null,
          rttMs: null,
          pingSentAt: 0,
        };
        clients.set(ws, meta);
        ws.on("message", (data) => {
          const msg = safeParse(data.toString("utf8"));
          if (!msg) return;
          if (msg.type === MSG.HELLO) {
            // Idempotent: re-HELLO from an already-approved socket is a no-op.
            if (meta.status === "approved") return;
            meta.clientId = String(msg.clientId || crypto.randomUUID());
            meta.hostname = String(msg.hostname || "(unknown)");
            meta.role = msg.role === "superadmin" ? "superadmin" : "referee";
            meta.requestedAt = Date.now();
            // Host must have an active (or grace) license before guests
            // can join. Reject early so the guest sees a clear message
            // instead of sitting in the pending queue forever.
            if (typeof isHostLicensed === "function" && !isHostLicensed()) {
              try { ws.send(JSON.stringify({
                type: MSG.CONNECTION_REJECTED,
                reason: "host_unlicensed",
              })); } catch {}
              try { ws.close(); } catch {}
              clients.delete(ws);
              return;
            }
            // Previously-approved client in this session → auto-approve (no
            // re-prompt for renderers that reconnect within the same run).
            if (approvedClientIds.has(meta.clientId)) {
              meta.status = "approved";
              sendWelcome(ws, meta);
              sendClientList();
              return;
            }
            meta.status = "pending";
            meta.pendingTimeout = setTimeout(() => {
              if (meta.status !== "pending") return;
              try { ws.send(JSON.stringify({
                type: MSG.CONNECTION_REJECTED,
                reason: "timeout",
              })); } catch {}
              try { ws.close(); } catch {}
              clients.delete(ws);
              notifyPending();
            }, PENDING_TIMEOUT_MS);
            if (typeof onConnectionRequest === "function") {
              try { onConnectionRequest({
                clientId: meta.clientId,
                hostname: meta.hostname,
                ip: meta.ip,
                role: meta.role,
                requestedAt: meta.requestedAt,
              }); } catch {}
            }
            notifyPending();
            return;
          }
          // All other messages require an approved client.
          if (meta.status !== "approved") return;
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
          if (meta.pendingTimeout) {
            clearTimeout(meta.pendingTimeout);
            meta.pendingTimeout = null;
          }
          const wasPending = meta.status === "pending";
          clients.delete(ws);
          if (wasPending) notifyPending();
          else sendClientList();
        });
        ws.on("error", () => {
          if (meta.pendingTimeout) {
            clearTimeout(meta.pendingTimeout);
            meta.pendingTimeout = null;
          }
          const wasPending = meta.status === "pending";
          clients.delete(ws);
          if (wasPending) notifyPending();
          else sendClientList();
        });
      });
    });
  }

  async function stop() {
    stopTimerTick();
    stopPingLoop();
    stopEngineHeartbeat();
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
    for (const [ws, meta] of clients) {
      if (meta.pendingTimeout) {
        clearTimeout(meta.pendingTimeout);
        meta.pendingTimeout = null;
      }
      try { ws.close(); } catch {}
    }
    approvedClientIds.clear();
    notifyPending();
  }

  function getClientList() {
    return Array.from(clients.values())
      .filter((c) => c.status === "approved")
      .map((c) => ({
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
    getPendingList,
    approveConnection,
    rejectConnection,
    notifyLocalChange,
    getAnnounceInfo,
    getServerId() { return serverId; },
    getPort() { return port; },
  };
}

module.exports = { makeServer };
