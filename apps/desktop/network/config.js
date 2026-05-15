// Persisted network configuration in `<userData>/network-config.json`.
// Survives restarts so a machine resumes the same role automatically.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FILE = "network-config.json";
const DEFAULTS = {
  mode: "standalone",   // "standalone" | "server" | "client"
  port: 4747,
  clientId: null,
  lastKnownServerId: null,
};

function configPath(userDataPath) {
  return path.join(userDataPath, FILE);
}

function load(userDataPath) {
  try {
    const raw = fs.readFileSync(configPath(userDataPath), "utf8");
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULTS, ...parsed };
    if (!merged.clientId) merged.clientId = crypto.randomUUID();
    return merged;
  } catch {
    return { ...DEFAULTS, clientId: crypto.randomUUID() };
  }
}

function save(userDataPath, config) {
  try {
    fs.writeFileSync(configPath(userDataPath), JSON.stringify(config, null, 2), {
      mode: 0o600,
    });
  } catch (err) {
    console.warn("[karate-network] failed to save network-config:", err.message);
  }
}

module.exports = { load, save };
