// JWT validator (main process only).
//
// CRITICAL: The public key MUST be hardcoded in source. Never load it from a
// file the user can edit, an env var, or a config the renderer can reach.
// Replace `EMBEDDED_PUBLIC_KEY_SPKI` with the SPKI PEM the server prints on
// first boot via /api/public-key.
//
// To rotate keys later, ship a new app version whose constant carries the
// new SPKI; the `kid` header on JWTs lets future code accept multiple keys
// during a transition.

const { jwtVerify, importSPKI, decodeProtectedHeader } = require("jose");

const ISSUER = "https://api.karate-tournament.app";
const AUDIENCE = "karate-tournament-app";
const ALG = "EdDSA";

// In dev the embedded key is empty; the desktop falls back to the local
// server's /api/public-key. In a packaged production build this constant
// must contain the SPKI string of the licensing-server private key.
const EMBEDDED_PUBLIC_KEY_SPKI =
  process.env.KARATE_EMBEDDED_PUBLIC_KEY ||
  ``;

const KID_REGISTRY = {
  // "2026-01": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
};
if (EMBEDDED_PUBLIC_KEY_SPKI) KID_REGISTRY["2026-01"] = EMBEDDED_PUBLIC_KEY_SPKI;

const keyCache = new Map(); // kid → CryptoKey
let dynamicSpki = null;       // fallback in dev: server-provided SPKI

async function resolveKey(kid) {
  if (keyCache.has(kid)) return keyCache.get(kid);
  let spki = KID_REGISTRY[kid];
  if (!spki && dynamicSpki) spki = dynamicSpki;
  if (!spki) throw new Error("INVALID_KID:" + kid);
  const key = await importSPKI(spki, ALG);
  keyCache.set(kid, key);
  return key;
}

/** Allows main.js to inject the locally-spawned server's public key when no
 *  hardcoded one is embedded (dev mode). Production builds should never call
 *  this — they ship with `EMBEDDED_PUBLIC_KEY_SPKI` set. */
function trustDynamicPublicKey(spki) {
  dynamicSpki = spki;
  keyCache.clear();
}

async function verifyJwt(jwt, opts = {}) {
  const { expectedMachineFp, allowExpired = false } = opts;
  let header;
  try { header = decodeProtectedHeader(jwt); }
  catch { return { ok: false, reason: "INVALID_SIGNATURE" }; }
  if (header.alg !== ALG) {
    return { ok: false, reason: "INVALID_SIGNATURE" };
  }
  let key;
  try { key = await resolveKey(String(header.kid ?? "")); }
  catch { return { ok: false, reason: "INVALID_SIGNATURE" }; }

  try {
    const verifyOpts = {
      algorithms: [ALG],
      issuer: ISSUER,
      audience: AUDIENCE,
    };
    if (allowExpired) verifyOpts.clockTolerance = "7 days";
    const { payload } = await jwtVerify(jwt, key, verifyOpts);
    if (expectedMachineFp && payload.machine_fp !== expectedMachineFp) {
      return { ok: false, reason: "MACHINE_MISMATCH", payload };
    }
    return { ok: true, payload };
  } catch (err) {
    const code = (err && err.code) || "";
    if (code === "ERR_JWT_EXPIRED") return { ok: false, reason: "EXPIRED" };
    return { ok: false, reason: "INVALID_SIGNATURE" };
  }
}

module.exports = { verifyJwt, trustDynamicPublicKey, ISSUER, AUDIENCE, ALG };
