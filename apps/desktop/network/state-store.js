// In-memory authoritative master state with monotonic versioning.
//
// In addition to the action reducer, this wrapper invokes the assignment
// engine after every state mutation so `state.engine.nextMatchPerArea`
// stays in sync with the bracket. Engine logic itself lives in
// `@karate/core` (see engine.ts) and is pure — this file is just glue.

const core = require("../dist-core/index.cjs");
const { applyAction, ActionRejectedError } = require("./actions");

function snapshotMatchKeys(state) {
  // Build a map of matchId → { winner, hadScore } across all subcategories
  // so we can diff before/after a reducer call and emit the right engine
  // lifecycle events (recordMatchStart / recordMatchEnd).
  const out = new Map();
  for (const catId of state.tournament.categoryOrder || []) {
    const cat = state.tournament.categories[catId];
    if (!cat) continue;
    for (const sub of cat.subcategories) {
      for (const d of Object.keys(sub.trees)) {
        const tree = sub.trees[d];
        if (!tree) continue;
        const visit = (m, ref) => {
          const id = core.matchIdFromRef(ref);
          out.set(id, {
            ref,
            winner: m.winner || null,
            // We don't track per-match scoring on master state (it lives on
            // s.match while the match is loaded), so "started" is inferred
            // from the engine's existing IN_PROGRESS status.
          });
        };
        if (sub.type === "standard") {
          for (let r = 0; r < tree.rounds.length; r++) {
            for (let i = 0; i < tree.rounds[r].length; i++) {
              visit(tree.rounds[r][i], { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "std", round: r, idx: i } });
            }
          }
          if (tree.thirdPlace) visit(tree.thirdPlace, { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "3rd" } });
        } else if (sub.type === "playin") {
          visit(tree.extra, { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "playin" } });
          for (let r = 0; r < tree.bracket.rounds.length; r++) {
            for (let i = 0; i < tree.bracket.rounds[r].length; i++) {
              visit(tree.bracket.rounds[r][i], { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "std", round: r, idx: i } });
            }
          }
        } else if (sub.type === "series") {
          for (let i = 0; i < tree.matches.length; i++) {
            visit(tree.matches[i], { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "series", idx: i } });
          }
        } else if (sub.type === "roundrobin") {
          for (const mm of tree.matches) {
            if (!mm.pair) continue;
            visit(mm, { categoryId: catId, subcategoryId: sub.id, discipline: d, path: { kind: "rr", pair: mm.pair } });
          }
        }
      }
    }
  }
  return out;
}

function diffAndEmitEngineEvents(prevMap, state, now) {
  const nextMap = snapshotMatchKeys(state);
  // Newly completed matches.
  for (const [id, after] of nextMap) {
    const before = prevMap.get(id);
    if (after.winner && (!before || !before.winner)) {
      try { core.recordMatchEnd(state, id, now); } catch {}
    }
  }
  // Newly-loaded scoreboard match → recordMatchStart for the active ref.
  const ref = state.match && state.match.activeMatchRef;
  if (ref) {
    const id = core.matchIdFromRef(ref);
    const eng = state.engine;
    if (eng && eng.matches[id] && eng.matches[id].status !== "IN_PROGRESS" && eng.matches[id].status !== "COMPLETED") {
      // Find the area this subcategory is currently assigned to (best effort).
      const areaIndex = state.tournament.areaAssignments?.[ref.subcategoryId];
      if (typeof areaIndex === "number") {
        try { core.recordMatchStart(state, id, areaIndex, now); } catch {}
      }
    }
  }
  return nextMap;
}

function tickEngine(state) {
  try {
    core.runEngineTick(state, { now: Date.now() });
  } catch (err) {
    // Engine errors must never crash the server. Log and continue.
    console.warn("[karate-engine] tick failed:", err && err.message);
  }
}

function makeStateStore(initialState) {
  let state = initialState ?? core.buildInitialState();
  let version = 1;

  // Bootstrap engine state once.
  try { core.ensureEngineState(state); core.runEngineTick(state, { now: Date.now() }); } catch {}

  return {
    getState() { return state; },
    getVersion() { return version; },
    replaceAll(next) {
      state = next;
      try { core.ensureEngineState(state); } catch {}
      tickEngine(state);
      version += 1;
      return { state, version };
    },
    apply(action) {
      const prevMap = snapshotMatchKeys(state);
      const result = applyAction(state, action);
      if (result && action.actionType === "REPLACE_STATE") {
        state = result;
        try { core.ensureEngineState(state); } catch {}
      }
      diffAndEmitEngineEvents(prevMap, state, Date.now());
      tickEngine(state);
      version += 1;
      return { state, version };
    },
    /** Run an engine tick without applying an action (used by the 30s heartbeat). */
    tickEngineOnly() {
      tickEngine(state);
      version += 1;
      return { state, version };
    },
  };
}

module.exports = { makeStateStore, ActionRejectedError };
