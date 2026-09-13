> [!CAUTION]
> **This project is deprecated and no longer maintained.**
>
> - **`2.0.3` is the final release.** It contains security fixes only. There will be no further releases.
> - The npm package [`homebridge-tp-link-powerline-mdw`](https://www.npmjs.com/package/homebridge-tp-link-powerline-mdw) is **deprecated on npm as of 13/09/2026**. Every published version carries a deprecation warning.
> - **This repository is archived and read-only.** Issues and pull requests are closed and are not being accepted. The code remains available to read and to fork.
>
> **Known unfixable vulnerability — please read.** This plugin depends on `node-tp-link-powerline` → `local-devices` → `get-ip-range`, which pulls in [`ip`](https://github.com/advisories/GHSA-2p57-rm9w-gvfp), a package with a **high-severity SSRF advisory and no patched version at any release**. It cannot be fixed from here — the fix would require the upstream chain to move off `ip` entirely. `2.0.3` raises every override floor that *can* be raised; this one cannot.
>
> A related `ip-address` advisory is also unresolvable: overriding it to a patched 10.x release breaks `get-ip-range` at runtime (`TypeError: Cannot read properties of null`), which would break device discovery — the plugin's core function. This was tested, not assumed.
>
> If you run this plugin, weigh that against your network exposure and plan to migrate away. You are welcome to fork it — the licence permits it and no permission is needed.

<p align="center">

<img src="https://github.com/EpicKris/homebridge-tp-link-powerline/raw/master/branding/logo.png" height="150">

</p>

# Homebridge TP-Link Powerline Platform Plugin

A [Homebridge](https://homebridge.io) platform plugin for TP-Link Powerline adapters. Exposes each adapter as a Wi-Fi Satellite accessory in the Home app, showing whether it is reachable (connected) or not.

> **Fork notice:** This is a modernised fork of [homebridge-tp-link-powerline](https://github.com/homebridge-plugins/homebridge-tp-link-powerline) originally created by [EpicKris](https://github.com/EpicKris). This fork adds Homebridge 2.x and Node.js 22+ support, fixes several bugs, and modernises the toolchain.

## Requirements

- **Node.js** 22.12.0 or later on Node.js 22, or Node.js 24.x
- **Homebridge** 1.6.0 or later (Homebridge 2.x supported)

## Installation

Install via the Homebridge UI, or manually:

```sh
npm install -g homebridge-tp-link-powerline-mdw
```

## Configuration

Add the platform to your Homebridge `config.json`:

```json
{
  "platform": "TpLinkPowerline",
  "name": "TP-Link Powerline",
  "devices": [
    {
      "name": "Living Room Powerline",
      "mac": "AA:BB:CC:DD:EE:FF",
      "model": "TL-PA7020",
      "serialNumber": "1234567890",
      "pollInterval": 10000
    }
  ]
}
```

### Configuration Options

| Field | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `name` | string | Yes | `TP-Link Powerline` | Platform display name |
| `devices` | array | No | `[]` | List of device overrides |
| `devices[].mac` | string | Yes | — | MAC address of the device (format `AA:BB:CC:DD:EE:FF`) |
| `devices[].name` | string | No | Auto-detected | Display name for the accessory |
| `devices[].model` | string | No | — | Device model shown in accessory details |
| `devices[].serialNumber` | string | No | — | Serial number shown in accessory details |
| `devices[].pollInterval` | integer (ms) | No | `10000` | How often to ping the device. Minimum `1000`. |

## Supported Devices

Any TP-Link Powerline adapter discoverable on the local network should work. Device discovery uses [node-tp-link-powerline](https://www.npmjs.com/package/node-tp-link-powerline), which performs a local ARP scan and ICMP ping — no cloud connection is required.

Devices found on the network that are not in your `devices` config array are logged as warnings but are still registered as accessories.

## Contributors

| Contributor | Role |
| ----------- | ---- |
| [EpicKris](https://github.com/EpicKris) | Original author |
| [MaddogWarner](https://github.com/MaddogWarner) | Modernisation, bug fixes, ESM migration |
| [Claude](https://claude.ai) (Anthropic) | Code review, implementation planning, bug identification |
| Codex (OpenAI) | Code implementation, TypeScript strict mode fixes, CI validation |

## Changelog

### 2.0.0

- Homebridge 2.x compatibility (ESM module migration)
- Node.js 22.12+ and 24.x support
- Fixed memory leak: polling interval is now stored and clearable via `destroy()`
- Fixed unhandled `error` event on TpPlc EventEmitter (prevented Node.js crash)
- Fixed duplicate pings: `getStatus` now returns cached value; only the poller calls `ping()`
- Fixed typo: `accessory.context.namee` → `accessory.context.name` (new accessories now named correctly)
- Configurable `pollInterval` per device (config schema updated)
- Updated ESLint to v9 flat config with typescript-eslint v8
- Updated TypeScript to v5 with ES2022 target and NodeNext modules
- Updated CI to test Node.js 22.x and 24.x; GitHub Actions updated to v4
