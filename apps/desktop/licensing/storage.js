// Layered secure storage for the license bundle.
//
// Layer 1: safeStorage.encryptString(masterKey) → userData/master.bin
//   The 256-bit master key is created once at first activation.
// Layer 2: AES-256-GCM(JWT, masterKey) → userData/license.bin
//   Encrypted JWT + payload metadata.
//
// Both files live in app.getPath('userData'). Renderer never sees them.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { safeStorage } = require("electron");

const MASTER_FILE = "master.bin";
const LICENSE_FILE = "license.bin";
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;

function masterPath(userDataPath) { return path.join(userDataPath, MASTER_FILE); }
function licensePath(userDataPath) { return path.join(userDataPath, LICENSE_FILE); }

function safeStorageReady() {
  if (!safeStorage.isEncryptionAvailable()) {
    // eslint-disable-next-line no-console
    console.warn("[licensing] safeStorage unavailable — license storage WILL be plaintext-equivalent");
    return false;
  }
  return true;
}

function getStorageBackend() {
  // Linux only — returns 'gnome_libsecret' / 'kwallet5' / 'basic_text' etc.
  try {
    if (typeof safeStorage.getSelectedStorageBackend === "function") {
      return safeStorage.getSelectedStorageBackend();
    }
  } catch { /* ignore */ }
  return "unknown";
}

function loadMasterKey(userDataPath) {
  const mp = masterPath(userDataPath);
  if (!fs.existsSync(mp)) return null;
  const blob = fs.readFileSync(mp);
  try {
    const plaintext = safeStorageReady()
      ? safeStorage.decryptString(blob)
      : blob.toString("hex"); // worst-case fallback
    return Buffer.from(plaintext, "hex");
  } catch {
    return null;
  }
}

function createAndPersistMasterKey(userDataPath) {
  const key = crypto.randomBytes(KEY_LEN);
  const encoded = key.toString("hex");
  const blob = safeStorageReady()
    ? safeStorage.encryptString(encoded)
    : Buffer.from(encoded, "utf8");
  fs.writeFileSync(masterPath(userDataPath), blob, { mode: 0o600 });
  return key;
}

function ensureMasterKey(userDataPath) {
  return loadMasterKey(userDataPath) ?? createAndPersistMasterKey(userDataPath);
}

function encryptString(plaintext, key) {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]);
}

function decryptString(blob, key) {
  if (blob.length < IV_LEN + TAG_LEN + 1) throw new Error("blob too short");
  const iv = blob.subarray(0, IV_LEN);
  const tag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = blob.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

function saveLicense(userDataPath, record) {
  const key = ensureMasterKey(userDataPath);
  const blob = encryptString(JSON.stringify(record), key);
  fs.writeFileSync(licensePath(userDataPath), blob, { mode: 0o600 });
}

function loadLicense(userDataPath) {
  const lp = licensePath(userDataPath);
  if (!fs.existsSync(lp)) return null;
  const key = loadMasterKey(userDataPath);
  if (!key) return null;
  try {
    const blob = fs.readFileSync(lp);
    return JSON.parse(decryptString(blob, key));
  } catch {
    return null;
  }
}

function clearLicense(userDataPath) {
  for (const f of [licensePath(userDataPath), masterPath(userDataPath)]) {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }
}

module.exports = {
  saveLicense, loadLicense, clearLicense,
  ensureMasterKey, getStorageBackend, safeStorageReady,
};
