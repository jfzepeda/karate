// Public surface of the licensing module. Consumed by main.js and (via IPC)
// the renderer process.

const state = require("./state");
const machineFp = require("./machine-fp");
const validator = require("./validator");
const storage = require("./storage");

module.exports = {
  getMachineFingerprint: machineFp.getMachineFingerprint,
  evaluate: state.evaluate,
  activateCode: state.activate,
  clearLicense: state.clear,
  trustDynamicPublicKey: validator.trustDynamicPublicKey,
  storage,
};
