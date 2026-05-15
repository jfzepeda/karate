// Per-launch local elevation token.
//
// Generated once at app start, kept only in main-process memory, and shared
// with the bundled local API server so admin endpoints can be gated by
// loopback-origin + token (instead of a superadmin JWT role). The token is
// never persisted, never logged, and never sent to any renderer except by
// `karate:overlay-open` when the stealth chord opens the configuration
// overlay on the primary window.

const crypto = require("crypto");

let token = null;

function init() {
  if (!token) token = crypto.randomBytes(32).toString("hex");
  return token;
}

function get() {
  return token;
}

function getter() {
  return get;
}

function clear() {
  token = null;
}

module.exports = { init, get, getter, clear };
