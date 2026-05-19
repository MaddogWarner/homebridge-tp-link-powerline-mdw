# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run build      # compile TypeScript → dist/
npm run lint       # ESLint (reports warnings, no --max-warnings flag)
npm run watch      # build + homebridge -I -D via nodemon (hot-reload during dev)
```

There are no tests. `prepublishOnly` runs lint then build.

## Architecture

This is a **Homebridge Dynamic Platform Plugin** — a single npm package that registers itself with Homebridge and exposes TP-Link Powerline adapters as Wi-Fi Satellite accessories in Apple HomeKit.

### Entry point and registration

`src/index.ts` exports a default function (ESM) that calls `api.registerPlatform()`. Homebridge loads this via the `"main": "dist/index.js"` field.

### Platform lifecycle (`src/platform.ts`)

`TpLinkPowerlinePlatform` implements `DynamicPlatformPlugin`. Key lifecycle points:

- **Constructor** — filters config, registers `didFinishLaunching` and `shutdown` API events.
- **`configureAccessory()`** — called by Homebridge for each accessory restored from its cache; pushes them into `this.accessories[]`.
- **`discoverDevices()`** — fired on `didFinishLaunching`; creates a `TpPlc` instance, registers an error handler on it (cast to `EventEmitter` because the package types don't expose the `error` event), then listens for `found` events. For each discovered device it either restores a cached accessory or registers a new one, then calls `addOrReplaceAccessoryController()`.
- **`shutdown`** — iterates `this.accessoryControllers` (a `Map<uuid, TpLinkPowerlinePlatformAccessory>`) and calls `destroy()` on each to clear intervals.

`DeviceConfig` and `PowerlineDevice` interfaces are defined locally in `platform.ts` because `node-tp-link-powerline` ships no usable type declarations.

### Accessory handler (`src/platformAccessory.ts`)

`TpLinkPowerlinePlatformAccessory` is constructed once per discovered device. It:

- Reads `pollInterval` from `accessory.context.config` (default 10 000 ms, minimum 1 000 ms).
- Stores the `setInterval` return value in `this.intervalId` so `destroy()` can clear it.
- Maintains `this.lastStatus` (a `CharacteristicValue`) which is updated by the poller and returned synchronously from `getStatus()`. HomeKit's `onGet` handler never performs a live ping — only the interval does.
- Exposes the `WiFiSatellite` service with category `RANGE_EXTENDER`.

### Constants (`src/settings.ts`)

`PLATFORM_NAME = 'TpLinkPowerline'` — used in config.json and `registerPlatform`.
`PLUGIN_NAME = 'homebridge-tp-link-powerline'` — used in `registerPlatformAccessories`.

### Module system

The package is ESM (`"type": "module"`). All relative imports must use explicit `.js` extensions (NodeNext resolution). TypeScript compiles with `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`.

`node-tp-link-powerline` is a CommonJS package with no `exports` field; Node.js ESM handles the interop natively — no special shim needed.

### Key constraints

- `node-tp-link-powerline` is pinned to exact version `1.0.0` (unmaintained; pinned to prevent surprise breakage from any future publish).
- `skipLibCheck: true` in `tsconfig.json` is intentional — Homebridge 2 ships Matter declaration files that cause spurious errors.
- The `destroy()` method exists on the accessory class; Homebridge does not call it automatically. It is wired up via `api.on('shutdown', ...)` in the platform constructor.
