// Electron main process for the Karate Tournament desktop app.
//
// Boot sequence:
//   1. Resolve machine fingerprint (hardware-bound, hashed).
//   2. Start the bundled @karate/server on a localhost port. In dev the
//      server is also the licensing authority; in production this same
//      server runs remotely on Anthropic-owned infra and the desktop talks
//      to it over HTTPS (set KARATE_LICENSING_URL).
//   3. Load and evaluate the cached license. State machine returns one of:
//        unlicensed / active / grace / degraded
//   4. Open the primary window; pass the license state to the renderer via
//      preload. The renderer chooses login / lock / app UI accordingly.
//   5. Public scoreboard window is gated by `canShowPublicWindow()` — never
//      opened in degraded or unlicensed state.
//
// All license file I/O, JWT crypto, and machine fingerprinting happen here.
// The renderer only ever sees the redacted public license shape.

const { app, BrowserWindow, ipcMain, screen, dialog } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");

const licensing = require("./licensing");
const { fetchPublicKey } = require("./licensing/server-client");
const localAdminToken = require("./local-admin-token");
const stealthChord = require("./stealth-chord");
const network = require("./network");

const isPackaged = app.isPackaged;
const ROOT = __dirname;

function resolveServerModule() {
  if (isPackaged) {
    return require(path.join(process.resourcesPath, "server", "index.js"));
  }
  return require(path.join(ROOT, "..", "server", "dist", "index.js"));
}

function resolveStaticDir() {
  if (isPackaged) return path.join(process.resourcesPath, "renderer");
  return path.join(ROOT, "..", "web", "out");
}

let primaryWindow = null;
let publicWindow = null;
let serverHandle = null;
let serverUrl = null;
let licensingUrl = null;
let machineFp = null;
let currentState = null;
let renewTimer = null;

function readLaunchConfig() {
  const appParentDir = path.dirname(path.dirname(path.dirname(process.resourcesPath)));
  const candidates = isPackaged
    ? [
        path.join(appParentDir, "karate-launch.json"),
        path.join(process.resourcesPath, "karate-launch.json"),
      ]
    : [
        path.join(os.homedir(), "Downloads", "karate-launch.json"),
        path.join(__dirname, "karate-launch.json"),
      ];

  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const cfg = JSON.parse(fs.readFileSync(p, "utf8"));
      if (!cfg || typeof cfg.expiresAt !== "number") continue;
      if (cfg.expiresAt <= Date.now()) continue;
      return cfg;
    } catch { /* skip */ }
  }
  return null;
}

let kioskSession = null;

async function startServer() {
  const { createServer } = resolveServerModule();
  const staticDir = resolveStaticDir();
  const launchConfig = readLaunchConfig();
  serverHandle = await createServer({
    staticDir,
    port: 0,
    launchConfig,
    localAdminToken: localAdminToken.getter(),
  });
  const { url, port } = await serverHandle.start();
  serverUrl = url;
  kioskSession = serverHandle.kioskSession ?? null;
  console.log(`[karate-desktop] server listening on ${url} (port ${port})`);
}

function currentToken() {
  const userDataPath = app.getPath("userData");
  try {
    const rec = licensing.storage.loadLicense(userDataPath);
    if (!rec || !rec.jwt) return null;
    if (currentState && (currentState.kind === "active" || currentState.kind === "grace")) {
      return rec.jwt;
    }
    return null;
  } catch { return null; }
}

async function refreshLicenseState() {
  const userDataPath = app.getPath("userData");
  try {
    currentState = await licensing.evaluate({
      userDataPath, machineFp, serverUrl: licensingUrl,
    });
  } catch (err) {
    console.error("[karate-desktop] license eval failed", err);
    currentState = { kind: "degraded", reason: "STORAGE_CORRUPTED", lastRole: null };
  }
  broadcastState();
  scheduleNextRenew();
  applyStateToWindows();
  return currentState;
}

function broadcastState() {
  const envelope = { state: currentState, token: currentToken() };
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) {
      w.webContents.send("karate:license-state", envelope);
    }
  }
}

function scheduleNextRenew() {
  if (renewTimer) clearTimeout(renewTimer);
  if (!currentState) return;
  let delay;
  if (currentState.kind === "active") {
    // Re-evaluate at the silent-renew threshold (or 1 hour from now,
    // whichever is sooner).
    delay = Math.max(60_000, Math.min(60 * 60_000, currentState.license.expiresAt - Date.now() - 60_000));
  } else if (currentState.kind === "grace") {
    delay = Math.min(60_000, currentState.graceRemainingMs);
  } else {
    delay = 5 * 60_000; // poll less frequently in degraded/unlicensed
  }
  renewTimer = setTimeout(() => { refreshLicenseState().catch(() => {}); }, delay);
}

function canShowPublicWindow() {
  if (!currentState) return false;
  if (currentState.kind === "active") return true;
  if (currentState.kind === "grace") return true;
  return false;
}

function applyStateToWindows() {
  if (!canShowPublicWindow() && publicWindow && !publicWindow.isDestroyed()) {
    publicWindow.close();
    publicWindow = null;
  }
}

