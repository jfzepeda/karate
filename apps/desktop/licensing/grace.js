// Grace period record. Persisted across app launches so the countdown is
// continuous — the user cannot reset it by closing and reopening the app.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const GRACE_FILE = "grace.bin";
const GRACE_DURATION_MS = 60 * 60 * 1000; // 1 hour, per Part 4 spec

function gracePath(userDataPath) { return path.join(userDataPath, GRACE_FILE); }

function hmac(machineFp, body) {
  return crypto.createHmac("sha256", machineFp).update(body).digest("hex");
}

function read(userDataPath, machineFp) {
  const p = gracePath(userDataPath);
  if (!fs.existsSync(p)) return null;
  try {
    const blob = JSON.parse(fs.readFileSync(p, "utf8"));
    const body = JSON.stringify({
      jti: blob.jti,
      graceStartAt: blob.graceStartAt,
      machineFingerprint: blob.machineFingerprint,
    });
    const expected = hmac(machineFp, body);
    if (typeof blob.sig !== "string") return null;
    if (!crypto.timingSafeEqual(Buffer.from(blob.sig), Buffer.from(expected))) {
      return null;
    }
    if (blob.machineFingerprint !== machineFp) return null;
    return {
      jti: String(blob.jti),
      graceStartAt: Number(blob.graceStartAt),
      machineFingerprint: String(blob.machineFingerprint),
    };
  } catch {
    return null;
  }
}

function start(userDataPath, machineFp, jti) {
  // Idempotent: never overwrite an existing record so the countdown is
  // continuous across app restarts.
  const existing = read(userDataPath, machineFp);
  if (existing && existing.jti === jti) return existing;
  const record = {
    jti, graceStartAt: Date.now(), machineFingerprint: machineFp,
  };
  const body = JSON.stringify(record);
  fs.writeFileSync(
    gracePath(userDataPath),
    JSON.stringify({ ...record, sig: hmac(machineFp, body) }),
    { mode: 0o600 },
  );
  return record;
}

function clear(userDataPath) {
  try { fs.unlinkSync(gracePath(userDataPath)); } catch { /* ignore */ }
}

function remainingMs(record, now) {
  return Math.max(0, record.graceStartAt + GRACE_DURATION_MS - now);
}

module.exports = { read, start, clear, remainingMs, GRACE_DURATION_MS };
