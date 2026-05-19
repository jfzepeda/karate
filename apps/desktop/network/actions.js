// Server-side action reducer. Each ACTION received from a client is
// validated and applied here on the authoritative master state. The
// renderer's store dispatch goes through these same envelopes so
// behavior matches between standalone and networked modes.

const core = require("../dist-core/index.cjs");

class ActionRejectedError extends Error {
  constructor(reason, message) {
    super(message || reason);
    this.reason = reason;
  }
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function checkCombatWin(s) {
  const ref = s.match.activeMatchRef;
  if (!ref) return;
  const threshold = s.tournament.settings.pointDifference ?? 0;
  if (s.match.discipline === "combat" && threshold > 0) {
    const winnerSide = core.computeCombatWinner(s.match, threshold);
    if (winnerSide) {
      s.timer.running = false;
      const winnerName =
        winnerSide === "blue" ? s.match.blueName : s.match.redName;
      const loserName =
        winnerSide === "blue" ? s.match.redName : s.match.blueName;
      core.finalizeMatchByRef(s, ref, winnerName, loserName, false);
      const next = core.findNextMatch(s, ref);
      if (next) core.loadMatchToScoreboardImpl(s, next);
    }
  }
}

const handlers = {
  SCORE_POINT(s, { side, n }) {
    if (side !== "blue" && side !== "red") {
      throw new ActionRejectedError("invalid", "bad side");
    }
    if (typeof n !== "number" || !Number.isFinite(n)) {
      throw new ActionRejectedError("invalid", "bad n");
    }
    const key = side === "blue" ? "bluePoints" : "redPoints";
    s.match[key] = Math.max(0, s.match[key] + n);
    checkCombatWin(s);
  },
  ADD_PENALTY(s, { side, delta }) {
    const key = side === "blue" ? "bluePenalties" : "redPenalties";
    s.match[key] = clamp(s.match[key] + delta, 0, 5);
    if (s.match[key] === 5 && delta > 0) s.timer.running = false;
  },
  SET_ADVANTAGE(s, { side, value }) {
    if (side === "blue") s.match.blueAdvantage = !!value;
    else s.match.redAdvantage = !!value;
  },
  TIMER_TOGGLE(s) {
    if (s.timer.remaining <= 0) return;
    s.timer.running = !s.timer.running;
    if (s.timer.running) s.timer.finished = false;
  },
  TIMER_ADJUST(s, { delta }) {
    s.timer.remaining = Math.max(0, s.timer.remaining + delta);
    if (s.timer.remaining > 0) s.timer.finished = false;
  },
  RESET_SCOREBOARD(s) {
    core.resetLiveScoreboard(s);
  },
  SELECT_MATCH(s, { ref }) {
    if (!ref) throw new ActionRejectedError("invalid", "missing ref");
    core.loadMatchToScoreboardImpl(s, ref);
  },
  ADVANCE_WINNER(s, payload) {
    // The client may pass a `ref` (for machines that hold match-selection
    // locally and never broadcast a SELECT_MATCH). Fall back to the
    // server's currently-loaded match if the caller didn't provide one.
    const ref = (payload && payload.ref) || s.match.activeMatchRef;
    if (!ref) return;
    // Ensure scoreboard names line up with the requested ref so the
    // existing checkCombatWin / computeWinner logic works correctly even
    // when the operator's machine had a local-only selection.
    if (!s.match.activeMatchRef || core.matchIdFromRef(s.match.activeMatchRef) !== core.matchIdFromRef(ref)) {
      core.loadMatchToScoreboardImpl(s, ref);
    }
    const m = core.getMatchByRef(s, ref);
    if (!m || m.winner) return;
    s.match.discipline = ref.discipline;
    const threshold = s.tournament.settings.pointDifference ?? 0;
    const winnerSide = core.computeWinner(
      s.match,
      threshold > 0 ? threshold : undefined,
    );
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
    core.finalizeMatchByRef(s, ref, winnerName, loserName, false);
    const next = core.findNextMatch(s, ref);
    if (next) core.loadMatchToScoreboardImpl(s, next);
  },
  ELIMINATE(s, { side, ref: refArg }) {
    if (side === "blue") s.match.blueEliminated = true;
    else s.match.redEliminated = true;
    s.timer.running = false;
    const ref = refArg || s.match.activeMatchRef;
    if (!ref) return;
    if (!s.match.activeMatchRef || core.matchIdFromRef(s.match.activeMatchRef) !== core.matchIdFromRef(ref)) {
      core.loadMatchToScoreboardImpl(s, ref);
      if (side === "blue") s.match.blueEliminated = true;
      else s.match.redEliminated = true;
    }
    s.match.discipline = ref.discipline;
    const threshold = s.tournament.settings.pointDifference ?? 0;
    const winnerSide = core.computeWinner(
      s.match,
      threshold > 0 ? threshold : undefined,
    );
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
    core.finalizeMatchByRef(s, ref, winnerName, loserName, false);
    const next = core.findNextMatch(s, ref);
    if (next) core.loadMatchToScoreboardImpl(s, next);
  },
  SET_ACTIVE_CATEGORY(s, { catId }) {
    s.tournament.activeCategoryId = catId;
  },
  SET_ACTIVE_SUBCATEGORY(s, { catId, subId }) {
    const cat = s.tournament.categories[catId];
    if (cat) cat.activeSubcategoryId = subId;
  },
  SET_ACTIVE_DISCIPLINE(s, { catId, subId, discipline }) {
    const sub = core.getSubcategory(s, catId, subId);
    if (sub) sub.activeDiscipline = discipline;
  },
  RESOLVE_JURY(s, { chosenName }) {
    if (!s.jury) return;
    const j = s.jury;
    const other =
      j.competitors[0] === chosenName ? j.competitors[1] : j.competitors[0];
    const ctx = j.context;
    let searchFromRef = null;
    if (ctx.kind === "match") {
      searchFromRef = ctx.ref;
      core.finalizeMatchByRef(s, ctx.ref, chosenName, other, true);
    } else if (ctx.kind === "series-final") {
      const sub = core.getSubcategory(s, ctx.subRef.categoryId, ctx.subRef.subcategoryId);
      if (sub) {
        const tree = sub.trees[ctx.subRef.discipline];
        tree.winner = chosenName;
        tree.juryDecided = true;
      }
      searchFromRef = { ...ctx.subRef, path: { kind: "series", idx: 1 } };
    } else if (ctx.kind === "rr-final") {
      const sub = core.getSubcategory(s, ctx.subRef.categoryId, ctx.subRef.subcategoryId);
      if (sub) {
        const tree = sub.trees[ctx.subRef.discipline];
        tree.winner = chosenName;
        tree.juryDecided = true;
      }
      searchFromRef = { ...ctx.subRef, path: { kind: "rr", pair: "bc" } };
    }
    s.jury = null;
    if (searchFromRef) {
      const next = core.findNextMatch(s, searchFromRef);
      if (next) core.loadMatchToScoreboardImpl(s, next);
    }
  },
  REPLACE_STATE(s, { state }) {
    // Wholesale replacement used by complex superadmin operations
    // (apply settings, reseed, mock load, participant edits, etc.).
    // The renderer computes the new state locally and asks the server
    // to authoritatively adopt it. Only honored from the local
    // superadmin overlay path; the server-side gate is enforced by
    // the IPC entrypoint not by this reducer.
    if (!state || typeof state !== "object") {
      throw new ActionRejectedError("invalid", "missing state");
    }
    return state; // caller will swap reference
  },
};

function applyAction(state, action) {
  const fn = handlers[action.actionType];
  if (!fn) {
    throw new ActionRejectedError("invalid", `unknown action ${action.actionType}`);
  }
  const result = fn(state, action.payload || {});
  return result === undefined ? null : result;
}

module.exports = { applyAction, ActionRejectedError, handlers };