function commonWebPreferences() {
  return {
    preload: path.join(ROOT, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false,
    additionalArguments: [`--karate-server-url=${serverUrl}`],
  };
}

function createPrimaryWindow() {
  const display = screen.getPrimaryDisplay().workAreaSize;
  primaryWindow = new BrowserWindow({
    width: Math.min(1480, display.width - 40),
    height: Math.min(960, display.height - 40),
    title: "Karate Tournament",
    backgroundColor: "#0f1117",
    autoHideMenuBar: true,
    webPreferences: commonWebPreferences(),
  });
  primaryWindow.loadURL(serverUrl);
  primaryWindow.webContents.on("did-finish-load", () => broadcastState());
  primaryWindow.on("closed", () => { primaryWindow = null; });
  stealthChord.attach(primaryWindow.webContents);
}

function createPublicWindow() {
  if (!canShowPublicWindow()) {
    console.warn("[karate-desktop] public window blocked: license", currentState && currentState.kind);
    return null;
  }
  if (publicWindow && !publicWindow.isDestroyed()) {
    publicWindow.focus();
    return publicWindow;
  }
  const all = screen.getAllDisplays();
  const target =
    all.find((d) => d.id !== screen.getPrimaryDisplay().id) || screen.getPrimaryDisplay();
  publicWindow = new BrowserWindow({
    x: target.bounds.x + 40,
    y: target.bounds.y + 40,
    width: Math.min(1280, target.workArea.width - 80),
    height: Math.min(800, target.workArea.height - 80),
    title: "Karate · Public Scoreboard",
    backgroundColor: "#000",
    autoHideMenuBar: true,
    webPreferences: commonWebPreferences(),
  });
  publicWindow.loadURL(serverUrl + "/public");
  publicWindow.webContents.on("did-finish-load", () => broadcastState());
  publicWindow.on("closed", () => { publicWindow = null; });
  stealthChord.attach(publicWindow.webContents);
  return publicWindow;
}

function emitChordListening() {
  console.log("[karate] chord LISTENING activo");
  if (!primaryWindow || primaryWindow.isDestroyed()) return;
  primaryWindow.webContents.send("karate:chord-listening");
}

function emitOverlayOpen() {
  if (!primaryWindow || primaryWindow.isDestroyed()) return;
  try { primaryWindow.focus(); } catch { /* ignore */ }
  primaryWindow.webContents.send("karate:overlay-open", {
    localAdminToken: localAdminToken.get(),
    serverUrl,
  });
  stealthChord.setOverlayOpen(true);
}

function emitOverlayClose() {
  if (primaryWindow && !primaryWindow.isDestroyed()) {
    primaryWindow.webContents.send("karate:overlay-close");
  }
  stealthChord.setOverlayOpen(false);
}

app.whenReady().then(async () => {
  try {
    localAdminToken.init();
    stealthChord.init({ onOpen: emitOverlayOpen, onClose: emitOverlayClose, onListening: emitChordListening });
    await startServer();
    machineFp = licensing.getMachineFingerprint(app.getPath("userData"));
    licensingUrl = process.env.KARATE_LICENSING_URL || serverUrl;

    // Dev mode: pull the locally-spawned server's public key into the
    // validator so we can verify JWTs end-to-end without shipping a key.
    // Production builds embed the key statically in validator.js.
    try {
      const spki = await fetchPublicKey(licensingUrl);
      licensing.trustDynamicPublicKey(spki);
    } catch (err) {
      console.warn("[karate-desktop] could not fetch dynamic public key:", err.message);
    }

    await refreshLicenseState();
  } catch (err) {
    console.error("[karate-desktop] startup failed", err);
    dialog.showErrorBox("Startup failure", String(err));
    app.quit();
    return;
  }

  ipcMain.handle("karate:get-server-url", () => serverUrl);
  ipcMain.on("karate:get-kiosk-session", (event) => {
    event.returnValue = kioskSession;
  });
  ipcMain.handle("karate:get-license-state", () => ({ state: currentState, token: currentToken() }));
  ipcMain.handle("karate:get-license-bootstrap", () => ({
    state: currentState,
    token: currentToken(),
    serverUrl,
    machineFingerprint: machineFp,
    kioskSession,
  }));

  ipcMain.handle("karate:activate-code", async (_evt, code) => {
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return { ok: false, error: "CODE_NOT_FOUND" };
    }
    try {
      currentState = await licensing.activateCode({
        userDataPath: app.getPath("userData"),
        machineFp, serverUrl: licensingUrl, code,
      });
      broadcastState();
      scheduleNextRenew();
      return { ok: true, state: currentState, token: currentToken() };
    } catch (err) {
      return { ok: false, error: err.code || "activation_failed" };
    }
  });

  ipcMain.handle("karate:retry-renewal", async () => {
    await refreshLicenseState();
    return { state: currentState, token: currentToken() };
  });

  ipcMain.handle("karate:reset-license", async () => {
    licensing.clearLicense({ userDataPath: app.getPath("userData") });
    return refreshLicenseState();
  });

  ipcMain.handle("karate:open-public-window", () => {
    if (!canShowPublicWindow()) return false;
    createPublicWindow();
    return true;
  });

  ipcMain.handle("karate:overlay-close-request", () => {
    emitOverlayClose();
    return { ok: true };
  });

  createPrimaryWindow();
  await network.create({
    userDataPath: app.getPath("userData"),
    mainWindow: primaryWindow,
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createPrimaryWindow();
      network.setMainWindow(primaryWindow);
    }
  });
});

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    if (renewTimer) clearTimeout(renewTimer);
    try { await network.shutdown(); } catch { /* ignore */ }
    if (serverHandle) {
      try { await serverHandle.stop(); } catch { /* ignore */ }
    }
    app.quit();
  }
});

app.on("before-quit", async () => {
  if (renewTimer) clearTimeout(renewTimer);
  try { await network.shutdown(); } catch { /* ignore */ }
  if (serverHandle) {
    try { await serverHandle.stop(); } catch { /* ignore */ }
  }
});
