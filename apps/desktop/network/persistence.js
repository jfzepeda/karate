// Atomic-write debounced JSON persistence for the master tournament state.

const fs = require("fs");
const path = require("path");

const FILE = "tournament-state.json";
const META = "tournament-state.meta.json";
const FLUSH_MS = 250;

function statePath(userDataPath) { return path.join(userDataPath, FILE); }
function metaPath(userDataPath) { return path.join(userDataPath, META); }

function load(userDataPath) {
  try {
    const raw = fs.readFileSync(statePath(userDataPath), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadMeta(userDataPath) {
  try {
    const raw = fs.readFileSync(metaPath(userDataPath), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeAtomic(targetPath, json) {
  const tmp = `${targetPath}.tmp`;
  let attempts = 0;
  for (;;) {
    try {
      fs.writeFileSync(tmp, json, { mode: 0o600 });
      fs.renameSync(tmp, targetPath);
      return;
    } catch (err) {
      if (attempts < 1 && err.code === "EBUSY") {
        attempts += 1;
        const start = Date.now();
        while (Date.now() - start < 50) { /* spin */ }
        continue;
      }
      throw err;
    }
  }
}

function makePersister(userDataPath) {
  let pending = null;
  let timer = null;

  function flushNow() {
    if (!pending) return;
    const { state, version } = pending;
    pending = null;
    if (timer) { clearTimeout(timer); timer = null; }
    try {
      writeAtomic(statePath(userDataPath), JSON.stringify(state));
      writeAtomic(metaPath(userDataPath), JSON.stringify({
        stateVersion: version,
        savedAt: Date.now(),
      }));
    } catch (err) {
      console.warn("[karate-network] state flush failed:", err.message);
    }
  }

  function schedule(state, version) {
    pending = { state, version };
    if (timer) return;
    timer = setTimeout(() => { timer = null; flushNow(); }, FLUSH_MS);
  }

  return { schedule, flushNow };
}

module.exports = { load, loadMeta, makePersister };
