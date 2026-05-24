# Changelog

> **Package rename:** This package is published on npm as `homebridge-tp-link-powerline-mdw`. The GitHub repository is [MaddogWarner/homebridge-tp-link-powerline-mdw](https://github.com/MaddogWarner/homebridge-tp-link-powerline-mdw).

## [2.0.0] - 2026-05-19

### Breaking Changes

- **Node.js 22.12+ or 24.x required.** Node.js 10, 12, 14, 15, 18, 20, and odd-numbered Node.js releases are no longer supported.
- **Homebridge 1.6.0+ required.** Minimum Homebridge version raised from 1.4.1 to 1.6.0.
- **Homebridge 2.x supported.** Plugin migrated to ESM (`"type": "module"`) to be compatible with Homebridge 2.x, which is ESM-only. Node.js 22.12+ or 24.x is required when running under Homebridge 2.x.
- **`betaVersion` field removed from `package.json`.** Beta publishing workflow simplified; the `prerelease.js` script is no longer called during CI.

### Bug Fixes

- **Critical — accessory naming typo:** `accessory.context.namee` corrected to `accessory.context.name` in `src/platform.ts`. New accessories were being registered with no name due to this typo. ([`src/platform.ts`](src/platform.ts))
- **High — memory leak:** `setInterval()` in `TpLinkPowerlinePlatformAccessory` was never cleared. The interval ID is now stored as `this.intervalId`, a `destroy()` method has been added, accessory controllers are tracked by UUID, and all active controllers are destroyed on Homebridge shutdown. ([`src/platform.ts`](src/platform.ts), [`src/platformAccessory.ts`](src/platformAccessory.ts))
- **High — unhandled error event:** `TpPlc` (EventEmitter) had no `error` event listener. An unhandled `error` event crashes the Node.js process. An `error` handler is now registered immediately after instantiation in `discoverDevices()`. ([`src/platform.ts`](src/platform.ts))
- **Medium — duplicate concurrent pings:** `getStatus()` (called by HomeKit on demand) was performing a live `device.ping()` at the same time as the 10-second polling interval. `getStatus()` now returns the last cached status value (`this.lastStatus`) immediately, eliminating concurrent network calls and preventing HomeKit timeouts. ([`src/platformAccessory.ts`](src/platformAccessory.ts))
- **Low — description typo:** `"Homebridgee TP-Link Powerline."` corrected to `"Homebridge TP-Link Powerline."` in `package.json`.
- **Low — stale lockfile:** `package-lock.json` regenerated so it matches package version `2.0.0`, the updated dependency set, and the current Node.js/Homebridge engine constraints.
- **Low — accidental dependency:** Removed an unintended `"24"` dependency that was introduced while selecting a Node.js version for local validation.

### New Features

- **Configurable poll interval:** Each device now accepts an optional `pollInterval` field (integer, milliseconds, minimum 1000, default 10000) in the Homebridge config. This controls how often the plugin pings the device to update its status. ([`config.schema.json`](config.schema.json), [`src/platformAccessory.ts`](src/platformAccessory.ts))

### ESM Migration

- `"type": "module"` added to `package.json`.
- Entry point changed from `export = (api) => {}` to `export default (api): void => {}` in `src/index.ts`.
- All relative imports updated to use explicit `.js` extensions, as required by NodeNext module resolution (e.g. `'./platform'` → `'./platform.js'`).

### TypeScript

- **Target upgraded:** `ES2018` → `ES2022`.
- **Module system:** `"commonjs"` → `"NodeNext"` with `"moduleResolution": "NodeNext"`.
- **Lib simplified:** `["es2015","es2016","es2017","es2018"]` → `["ES2022"]`.
- **Strict mode enforced:** Removed `"noImplicitAny": false` override which was contradicting `"strict": true`. Strict mode is now fully applied.
- **Strict build fixes:** Added explicit device/config interfaces, moved Homebridge `Service` and `Characteristic` initialisation into the constructor, and safely attached the `TpPlc` `error` listener through `EventEmitter` because `node-tp-link-powerline` only types the `found` event.
- **Third-party declaration handling:** Added `"skipLibCheck": true` to avoid build failures from Homebridge 2 Matter declaration files that are outside this plugin's source control.
- **TypeScript version:** `^4.2.2` → `^5.0.0`.
- `@types/node`: `^14.14.31` → `^22.0.0`.

### ESLint

- Migrated from legacy `.eslintrc` format to ESLint 9 flat config (`eslint.config.mjs`).
- **ESLint version:** `^7.21.0` → `^9.0.0`.
- Replaced `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` (both `^4.x`) with unified `typescript-eslint` `^8.0.0`.
- Lint script updated from `eslint src/**.ts --max-warnings=0` to `eslint src/` (flat config handles file extensions).
- `.eslintrc` should be deleted manually — ESLint 9 ignores it when `eslint.config.mjs` is present.

### Dependencies

- `node-tp-link-powerline`: range `^1.0.0` pinned to exact `1.0.0` — this package is unmaintained and pinning prevents unexpected breaking changes from a future publish.
- Removed `rimraf` devDependency; build script now uses `rm -rf ./dist` directly.
- Removed `@types/ping` devDependency (not used directly in source).
- `nodemon`: `^2.0.7` → `^3.0.0`.
- `ts-node`: `^9.1.1` → `^10.9.0`.
- `homebridge` (devDependency): `^1.4.1` → `^2.0.0`.

### Config Schema

- Added `"additionalProperties": false` to device items to reject unknown fields in the Homebridge UI.
- Added `pollInterval` property to device items (integer, default 10000, minimum 1000).

### CI / GitHub Actions

- **Node.js matrix** updated from `[10.x, 12.x, 13.x, 14.x, 15.x]` to `[22.x, 24.x]` across all workflows.
- `actions/checkout` updated from `v2` to `v4`.
- `actions/setup-node` updated from `v1` to `v4`.
- `github/codeql-action/*` updated from `v1` to `v3`.
- `npm install` replaced with `npm ci` in `build.yml` for reproducible installs.
- Publish step in `nodejs.yml` now uses `node-version: 24.x` (was `node-version: 10`).
- Beta publish step in `nodejs-beta.yml` now uses `node-version: 24.x`.
- Beta workflow (`nodejs-beta.yml`): removed the `prerelease.js` script call (which depended on the now-removed `betaVersion` field).
- `prerelease.js` renamed to `prerelease.cjs` — with `"type": "module"` in `package.json`, `.js` files are treated as ESM; the script uses CommonJS `require()` and must use the `.cjs` extension.

### Documentation

- `README.md` expanded with requirements, installation instructions, configuration JSON example, full config options table, supported devices note, and this changelog.
- Requirements updated to state Node.js 22.12+ or 24.x, matching current Homebridge 2 engine support.

### Validation

- `npm run lint` passes.
- `npm run build` passes and emits `dist/` output.
- Local validation was performed from a Node.js 26 shell, which produces expected engine warnings because Homebridge 2 supports Node.js 22 and 24. Final release validation should be performed under Node.js 22.12+ or 24.x.

### Manual Steps Required After Upgrade

1. Delete `.eslintrc` (legacy file, now superseded by `eslint.config.mjs`).
2. Delete `.github/workflows/prerelease.js` (replaced by `prerelease.cjs`).
3. Re-run `npm run lint` and `npm run build` under Node.js 22.12+ or 24.x before release.
