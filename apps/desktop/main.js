// Electron main process for the Karate Tournament desktop app.
//
// Layout:
//   1. On startup, spawn an in-process Express server (the @karate/server
//      package). The server hosts the JSON API, the /admin-panel HTML, and
//      the Next.js export's static assets — all on a single localhost port.
//   2. Open a primary BrowserWindow pointed at the server.
//   3. Expose a small preload bridge so the renderer can:
//        - read the resolved server URL
//        - request a second BrowserWindow for the public scoreboard
//        - know that it's running inside Electron (window.__KARATE__.isElectron)
//
// Data persistence lives in the user's home directory (`~/.karate-tournament`)
// — nothing inside the app bundle is mutated.

const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

const isPackaged = app.isPackaged;
const ROOT = __dirname;

// Resolve the bundled @karate/server. In dev (unpackaged) we load it via
// require resolution from the workspace; in packaged builds it's copied into
// `process.resourcesPath/server/index.js`.
function resolveServerModule() {
  if (isPackaged) {
    const p = path.join(process.resourcesPath, "server", "index.js");
    return require(p);
  }
  // dev: project workspace path
  return require(path.join(ROOT, "..", "server", "dist", "index.js"));
}

function resolveStaticDir() {
  if (isPackaged) {
    return path.join(process.resourcesPath, "renderer");
  }
  return path.join(ROOT, "..", "web", "out");
}

let primaryWindow = null;
let publicWindow = null;
let serverHandle = null;
let serverUrl = null;

async function startServer() {
  const { createServer } = resolveServerModule();
  const staticDir = resolveStaticDir();
  serverHandle = await createServer({ staticDir, port: 0 });
  const { url, port } = await serverHandle.start();
  serverUrl = url;
  // eslint-disable-next-line no-console
  console.log(`[karate-desktop] server listening on ${url} (port ${port})`);
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
  primaryWindow.on("closed", () => {
    primaryWindow = null;
  });
}

function createPublicWindow() {
  if (publicWindow && !publicWindow.isDestroyed()) {
    publicWindow.focus();
    return publicWindow;
  }
  // Try to place the public window on a secondary display when one exists.
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
  publicWindow.on("closed", () => {
    publicWindow = null;
  });
  return publicWindow;
}

app.whenReady().then(async () => {
  try {
    await startServer();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[karate-desktop] failed to start server", err);
    app.quit();
    return;
  }

  ipcMain.handle("karate:get-server-url", () => serverUrl);
  ipcMain.handle("karate:open-public-window", () => {
    createPublicWindow();
    return true;
  });

  createPrimaryWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createPrimaryWindow();
  });
});

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    if (serverHandle) {
      try {
        await serverHandle.stop();
      } catch {
        // ignore
      }
    }
    app.quit();
  }
});

app.on("before-quit", async () => {
  if (serverHandle) {
    try {
      await serverHandle.stop();
    } catch {
      // ignore
    }
  }
});
