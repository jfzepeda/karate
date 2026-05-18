// Network message-type constants and minimal shape guards. All wire
// messages are UTF-8 JSON with a `type` field plus type-specific fields.

const MSG = Object.freeze({
  // Client → Server
  HELLO: "HELLO",
  ACTION: "ACTION",
  PONG: "PONG",
  REQUEST_FULL_STATE: "REQUEST_FULL_STATE",

  // Server → Client
  WELCOME: "WELCOME",
  FULL_STATE: "FULL_STATE",
  STATE_PATCH: "STATE_PATCH",
  ACTION_ACK: "ACTION_ACK",
  ACTION_REJECTED: "ACTION_REJECTED",
  PING: "PING",
  CLIENT_LIST: "CLIENT_LIST",
  CONNECTION_REJECTED: "CONNECTION_REJECTED",

  // UDP discovery
  ANNOUNCE: "KARATE_SERVER_ANNOUNCE",
});

const PROTOCOL_VERSION = 1;
const DEFAULT_WS_PORT = 4747;
const DEFAULT_UDP_PORT = 4748;
const ANNOUNCE_INTERVAL_MS = 2000;
const SERVER_LOSS_MS = 6000;
const PING_INTERVAL_MS = 10000;
const PENDING_TIMEOUT_MS = 60000;

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

module.exports = {
  MSG,
  PROTOCOL_VERSION,
  DEFAULT_WS_PORT,
  DEFAULT_UDP_PORT,
  ANNOUNCE_INTERVAL_MS,
  SERVER_LOSS_MS,
  PING_INTERVAL_MS,
  PENDING_TIMEOUT_MS,
  safeParse,
};
