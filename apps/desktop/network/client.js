// WebSocket client for CLIENT mode. Auto-reconnects (3s) and re-handshakes
// after each reconnection.

const WebSocket = require("ws");
const os = require("os");
const {
  MSG,
  PROTOCOL_VERSION,
  SERVER_LOSS_MS,
} = require("./protocol");

const RECONNECT_MS = 3000;

function makeClient({
  clientId,
  appVersion,
  onState,
  onStatus,
  onAck,
  onRejected,
  onConnectionRejected,
}) {
  let ws = null;
  let reconnectTimer = null;
  let connected = false;
  let target = null;     // { serverId, ip, port }
  let lastState = null;
  let stateVersion = 0;
  let wasRejected = false;
  let welcomed = false;  // true once first WELCOME/FULL_STATE arrived

  function status() {
    return {
      connected,
      welcomed,
      target: target ? { ...target } : null,
      stateVersion,
    };
  }

  function pushStatus() {
    if (typeof onStatus === "function") onStatus(status());
  }

  function send(obj) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try { ws.send(JSON.stringify(obj)); return true; } catch { return false; }
  }

  function hello() {
    send({
      type: MSG.HELLO,
      protocolVersion: PROTOCOL_VERSION,
      clientId,
      hostname: os.hostname(),
      appVersion,
      role: "referee",
    });
  }

  function connectTo({ serverId, ip, port }) {
    if (ws) {
      try { ws.removeAllListeners(); ws.close(); } catch {}
      ws = null;
    }
    target = { serverId, ip, port };
    wasRejected = false;
    welcomed = false;
    try {
      ws = new WebSocket(`ws://${ip}:${port}`);
    } catch (err) {
      console.warn("[karate-network] client connect failed:", err.message);
      scheduleReconnect();
      return;
    }
    ws.on("open", () => {
      connected = true;
      pushStatus();
      hello();
    });
    ws.on("message", (data) => {
      let msg;
      try { msg = JSON.parse(data.toString("utf8")); } catch { return; }
      if (msg.type === MSG.WELCOME || msg.type === MSG.FULL_STATE) {
        lastState = msg.state;
        stateVersion = msg.stateVersion;
        welcomed = true;
        pushStatus();
        if (typeof onState === "function") {
          onState({ kind: "full", state: msg.state, stateVersion: msg.stateVersion });
        }
        return;
      }
      if (msg.type === MSG.CONNECTION_REJECTED) {
        wasRejected = true;
        const reason = typeof msg.reason === "string" ? msg.reason : "denied";
        if (typeof onConnectionRejected === "function") {
          try { onConnectionRejected({ reason, target: target ? { ...target } : null }); } catch {}
        }
        // Stop retrying — surface the rejection to the renderer instead.
        target = null;
        if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
        try { ws?.close(); } catch {}
        return;
      }
      if (msg.type === MSG.STATE_PATCH) {
        // For v1 we fall back to FULL_STATE on any patch arrival to keep
        // the implementation small. Request a full snapshot instead.
        send({ type: MSG.REQUEST_FULL_STATE, reason: "missed-patch" });
        return;
      }
      if (msg.type === MSG.ACTION_ACK) {
        if (typeof onAck === "function") onAck(msg);
        return;
      }
      if (msg.type === MSG.ACTION_REJECTED) {
        if (typeof onRejected === "function") onRejected(msg);
        return;
      }
      if (msg.type === MSG.PING) {
        send({ type: MSG.PONG, ts: msg.ts });
        return;
      }
      if (msg.type === MSG.CLIENT_LIST) {
        // Clients ignore peer list. Could surface in status if useful later.
        return;
      }
    });
    ws.on("close", () => {
      connected = false;
      welcomed = false;
      pushStatus();
      if (!wasRejected) scheduleReconnect();
    });
    ws.on("error", () => {
      // 'close' will follow.
    });
  }

  function scheduleReconnect() {
    if (reconnectTimer || !target || wasRejected) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (target && !wasRejected) connectTo(target);
    }, RECONNECT_MS);
  }

  function clearRejection() {
    wasRejected = false;
  }

  function sendAction(action) {
    if (!connected) return false;
    return send({ type: MSG.ACTION, ...action });
  }

  function disconnect() {
    target = null;
    wasRejected = false;
    welcomed = false;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (ws) {
      try { ws.removeAllListeners(); ws.close(); } catch {}
      ws = null;
    }
    connected = false;
    pushStatus();
  }

  return {
    connectTo,
    disconnect,
    sendAction,
    status,
    clearRejection,
    getLastState() { return lastState; },
    isConnected() { return connected; },
    isWelcomed() { return welcomed; },
    getTarget() { return target; },
  };
}

module.exports = { makeClient, RECONNECT_MS };
