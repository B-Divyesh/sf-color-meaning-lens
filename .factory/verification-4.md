# Independent verification 4 — Color Meaning Lens

**Verdict: PASS**

- **Candidate commit:** `317f385ecc9ff4fc2639358441a742cb00e8dce2`
- **Repository / branch:** `B-Divyesh/sf-color-meaning-lens`, `main`
- **Verified production URL:** <https://color-meaning-lens.sociobot.in/>
- **Date:** 2026-08-28
- **Environment:** Node `v22.23.2`, npm `10.9.8`, Chromium via Playwright
  `1.58.2`

This was a fresh independent verification from a clean candidate checkout. No
product source files were changed.

## Build and automated gates

```sh
npm ci
npm test
npm run build:site
npm run verify:package
npm run verify:site
npm run verify:extension
npm audit --audit-level=high
npm run build
npm run verify:live
unzip -t dist/site/downloads/color-meaning-lens-chrome.zip
```

All commands passed.

- `npm ci` installed 269 packages; `npm audit --audit-level=high` found 0
  vulnerabilities.
- `npm test` runs WXT preparation, `tsc --noEmit`, and Vitest: 5/5 tests
  passed. There is no separate lint script in `package.json`.
- The exact production build completed from the clean install and produced
  `dist/site/` plus the MV3 package. The ZIP integrity check passed for all 15
  entries.
- Reproducible package verification passed. The browser extension archive is
  22,992 B and SHA-256
  `7518e7373f439896dfbe14cb110bf672074dfebda2773f650a47f5e286484a10`.
- Static package budget is comfortably met: landing initial JS is 3,213 B raw
  (`home` + module preload), landing CSS is 9,880 B raw, and the entire built
  extension is 40.96 KB raw. The mobile hero AVIF is 6,415 B (the largest
  shipped raster is 150,998 B WebP, below the 300 KB budget).

## End-to-end extension evidence

Loaded the built `dist/extension/chrome-mv3` into Chromium against a local
status test bench.

- Starter PASS/WARN/FAIL mappings rendered over matching status controls.
- The runtime toggle removed all marks; the packaged command registers
  `Alt+Shift+L` for `toggle-lens`.
- The options page showed the three starter mappings. A valid custom mapping
  (`REVIEW`, `#2563EB`, stripes) was saved. Replacing that color with
  `not-a-hex` restored `#2563EB`, showed the polite recovery text, and did not
  save invalid data.
- Independently exercised the actual popup-initiated picker flow: chose
  “Pick a page element,” sampled a `#2563EB` element, used keyboard input to
  save `REVIEW` / `?` / stripes, verified local extension storage and the
  resulting overlay, then pressed Escape during a subsequent element pick.
  The cancelled pick left the existing three marks intact.
- The extension content page, options, and popup had no captured console or
  page errors. Axe found no serious or critical WCAG 2/2.1 A/AA findings in
  options or popup.

Boundary behavior is covered by the passing color tests: 3-digit hex expands
to canonical 6-digit uppercase, 6-digit input normalizes, invalid hex is
rejected, transparent CSS colors are ignored, and out-of-tolerance colors get
no mapping.

## Site, accessibility, privacy, and PWA evidence

The local and live browser gates checked `/`, `/privacy/`, and `/terms/`.

- Every page has a title, `lang="en"`, exactly one `h1`, one `main`, and no
  image missing `alt`. Axe found no serious/critical violations; no console
  errors were captured.
- At 390×844 there is 0 px horizontal overflow. Keyboard Space toggles the
  demo; focus outline is 3 px. With reduced motion, transition duration is
  `0s` and document scrolling is `auto`.
- Normal live page loading made requests only to
  `https://color-meaning-lens.sociobot.in`. Source inspection found no canvas
  pixel-read API or third-party script/font; mappings use extension-local
  storage. The only billing API code is a user-initiated license verification,
  permitted by CSP and described in the privacy page.
- The production response sets CSP, Permissions-Policy, `X-Frame-Options:
  DENY`, `X-Content-Type-Options: nosniff`, and strict-origin referrer policy.
  Hashed assets are `public, max-age=31536000, immutable`; `sw.js` is
  `no-cache`; the ZIP is served as `application/zip` with `attachment`.
- The local PWA check proved a versioned service worker takes control after
  `registration.update()` and serves the shell on offline reload. The live
  site registered and controlled its service worker.

## Deployment identity

`npm run verify:live` compared the live downloadable ZIP to the freshly built
candidate and found the exact SHA-256 above. An additional byte comparison of
all 18 deployable `dist/site` files found **0 mismatches**. The sole excluded
file, `staticwebapp.config.json`, is deployment configuration and is correctly
not served as a public artifact.

## Defects

None found. No blocker, critical, high, medium, or low severity acceptance
defects were identified.
