// electron-builder afterPack hook — flips the security fuses on the packaged
// Electron binary. Run AFTER any code signing or the signature will be
// invalidated and `OnlyLoadAppFromAsar` will reject the bundle.
//
// Reference: https://www.electronjs.org/docs/latest/tutorial/fuses

const path = require("node:path");
const { flipFuses, FuseV1Options, FuseVersion } = require("@electron/fuses");

exports.default = async function applyFuses(context) {
  const { appOutDir, packager, electronPlatformName } = context;
  const exeName = packager.appInfo.productFilename;
  const ext = electronPlatformName === "darwin" ? ".app"
            : electronPlatformName === "win32"  ? ".exe"
            : "";
  const electronBinaryPath = path.join(appOutDir, exeName + ext);
  await flipFuses(electronBinaryPath, {
    version: FuseVersion.V1,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
  });
};
