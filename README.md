# DLBPlusReleases

Public release-assets repository for DLBPlus Android TV. Source code lives in the private `DLBPlusFrontend` repo.

## Active release line (dlbplus.jks)

| Field | Value |
|-------|--------|
| Latest version | **1.0.6** (versionCode **7**) |
| Git tag | `v1.0.6` |
| Signing | `dlbplus.jks` |
| Primary APK asset | `app-universal-release.apk` |

The in-app updater calls GitHub `GET /repos/Daniel106379/DLBPlusReleases/releases/latest`. **Publishing `v1.0.6` on GitHub Releases makes it the live update target.**

Human-readable manifests (not read by the app today):

- `update/latest.json` — current release metadata and download URLs
- `update/archived-releases.json` — pre-1.0.0 tags marked archived/incompatible

## v1.0.6 (2026-05-18)

- Version bump for reliable in-app updates from v1.0.4 / v1.0.5 (monotonic versionCode)
- Includes sidebar/nav colour fix from v1.0.5

## v1.0.5 (2026-05-18)

- Fixed sidebar/nav colour mismatch
- Removed unwanted sidebar transparency/scrim/tint layer
- Improved consistency across light and dark themes

## v1.0.4 (2026-05-18)

- Match ARVIO-style hero provider logos with bundled SVG wordmarks
- Compact provider logo on hero row 2 after release status
- Hero row 1: genre, runtime, year, IMDb, UK age rating
- UK flatrate providers only; one logo per title; no UK broadcasters on hero

## v1.0.2 (2026-05-18)

- Fixed hero provider logo to match ARVIO-style inline layout
- Limited hero provider logos to six supported UK services
- Removed duplicate provider variants
- Fixed UK-only certification display
- Prevented details page provider-card regression

## v1.0.1 (2026-05-18)

- Fixed UK streaming provider logo on hero row 2
- Moved IMDb score to hero row 1 beside year
- Improved hero metadata layout
- Continued `dlbplus.jks` signing era

## Pre-1.0.0 releases (archived)

All `v0.4.15-dlb.*` GitHub releases used legacy signing and are **incompatible** with the 1.0.0 line. They remain on GitHub for history only. Users must **uninstall and install** `v1.0.0` (or sideload the new APK); in-place update from legacy builds is not supported.

## Publish checklist

1. Build from `DLBPlusFrontend` at `versionName=1.0.6`, `versionCode=7` with `dlbplus.jks`.
2. Create GitHub Release tag **`v1.0.6`** (must be newer than any archived tag for the updater).
3. Upload at minimum **`app-universal-release.apk`** (optional per-ABI splits).
4. Do **not** commit APK binaries to this git repo; assets live on GitHub Releases only.
