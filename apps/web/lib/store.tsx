"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ActiveMatchRef,
  AppState,
  Discipline,
  DisciplineMode,
  SubcategorySize,
} from "@karate/core";
import {
  CHANNEL_NAME,
  STORAGE_KEY,
  TIMER_OWNER_KEY,
  addParticipant as addParticipantImpl,
  buildInitialState,
  computeCombatWinner,
  computeWinner,
  finalizeMatchByRef,
  findNextMatch,
  getMatchByRef,
  getSubcategory,
  loadMatchToScoreboardImpl,
  loadState,
  rebuildAllSubcategories,
  removeParticipant as removeParticipantImpl,
  replaceParticipants as replaceParticipantsImpl,
  resetLiveScoreboard,
} from "@karate/core";
import type { Participant } from "@karate/core";

type Updater = (s: AppState) => void;

interface StoreApi {
  state: AppState;
  update: (fn: Updater) => void;
  // High-level actions
  setActiveCategory: (catId: string) => void;
  setActiveSubcategory: (catId: string, subId: string) => void;
  setActiveDiscipline: (
    catId: string,
    subId: string,
    discipline: Discipline
  ) => void;
  loadMatch: (ref: ActiveMatchRef) => void;
  advanceActiveMatch: () => void;
  resolveJury: (chosenName: string) => void;
  applyTournamentSettings: (
    size: SubcategorySize,
    mode: DisciplineMode,
    pointDiff: number
  ) => boolean;
  replaceParticipants: (list: Omit<Participant, "id">[]) => void;
  addParticipant: (p: Omit<Participant, "id">) => void;
  removeParticipant: (id: string) => void;
  resetScoreboard: () => void;
  eliminate: (side: "blue" | "red") => void;
  addPoints: (side: "blue" | "red", n: number) => void;
  setAdvantage: (side: "blue" | "red", value: boolean) => void;
  addPenalty: (side: "blue" | "red", delta: number) => void;
  adjustTimer: (deltaSeconds: number) => void;
  togglePause: () => void;
  saveAppSettings: (
    duration: number,
    keys: AppState["settings"]["keys"]
  ) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

const TAB_ID = Math.random().toString(36).slice(2);

function deepClone<T>(x: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(x)
    : JSON.parse(JSON.stringify(x));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => buildInitialState());
  const stateRef = useRef(state);
  stateRef.current = state;
  const channelRef = useRef<BroadcastChannel | null>(null);
  const prevRemainingRef = useRef<number>(state.timer.remaining);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const loaded = loadState(typeof window !== "undefined" ? window.localStorage : null);
    setState(loaded);
    stateRef.current = loaded;
  }, []);

  // BroadcastChannel + storage sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("BroadcastChannel" in window)) return;
    const ch = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = ch;
    ch.onmessage = (ev) => {
      if (!ev.data || ev.data.from === TAB_ID) return;
      setState(ev.data.state as AppState);
    };
    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== STORAGE_KEY || !ev.newValue) return;
      try {
        setState(JSON.parse(ev.newValue) as AppState);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => {
      ch.close();
      channelRef.current = null;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const publish = useCallback((next: AppState) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    channelRef.current?.postMessage({ from: TAB_ID, state: next });
  }, []);

  const update = useCallback(
    (fn: Updater) => {
      setState((prev) => {
        const next = deepClone(prev);
        fn(next);
        publish(next);
        stateRef.current = next;
        return next;
      });
    },
    [publish]
  );

  // --- Timer loop (only the tab that has claimed ownership ticks) ---
  useEffect(() => {
    const onPathChange = () => {
      if (typeof window === "undefined") return;
      if (window.location.pathname.startsWith("/private")) {
        window.localStorage.setItem(TIMER_OWNER_KEY, TAB_ID);
      }
    };
    onPathChange();
    window.addEventListener("popstate", onPathChange);
    return () => window.removeEventListener("popstate", onPathChange);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (typeof window === "undefined") return;
      if (!window.location.pathname.startsWith("/private")) return;
      if (window.localStorage.getItem(TIMER_OWNER_KEY) !== TAB_ID) return;
      const cur = stateRef.current;
      const t = cur.timer;
      if (!t.running || t.remaining <= 0) return;
      if (cur.match.discipline === "kata") return;
      update((s) => {
        const tt = s.timer;
        if (!tt.running || tt.remaining <= 0) return;
        tt.remaining = Math.max(0, tt.remaining - 1);
        if (prevRemainingRef.current > 15 && tt.remaining === 15) {
          beep(900, 0.22);
        }
        if (tt.remaining === 0) {
          tt.running = false;
          tt.finished = true;
          tripleBeep();
        }
        prevRemainingRef.current = tt.remaining;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [update]);

  // --- Action implementations ---
  const api: StoreApi = useMemo(
    () => ({
      state,
      update,
      setActiveCategory: (catId) =>
        update((s) => {
          s.tournament.activeCategoryId = catId;
        }),
      setActiveSubcategory: (catId, subId) =>
        update((s) => {
          const cat = s.tournament.categories[catId];
          if (cat) cat.activeSubcategoryId = subId;
        }),
      setActiveDiscipline: (catId, subId, discipline) =>
        update((s) => {
          const sub = getSubcategory(s, catId, subId);
          if (sub) sub.activeDiscipline = discipline;
        }),
      loadMatch: (ref) =>
        update((s) => {
          loadMatchToScoreboardImpl(s, ref);
        }),
      advanceActiveMatch: () =>
        update((s) => {
          const ref = s.match.activeMatchRef;
          if (!ref) return;
          const m = getMatchByRef(s, ref);
          if (!m || m.winner) return;
          s.match.discipline = ref.discipline;
          const threshold = s.tournament.settings.pointDifference;
          const winnerSide = computeWinner(s.match, threshold > 0 ? threshold : undefined);
          if (!winnerSide) {
            s.jury = {
              competitors: [s.match.blueName, s.match.redName],
              context: { kind: "match", ref },
            };
            return;
          }
          const winnerName =
            winnerSide === "blue" ? s.match.blueName : s.match.redName;
          const loserName =
            winnerSide === "blue" ? s.match.redName : s.match.blueName;
          finalizeMatchByRef(s, ref, winnerName, loserName, false);
          const next = findNextMatch(s, ref);
          if (next) loadMatchToScoreboardImpl(s, next);
        }),
      resolveJury: (chosenName) =>
        update((s) => {
          if (!s.jury) return;
          const j = s.jury;
          const other =
            j.competitors[0] === chosenName ? j.competitors[1] : j.competitors[0];
          const ctx = j.context;
          let searchFromRef: import("@karate/core").ActiveMatchRef | null = null;
          if (ctx.kind === "match") {
            searchFromRef = ctx.ref;
            finalizeMatchByRef(s, ctx.ref, chosenName, other, true);
          } else if (ctx.kind === "series-final") {
            const sub = getSubcategory(s, ctx.subRef.categoryId, ctx.subRef.subcategoryId);
            if (sub) {
              const tree = sub.trees[ctx.subRef.discipline] as {
                winner: string | null;
                juryDecided: boolean;
              };
              tree.winner = chosenName;
              tree.juryDecided = true;
            }
            searchFromRef = { ...ctx.subRef, path: { kind: "series", idx: 1 } };
          } else if (ctx.kind === "rr-final") {
            const sub = getSubcategory(s, ctx.subRef.categoryId, ctx.subRef.subcategoryId);
            if (sub) {
              const tree = sub.trees[ctx.subRef.discipline] as {
                winner: string | null;
                juryDecided: boolean;
              };
              tree.winner = chosenName;
              tree.juryDecided = true;
            }
            searchFromRef = { ...ctx.subRef, path: { kind: "rr", pair: "bc" } };
          }
          s.jury = null;
          if (searchFromRef) {
            const next = findNextMatch(s, searchFromRef);
            if (next) loadMatchToScoreboardImpl(s, next);
          }
        }),
      applyTournamentSettings: (size, mode, pointDiff) => {
        const cur = stateRef.current.tournament.settings;
        const structureChanged =
          cur.subcategorySize !== size || cur.disciplineMode !== mode;
        if (!structureChanged && cur.pointDifference === pointDiff) return false;
        const ok =
          !structureChanged ||
          (typeof window !== "undefined"
            ? window.confirm("This will reset all bracket progress. Continue?")
            : true);
        if (!ok) return false;
        update((s) => {
          s.tournament.settings.pointDifference = pointDiff;
          if (structureChanged) {
            s.tournament.settings.subcategorySize = size;
            s.tournament.settings.disciplineMode = mode;
            rebuildAllSubcategories(s);
            resetLiveScoreboard(s);
            s.jury = null;
          }
        });
        return true;
      },
      replaceParticipants: (list) =>
        update((s) => replaceParticipantsImpl(s, list)),
      addParticipant: (p) =>
        update((s) => addParticipantImpl(s, p)),
      removeParticipant: (id) =>
        update((s) => removeParticipantImpl(s, id)),
      resetScoreboard: () => {
        const ok =
          typeof window !== "undefined"
            ? window.confirm("Reset the scoreboard? All current values will be cleared.")
            : true;
        if (!ok) return;
        update((s) => resetLiveScoreboard(s));
      },
      eliminate: (side) => {
        const cur = stateRef.current;
        const name =
          side === "blue" ? cur.match.blueName : cur.match.redName;
        if (!name) {
          window.alert("No competitor loaded.");
          return;
        }
        const ok = window.confirm(
          `Eliminate ${name}? The opponent will advance.`
        );
        if (!ok) return;
        update((s) => {
          if (side === "blue") s.match.blueEliminated = true;
          else s.match.redEliminated = true;
          s.timer.running = false;
          const ref = s.match.activeMatchRef;
          if (ref) {
            s.match.discipline = ref.discipline;
            const threshold = s.tournament.settings.pointDifference;
            const winnerSide = computeWinner(s.match, threshold > 0 ? threshold : undefined);
            if (!winnerSide) {
              s.jury = {
                competitors: [s.match.blueName, s.match.redName],
                context: { kind: "match", ref },
              };
              return;
            }
            const winnerName =
              winnerSide === "blue" ? s.match.blueName : s.match.redName;
            const loserName =
              winnerSide === "blue" ? s.match.redName : s.match.blueName;
            finalizeMatchByRef(s, ref, winnerName, loserName, false);
            const next = findNextMatch(s, ref);
            if (next) loadMatchToScoreboardImpl(s, next);
          }
        });
      },
      addPoints: (side, n) =>
        update((s) => {
          if (side === "blue")
            s.match.bluePoints = Math.max(0, s.match.bluePoints + n);
          else s.match.redPoints = Math.max(0, s.match.redPoints + n);
          // Real-time point-difference win condition (combat only)
          const ref = s.match.activeMatchRef;
          const threshold = s.tournament.settings.pointDifference;
          if (ref && s.match.discipline === "combat" && threshold > 0) {
            const winnerSide = computeCombatWinner(s.match, threshold);
            if (winnerSide) {
              s.timer.running = false;
              const winnerName =
                winnerSide === "blue" ? s.match.blueName : s.match.redName;
              const loserName =
                winnerSide === "blue" ? s.match.redName : s.match.blueName;
              finalizeMatchByRef(s, ref, winnerName, loserName, false);
              const next = findNextMatch(s, ref);
              if (next) loadMatchToScoreboardImpl(s, next);
            }
          }
        }),
      setAdvantage: (side, value) =>
        update((s) => {
          if (side === "blue") s.match.blueAdvantage = value;
          else s.match.redAdvantage = value;
        }),
      addPenalty: (side, delta) =>
        update((s) => {
          const key = side === "blue" ? "bluePenalties" : "redPenalties";
          s.match[key] = Math.max(0, Math.min(5, s.match[key] + delta));
          if (s.match[key] === 5 && delta > 0) s.timer.running = false;
        }),
      adjustTimer: (delta) =>
        update((s) => {
          s.timer.remaining = Math.max(0, s.timer.remaining + delta);
          if (s.timer.remaining > 0) s.timer.finished = false;
        }),
      togglePause: () =>
        update((s) => {
          if (s.timer.remaining <= 0) return;
          s.timer.running = !s.timer.running;
          if (s.timer.running) s.timer.finished = false;
        }),
      saveAppSettings: (duration, keys) =>
        update((s) => {
          if (Number.isFinite(duration) && duration > 0) {
            s.settings.defaultDuration = duration;
            if (
              !s.timer.running &&
              s.timer.remaining === s.timer.duration
            ) {
              s.timer.remaining = duration;
            }
            s.timer.duration = duration;
          }
          s.settings.keys = keys;
        }),
    }),
    [state, update]
  );

  return (
    <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

// =============================================================
// Audio helpers (Web Audio API)
// =============================================================
let audioCtx: AudioContext | null = null;
function ensureAudio(): AudioContext | null {
  if (audioCtx) return audioCtx;
  try {
    const Ctor =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    audioCtx = new Ctor();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}
export function beep(freq = 800, duration = 0.18, gain = 0.18) {
  if (typeof window === "undefined") return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}
export function tripleBeep() {
  beep(900, 0.18);
  setTimeout(() => beep(900, 0.18), 250);
  setTimeout(() => beep(1200, 0.32), 500);
}
if (typeof window !== "undefined") {
  ["click", "keydown"].forEach((t) =>
    window.addEventListener(t, () => ensureAudio(), { once: true })
  );
}
