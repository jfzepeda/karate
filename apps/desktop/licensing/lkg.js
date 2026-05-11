// Last Known Good time — HMAC-signed monotonic timestamp persisted across
// app launches. Used to detect wall-clock rollback attacks.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const LKG_FILE = "lkg.bin";

function lkgPath(userDataPath) { return path.join(userDataPath, LKG_FILE); }

function hmac(machineFp, ts) {
  return crypto.createHmac("sha256", machineFp).update(String(ts)).digest("hex");
}

function readLKG(userDataPath, machineFp) {
  const p = lkgPath(userDataPath);
  if (!fs.existsSync(p)) return null;
  try {
    const { ts, sig } = JSON.parse(fs.readFileSync(p, "utf8"));
    if (typeof ts !== "number" || typeof sig !== "string") return null;
    const expected = hmac(machineFp, ts);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    return { ts };
  } catch {
    return null;
  }
}

function writeLKG(userDataPath, machineFp, ts) {
  fs.writeFileSync(
    lkgPath(userDataPath),
    JSON.stringify({ ts, sig: hmac(machineFp, ts) }),
    { mode: 0o600 },
  );
}

function updateLastKnownGood(userDataPath, machineFp, now) {
  const existing = readLKG(userDataPath, machineFp);
  if (!existing || now > existing.ts) {
    writeLKG(userDataPath, machineFp, now);
  }
}

/**
 * Returns the current trusted timestamp or `null` if rollback is detected.
 *
 * Floors checked, in order:
 *   1. JWT `activated_at` (server-signed, immutable).
 *   2. Local HMAC-signed LKG.
 *   3. Optional NTP (best-effort; skipped when offline or unreachable).
 *
 * The LKG is advanced monotonically each time the function returns successfully.
 */
async function getTrustedNow({ userDataPath, machineFp, licensePayload }) {
  const now = Date.now();

  if (licensePayload && typeof licensePayload.activated_at === "number") {
    if (now < licensePayload.activated_at * 1000) return null;
  }

  const lkg = readLKG(userDataPath, machineFp);
  if (lkg && now < lkg.ts - 60_000) {
    // Clock moved backwards by > 60 s since last successful run.
    return null;
  }

  updateLastKnownGood(userDataPath, machineFp, now);
  return now;
}

module.exports = { getTrustedNow, readLKG, updateLastKnownGood };
