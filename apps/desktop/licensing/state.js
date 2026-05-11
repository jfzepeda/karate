// License state machine. Evaluated on every app launch and on each renewal
// tick. Returns the public state shape consumed by the renderer.
//
// States (Part 4 of the spec):
//   UNLICENSED — no JWT cached.
//   ACTIVE     — JWT valid, not expired, fingerprint matches, clock ok.
//   GRACE      — JWT expired < 1h ago AND network unreachable.
//   DEGRADED   — JWT expired beyond grace, OR revoked, OR machine mismatch,
//                OR clock tamper detected. The renderer is told to hide the
//                public scoreboard and lock the private/admin views.

const storage = require("./storage");
const grace = require("./grace");
const lkg = require("./lkg");
const { verifyJwt } = require("./validator");
const client = require("./server-client");

const SILENT_RENEW_AGE_MS = 20 * 60 * 60 * 1000; // 20h
const ACTIVE_TTL_HINT_MS = 24 * 60 * 60 * 1000;  // for renderer display only

function publicLicense(payload) {
  return {
    role: payload.role,
    features: payload.features,
    plan: payload.plan,
    expiresAt: payload.exp * 1000,
    activatedAt: payload.activated_at * 1000,
    jti: payload.jti,
  };
}

function unlicensed() {
  return { kind: "unlicensed" };
}

function degraded(reason, lastRole) {
  return { kind: "degraded", reason, lastRole: lastRole ?? null };
}

function active(payload) {
  return { kind: "active", license: publicLicense(payload) };
}

function graceState(payload, record, now) {
  return {
    kind: "grace",
    license: publicLicense(payload),
    graceStartAt: record.graceStartAt,
    graceRemainingMs: grace.remainingMs(record, now),
  };
}

/**
 * Evaluate the cached license + storage and return the current state.
 *
 * Does at most one network attempt:
 *   - renew if JWT is older than SILENT_RENEW_AGE_MS or already expired AND
 *     the licensing server appears reachable.
 *
 * Side-effects:
 *   - rewrites license.bin with the renewed JWT on success
 *   - writes/clears grace.bin
 *   - advances LKG
 */
async function evaluate({ userDataPath, machineFp, serverUrl }) {
  const cached = storage.loadLicense(userDataPath);
  if (!cached || !cached.jwt) {
    grace.clear(userDataPath);
    return unlicensed();
  }

  const trustedNow = await lkg.getTrustedNow({
    userDataPath, machineFp, licensePayload: cached.payload,
  });
  if (trustedNow === null) {
    return degraded("CLOCK_TAMPER", cached.payload && cached.payload.role);
  }

  // Local verification (allow expired so we can branch on it explicitly).
  const verified = await verifyJwt(cached.jwt, {
    expectedMachineFp: machineFp,
    allowExpired: true,
  });
  if (!verified.ok && verified.reason === "MACHINE_MISMATCH") {
    return degraded("MACHINE_MISMATCH", cached.payload && cached.payload.role);
  }
  if (!verified.ok && verified.reason === "INVALID_SIGNATURE") {
    return degraded("INVALID_SIGNATURE", cached.payload && cached.payload.role);
  }

  const payload = verified.payload;
  const expMs = payload.exp * 1000;
  const ageMs = trustedNow - payload.iat * 1000;
  const isExpired = expMs <= trustedNow;

  // Attempt renewal if expired OR aged past silent-renew threshold.
  const shouldTryRenew = isExpired || ageMs >= SILENT_RENEW_AGE_MS;
  if (shouldTryRenew) {
    let renewError = null;
    let renewed = null;
    try {
      const reachable = await client.hasInternet(serverUrl);
      if (reachable) {
        renewed = await client.renew(serverUrl, {
          currentJwt: cached.jwt,
          machineFingerprint: machineFp,
        });
      } else {
        renewError = { code: "OFFLINE" };
      }
    } catch (err) {
      renewError = { code: err.code || "network_error", status: err.status };
    }

    if (renewed) {
      grace.clear(userDataPath);
      const verifiedNew = await verifyJwt(renewed.token, {
        expectedMachineFp: machineFp,
      });
      if (!verifiedNew.ok) {
        return degraded(verifiedNew.reason || "INVALID_SIGNATURE", payload.role);
      }
      storage.saveLicense(userDataPath, {
        jwt: renewed.token,
        payload: verifiedNew.payload,
      });
      return active(verifiedNew.payload);
    }

    // Renewal failed.
    if (renewError && (renewError.code === "ACCESS_REVOKED" || renewError.status === 401)) {
      return degraded("REVOKED", payload.role);
    }
    if (renewError && (renewError.code === "MACHINE_MISMATCH" || renewError.status === 403)) {
      return degraded("MACHINE_MISMATCH", payload.role);
    }
    // OFFLINE or other transient — fall through to grace/active decision below.
  }

  if (!isExpired) {
    return active(payload);
  }

  // Expired + renewal failed → grace if within 1h window, otherwise degraded.
  const existing = grace.read(userDataPath, machineFp);
  const record = existing && existing.jti === payload.jti
    ? existing
    : grace.start(userDataPath, machineFp, payload.jti);
  const remaining = grace.remainingMs(record, trustedNow);
  if (remaining <= 0) {
    return degraded("EXPIRED", payload.role);
  }
  return graceState(payload, record, trustedNow);
}

async function activate({ userDataPath, machineFp, serverUrl, code }) {
  const response = await client.activate(serverUrl, {
    code, machineFingerprint: machineFp,
  });
  const verified = await verifyJwt(response.token, {
    expectedMachineFp: machineFp,
  });
  if (!verified.ok) {
    const err = new Error("LOCAL_VERIFY_FAILED:" + verified.reason);
    err.code = "LOCAL_VERIFY_FAILED";
    throw err;
  }
  storage.clearLicense(userDataPath);
  storage.saveLicense(userDataPath, {
    jwt: response.token,
    payload: verified.payload,
  });
  grace.clear(userDataPath);
  return active(verified.payload);
}

function clear({ userDataPath }) {
  storage.clearLicense(userDataPath);
  grace.clear(userDataPath);
}

module.exports = {
  evaluate, activate, clear,
  publicLicense, ACTIVE_TTL_HINT_MS,
};
