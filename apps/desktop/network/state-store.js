// In-memory authoritative master state with monotonic versioning.

const core = require("../dist-core/index.cjs");
const { applyAction, ActionRejectedError, handlers } = require("./actions");

function makeStateStore(initialState) {
  let state = initialState ?? core.buildInitialState();
  let version = 1;

  return {
    getState() { return state; },
    getVersion() { return version; },
    replaceAll(next) {
      state = next;
      version += 1;
      return { state, version };
    },
    apply(action) {
      const result = applyAction(state, action);
      if (result && action.actionType === "REPLACE_STATE") {
        state = result;
      }
      version += 1;
      return { state, version };
    },
  };
}

module.exports = { makeStateStore, ActionRejectedError, handlers };
