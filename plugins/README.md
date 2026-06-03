# DLBPlus plugin manifests (public)

Paste these URLs in the app under **Settings → Plugins → Add repository**.

| Repo | URL |
|------|-----|
| **English minimal** (recommended) | `https://raw.githubusercontent.com/Daniel106379/DLBPlusReleases/main/plugins/dlbplus-english-minimal/manifest.json` |
| **Custom slot** (minimal + your JS) | `https://raw.githubusercontent.com/Daniel106379/DLBPlusReleases/main/plugins/dlbplus-custom/manifest.json` |

To add your own site: edit `plugins/dlbplus-custom/providers/my-scraper.js`, set `"enabled": true` in `dlbplus-custom/manifest.json`, bump `version`, push, then **Refresh repository** in the app.

Source copies and template: private `DLBPlusFrontend` repo under `plugins/`.
