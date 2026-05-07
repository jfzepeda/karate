// Preload script for Karate Tournament Electron windows.
//
// Exposes a tiny, audited surface to the renderer at `window.__KARATE__`.
// Anything not listed here is not reachable from page JavaScript — context
// isolation is on and node integration is off.
//
// The server URL is passed in via `additionalArguments` on the BrowserWindow's
// webPreferences (see main.js) so the renderer can read it synchronously
// during initial render.

const { contextBridge, ipcRenderer } = require("electron");

function readServerUrlFromArgv() {
  const flag = "--karate-server-url=";
  for (const arg of process.argv) {
    if (typeof arg === "string" && arg.startsWith(flag)) {
      return arg.slice(flag.length);
    }
  }
  return null;
}

const serverUrl = readServerUrlFromArgv();

contextBridge.exposeInMainWorld("__KARATE__", {
  isElectron: true,
  serverUrl,
  openPublicWindow() {
    ipcRenderer.invoke("karate:open-public-window");
  },
});
