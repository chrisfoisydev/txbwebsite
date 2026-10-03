# treXis × BECU — Netlify package

This package contains the current interactive website, the compiled Flutter web app, the responsive 402 × 875 phone frame with 20px corners, the app notes and designer credits, and server-side password protection. The password remains **BECUDBT**.

## Upload to Netlify

Use the Netlify CLI or a Git-connected Netlify project. **Do not drop only the `site` folder into Netlify Drop:** that uploads the static files without the Edge Function that enforces the password.

1. Unzip the package. Open PowerShell or Terminal inside `netlify-package` (the folder containing `netlify.toml`). Install Node.js 22.13 or newer if needed.
2. Install the Netlify CLI and sign in:

   ```powershell
   npm install -g netlify-cli
   netlify login
   ```

3. Create an empty Netlify project and link this folder:

   ```powershell
   netlify sites:create
   netlify link
   ```

   Select the project you just created. If you already have a Netlify project, skip `sites:create` and link that project instead.

4. Import the included private password configuration:

   ```powershell
   netlify env:import netlify.env
   ```

   In Netlify's environment-variable settings, ensure both `SITE_PASSWORD_HASH` and `SITE_SESSION_SECRET` apply to **all deploy contexts** and include the **Functions** scope. These values must be set in Netlify, not in `netlify.toml`.

5. Create a draft deployment:

   ```powershell
   netlify deploy
   ```

   Open its URL, enter BECUDBT, and check both the story and **Explore the app**. Confirm `/app/flutter/main.dart.js` is blocked in a signed-out browser. When ready to publish:

   ```powershell
   netlify deploy --prod
   ```

The configuration publishes only `site/` and deploys the access Edge Function separately. All marketing and Flutter files are included; no Cloudflare bucket or ChatGPT hosting connection is required. No Flutter rebuild is needed for this initial upload.

## Git deployment alternative

Commit the extracted package to a private repository, honoring `.gitignore`. Connect it to Netlify with the package root as the base directory, build command `node scripts/verify.mjs`, and publish directory `site`. Before publishing, import the two values from `netlify.env` into Netlify's environment settings as described above. Keep `netlify.env` out of Git and out of `site/`.

## What is included

| Path | Contents |
| --- | --- |
| `site/` | Ready-built marketing website, logos, and screenshots |
| `site/app/index.html` | Responsive phone frame and notes outside Flutter |
| `site/app/flutter/` | Complete compiled Flutter Web app and bundled assets |
| `netlify/edge-functions/access.js` | Password enforcement for every request |
| `netlify/lib/` | Password form, password verification, and signed session handling |
| `netlify.env` | Fresh credentials for this deployment; keep private |
| `source/` | Editable Next.js website source, original dependency lockfile, and phone shell |
| `scripts/`, `tests/` | Package verification, local preview, and access tests |

The Flutter build is the current demonstration build with sample data; it is not connected to live banking accounts. Its Flutter renderer can load from Google's `gstatic.com` CDN. The editable Flutter/Dart repository is not duplicated here; the complete compiled web build is included for hosting.

## Preview locally

From the package root, with Node.js installed:

```powershell
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:5182/` and use BECUDBT. This local preview exercises the same access handler; it does not deploy anything. For Netlify's own runtime preview after linking, use `netlify dev` with the imported environment variables.

## Make future updates

To edit the marketing website, change files in `source/app`, `source/components`, or `source/public`. Then run from the package root:

```powershell
npm --prefix source ci
npm --prefix source run build
npm run sync
npm test
netlify deploy
```

Edit `source/build/flutter-shell.html` for the phone frame or notes. After an initial source build, `npm run sync` copies that shell and the website output into `site/`, preserving the Flutter build. To change only the shell before rebuilding the website, copy it to `site/app/index.html`.

For future Flutter updates, build the app from its own repository with base href `/app/flutter/`, replace the contents of `site/app/flutter/` with that web build, and redeploy. Preserve the demo configuration unless deliberately connecting real services.

## Access and troubleshooting

- Sessions last up to eight hours. **Lock site** clears the browser's access cookie.
- The imported hash and signing secret are fresh for this package. Existing ChatGPT-site cookies do not unlock this Netlify site.
- A “Private preview is not configured” response means the runtime environment variables are missing or have the wrong scope/context. Correct them and redeploy.
- Keep Netlify Split Testing disabled for this project; it can bypass Edge Functions. Do not change the access function to `onError: 'bypass'` or enable edge-response caching.
- This export retains the custom password gate. Any owner-only access supplied by the previous hosting platform is not transferred.
- This package is prepared for deployment; no Netlify project has been created or published on your behalf.

If Netlify's Deno bundler reports `UnknownIssuer` on a managed Windows computer, use the installed Windows certificate trust store before rerunning the command:

```powershell
$env:DENO_TLS_CA_STORE = "system"
netlify deploy
```

This keeps certificate verification enabled. It was needed for the local validation on this computer.

## Netlify references

- [Deploying files and Edge Functions with the CLI](https://cli.netlify.com/commands/deploy/)
- [Edge Functions setup](https://docs.netlify.com/build/edge-functions/get-started/)
- [Importing environment variables](https://cli.netlify.com/commands/env/)
- [Edge Function environment variables and scopes](https://docs.netlify.com/build/edge-functions/environment-variables/)
- [Edge Function limitations](https://docs.netlify.com/build/edge-functions/limits/)
