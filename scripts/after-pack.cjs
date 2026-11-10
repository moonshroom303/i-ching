// electron-builder afterPack hook.
// On macOS, Apple Silicon refuses to start apps without any code signature. When no Developer ID
// certificate is configured, we apply an ad-hoc signature so the app runs (users still confirm it once
// in System Settings, see README). With a real certificate (CSC_LINK / CSC_NAME) this does nothing.
'use strict';
const { execFileSync } = require('node:child_process');
const path = require('node:path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  if (process.env.CSC_LINK || process.env.CSC_NAME) return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  console.log(`  • ad-hoc signing ${appPath}`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
};
