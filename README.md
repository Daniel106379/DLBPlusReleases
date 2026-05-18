# DLBPlusReleases

Public release-assets repository for DLBPlus Android TV. Source code lives in the private `DLBPlusFrontend` repo.

## Active release line (dlbplus.jks)

| Field | Value |
|-------|--------|
| Latest version | **1.0.0** (versionCode **1**) |
| Git tag | `v1.0.0` |
| Signing | `dlbplus.jks` |
| Primary APK asset | `app-universal-release.apk` |

The in-app updater calls GitHub `GET /repos/Daniel106379/DLBPlusReleases/releases/latest`. **Publishing `v1.0.0` on GitHub Releases makes it the live update target.**

Human-readable manifests (not read by the app today):

- `update/latest.json` — current release metadata and download URLs
- `update/archived-releases.json` — pre-1.0.0 tags marked archived/incompatible

## Pre-1.0.0 releases (archived)

All `v0.4.15-dlb.*` GitHub releases used legacy signing and are **incompatible** with the 1.0.0 line. They remain on GitHub for history only. Users must **uninstall and install** `v1.0.0` (or sideload the new APK); in-place update from legacy builds is not supported.

## Publish checklist

1. Build from `DLBPlusFrontend` at `versionName=1.0.0`, `versionCode=1` with `dlbplus.jks`.
2. Create GitHub Release tag **`v1.0.0`** (must be newer than any archived tag for the updater).
3. Upload at minimum **`app-universal-release.apk`** (optional per-ABI splits).
4. Do **not** commit APK binaries to this git repo; assets live on GitHub Releases only.
