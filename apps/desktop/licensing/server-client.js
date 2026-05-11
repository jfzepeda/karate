// Thin HTTP client for the licensing server (in dev this is the same
// locally-spawned Express server; in production it would be a remote URL
// configured via env var). All network calls happen in the main process.

const DEFAULT_TIMEOUT_MS = 15_000;

function withTimeout(promise, ms = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { promise: promise(controller.signal).finally(() => clearTimeout(t)) };
}

async function postJson(url, body, signal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  let json = {};
  try { json = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    const err = new Error(json.error || `http_${res.status}`);
    err.code = json.error || `http_${res.status}`;
    err.status = res.status;
    err.retryAfterMs = json.retryAfterMs;
    throw err;
  }
  return json;
}

async function getJson(url, signal) {
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("http_" + res.status);
  return res.json();
}

async function activate(serverUrl, { code, machineFingerprint }) {
  const url = serverUrl.replace(/\/+$/, "") + "/api/activate";
  const { promise } = withTimeout((signal) =>
    postJson(url, { code, machineFingerprint }, signal));
  return promise;
}

async function renew(serverUrl, { currentJwt, machineFingerprint }) {
  const url = serverUrl.replace(/\/+$/, "") + "/api/renew-token";
  const { promise } = withTimeout((signal) =>
    postJson(url, { currentJwt, machineFingerprint }, signal));
  return promise;
}

async function fetchPublicKey(serverUrl) {
  const url = serverUrl.replace(/\/+$/, "") + "/api/public-key";
  const res = await fetch(url, { headers: { Accept: "text/plain" } });
  if (!res.ok) throw new Error("public_key_http_" + res.status);
  return (await res.text()).trim();
}

async function hasInternet(serverUrl) {
  try {
    await getJson(serverUrl.replace(/\/+$/, "") + "/api/health");
    return true;
  } catch {
    return false;
  }
}

module.exports = { activate, renew, fetchPublicKey, hasInternet };
