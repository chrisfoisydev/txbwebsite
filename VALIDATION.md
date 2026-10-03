# Package validation

Validated locally on October 2, 2026. Nothing was deployed to Netlify.

- Netlify CLI 27.10.2: `netlify build --offline` passed, including Edge Function bundling.
- Generated edge manifest matches `/*`, has no excluded paths, no post-cache routes, and uses `on_error: fail`.
- All 15 authentication and Netlify-adapter tests passed: login, logout, cookie signatures, expiry, cross-origin rejection, protected static/Flutter assets, rate backoff, and missing-configuration handling.
- Verified 391 published files, including the full Flutter app, paths, phone shell, and exclusions for private source/configuration.
- Browser check: password unlocks the marketing site; **Explore the app** opens the compiled Flutter app inside its scaled phone frame, with the requested notes visible.
- Editable Next.js source builds successfully with webpack and TypeScript checking.
- ZIP contents are checked for integrity and against `MANIFEST.json` SHA-256 hashes. The private `netlify.env` file is intentionally omitted from the public-facing file manifest.

Netlify account configuration and the eventual hosted URL must be checked after you deploy. Deployment steps are in `README.md`.
