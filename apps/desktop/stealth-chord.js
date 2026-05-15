// Stealth keyboard chord detector for the configuration overlay.
//
// Hooks Electron's `before-input-event` on every BrowserWindow's
// webContents so the sequence is captured before any renderer-side DOM
// listener (including focused text inputs) sees it. Detection lives in
// the main process exclusively; no part of the expected sequence is
// readable from the renderer bundle.
//
// State machine
//   IDLE → CTRL_DOWN → GOT_1 → GOT_2 → GOT_3 → LISTENING → DEBOUNCING → IDLE
// Open transition: digits with Control held, all-up, then the 6-letter
//   table matched in order within 5 s.
// Close transition: digits with Control held, all-up — when the overlay
//   is already open, emits onClose immediately and enters DEBOUNCING.
// A 1000 ms debounce after a transition prevents accidental re-trigger.
//
// Wrong / extraneous keys during any chord phase silently reset the
// machine. Keys that participated in a chord phase are swallowed so
// they cannot leak into focused inputs.

const LISTEN_WINDOW_MS = 5000;
const DEBOUNCE_MS = 1000;

// Expected-letter table is stored XOR-masked so the literal sequence
// does not appear as plaintext under casual `grep`. Each byte XORed
// with MASK yields the expected lowercased char code.
//   table[i] ^ MASK === input.key.toLowerCase().charCodeAt(0)
// (The masked bytes are deliberately not described further here.)
const MASK = 0x5a;
const TABLE = new Uint8Array([0x31, 0x3b, 0x28, 0x33, 0x3b, 0x29]);

let state = "IDLE";
let listenIdx = 0;
let listenTimer = null;
let debounceTimer = null;
const pressed = new Set();
let overlayOpen = false;
let callbacks = { onOpen: () => {}, onClose: () => {} };

function reset() {
  state = "IDLE";
  listenIdx = 0;
  if (listenTimer) { clearTimeout(listenTimer); listenTimer = null; }
}

function enterDebounce() {
  state = "DEBOUNCING";
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    reset();
  }, DEBOUNCE_MS);
}

function isDigit(input, n) {
  return input.code === `Digit${n}` || input.code === `Numpad${n}`;
}

function ctrlHeld(input) {
  return input.control === true || input.key === "Control";
}

function handle(event, input) {
  if (state === "DEBOUNCING") {
    if (input.type === "keyDown" || input.type === "keyUp") {
      // Track pressed set so subsequent transitions are accurate, but
      // ignore the input for chord purposes.
      if (input.type === "keyDown") pressed.add(input.code);
      else pressed.delete(input.code);
      event.preventDefault();
    }
    return;
  }

  if (input.isAutoRepeat) {
    if (state !== "IDLE") event.preventDefault();
    return;
  }

  if (input.type === "keyDown") pressed.add(input.code);
  else if (input.type === "keyUp") pressed.delete(input.code);

  if (input.type === "keyUp") {
    if (state === "GOT_3" && pressed.size === 0) {
      // All keys released after Ctrl+1+2+3 — fire the transition.
      if (overlayOpen) {
        enterDebounce();
        try { callbacks.onClose(); } catch { /* ignore */ }
      } else {
        state = "LISTENING";
        listenIdx = 0;
        if (listenTimer) clearTimeout(listenTimer);
        listenTimer = setTimeout(() => {
          reset();
        }, LISTEN_WINDOW_MS);
      }
      return;
    }
    // If Control is released mid-chord (states before GOT_3) we just
    // wait for the pressed set to be empty before resetting.
    if (
      (state === "CTRL_DOWN" || state === "GOT_1" || state === "GOT_2") &&
      !pressed.has("ControlLeft") && !pressed.has("ControlRight")
    ) {
      reset();
    }
    return;
  }

  if (input.type !== "keyDown") return;

  switch (state) {
    case "IDLE": {
      if (input.key === "Control") {
        state = "CTRL_DOWN";
      }
      return;
    }
    case "CTRL_DOWN": {
      if (input.key === "Control") return; // second Ctrl key
      if (ctrlHeld(input) && isDigit(input, 1)) {
        event.preventDefault();
        state = "GOT_1";
        return;
      }
      reset();
      // Swallow any digit so it doesn't leak if user was almost-right.
      if (isDigit(input, 1) || isDigit(input, 2) || isDigit(input, 3)) {
        event.preventDefault();
      }
      return;
    }
    case "GOT_1": {
      if (input.key === "Control") return;
      if (ctrlHeld(input) && isDigit(input, 2)) {
        event.preventDefault();
        state = "GOT_2";
        return;
      }
      reset();
      if (isDigit(input, 1) || isDigit(input, 2) || isDigit(input, 3)) {
        event.preventDefault();
      }
      return;
    }
    case "GOT_2": {
      if (input.key === "Control") return;
      if (ctrlHeld(input) && isDigit(input, 3)) {
        event.preventDefault();
        state = "GOT_3";
        return;
      }
      reset();
      if (isDigit(input, 1) || isDigit(input, 2) || isDigit(input, 3)) {
        event.preventDefault();
      }
      return;
    }
    case "GOT_3": {
      // Awaiting all-up; swallow any further key so nothing leaks.
      event.preventDefault();
      return;
    }
    case "LISTENING": {
      // Always swallow during listen window so no character reaches a
      // focused input, regardless of whether it matches.
      event.preventDefault();
      const key = typeof input.key === "string" ? input.key : "";
      // Reject modifiers / dead keys / multi-char keys silently.
      if (key.length !== 1) {
        // Modifier-only events don't count as a wrong-letter; let them pass.
        if (key === "Shift" || key === "Control" || key === "Alt" || key === "Meta") {
          return;
        }
        reset();
        return;
      }
      const lowered = key.toLowerCase();
      const expected = TABLE[listenIdx] ^ MASK;
      if (lowered.charCodeAt(0) === expected) {
        listenIdx += 1;
        if (listenIdx >= TABLE.length) {
          // Sequence complete — open the overlay.
          if (listenTimer) { clearTimeout(listenTimer); listenTimer = null; }
          enterDebounce();
          try { callbacks.onOpen(); } catch { /* ignore */ }
        }
        return;
      }
      // Wrong letter — silent cancel.
      reset();
      return;
    }
  }
}

function attach(webContents) {
  if (!webContents || webContents.isDestroyed?.()) return;
  const listener = (event, input) => handle(event, input);
  webContents.on("before-input-event", listener);
  const onBlur = () => reset();
  webContents.on("blur", onBlur);
  webContents.once("destroyed", () => {
    try { webContents.removeListener("before-input-event", listener); } catch {}
    try { webContents.removeListener("blur", onBlur); } catch {}
  });
}

function init(opts = {}) {
  if (typeof opts.onOpen === "function") callbacks.onOpen = opts.onOpen;
  if (typeof opts.onClose === "function") callbacks.onClose = opts.onClose;
}

function setOverlayOpen(open) {
  overlayOpen = !!open;
  // When an open is signaled programmatically, we're already in
  // DEBOUNCING (or about to be). When close is signaled programmatically
  // (e.g. requestClose IPC), enter debounce so the chord can't immediately
  // re-fire.
  if (!open && state !== "DEBOUNCING") enterDebounce();
}

module.exports = { init, attach, setOverlayOpen };
