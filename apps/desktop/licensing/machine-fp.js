// Machine fingerprinting (main process only).
//
// Primary source: `node-machine-id`, which reads a platform-specific
// hardware-bound id (IOPlatformUUID on macOS, registry MachineGuid on Windows,
// /etc/machine-id on Linux). We hash it with SHA-256 so the raw id never
// leaves this process and so the fingerprint format is consistent across
// platforms.
//
// On Linux when no /etc/machine-id exists (rare), `machineIdSync` throws.
// We fall back to a stable userData-scoped salt so the renderer always has
// *some* fingerprint to display, but flag it so the validator can refuse to
// accept the JWT issued under that fingerprint on a different machine — the
// salt rotates with userData wipes.

const { machineIdSync } = require("node-machine-id");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

let cached = null;

function getMachineFingerprint(userDataPath) {
  if (cached) return cached;
  try {
    const raw = machineIdSync({ original: false });
    cached = createHash("sha256").update("karate-fp:" + raw).digest("hex");
    return cached;
  } catch {
    // Fallback: random salt stored in userData. This means a userData wipe
    // changes the fingerprint, which forces a re-activation. That's the
    // intended security posture if the OS gives us no hardware id.
    const saltPath = path.join(userDataPath, "fp-salt.bin");
    let salt;
    try { salt = fs.readFileSync(saltPath, "utf8"); }
    catch {
      salt = createHash("sha256")
        .update(String(Date.now()) + ":" + Math.random())
        .digest("hex");
      fs.writeFileSync(saltPath, salt, { mode: 0o600 });
    }
    cached = createHash("sha256").update("karate-fp-fallback:" + salt).digest("hex");
    return cached;
  }
}

module.exports = { getMachineFingerprint };
