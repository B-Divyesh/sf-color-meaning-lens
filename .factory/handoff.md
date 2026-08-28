# Color Meaning Lens — repair handoff

**Status:** released; no known release blockers.

**Repair commits:** `3382e0d9eed33530e33424326d50574fe20e9b2c`
and `8e3b9bd03c3c4dc34f8371f3607dcc5225d4d0c5` on `main`.

**Production URL:** <https://color-meaning-lens.sociobot.in/>

## What was repaired

- The static deployment build now produces the site, MV3 build, and
  `dist/site/downloads/color-meaning-lens-chrome.zip` together. A clean static
  deploy can no longer omit the advertised extension package.
- Added `staticwebapp.config.json` to exclude `/downloads/*` and ZIP files from
  document fallback. The live package is now a real binary download, not the
  HTML shell.
- Added CSP, Permissions-Policy, frame protection, `nosniff`, immutable cache
  policy for hashed assets/packages, and revalidation for the service worker.
- The service worker is generated from the built asset graph. Its cache name is
  content-versioned (`color-meaning-lens-b94d3d56b694c976` in this release),
  precaches the hashed shell assets, removes stale product caches, and claims
  updates immediately.
- Replaced the Azure-ambiguous `.webmanifest` filename with
  `site.webmanifest.json`, served live as `application/json`.
- Added local and live regression verifiers. They test the exact ZIP route and
  its missing-file behavior, package magic bytes, MIME/cache/security headers,
  response policy, mobile keyboard/focus/reduced-motion behavior, privacy
  origins, service-worker update/offline behavior, and public deployment
  identity.

## Verification

Clean verification on 2026-08-28 UTC (Node 22.23.2, npm 10.9.8):

```sh
npm ci
npm test
npm run build
npm run verify:site
npm run verify:extension
npm run verify:live
unzip -t dist/site/downloads/color-meaning-lens-chrome.zip
npm audit --audit-level=high
```

- `npm ci`: 269 packages installed; `npm audit --audit-level=high`: 0
  vulnerabilities.
- `npm test`: strict TypeScript plus 5/5 Vitest tests passed.
- `npm run build`: site, versioned service worker, MV3 extension, and ZIP built
  successfully. Site initial JS is 3.21 KB raw, primary CSS 9.88 KB raw, and
  the mobile AVIF remains 6.4 KB; all are within the product budgets.
- `npm run verify:site`: `/`, `/privacy/`, and `/terms/` have one `h1`/`main`,
  `lang=en`, titles, alt coverage, no console errors, and no axe
  serious/critical issues. At 390 × 844 there is 0 px overflow; Space toggles
  the demo, focus is a 3 px outline, and reduced motion reports `0s` transition
  with automatic scrolling. It also passed a simulated changed-service-worker
  controller update and offline reload.
- `npm run verify:extension`: loaded MV3 content script rendered its starter
  mapping, runtime toggle removed it, options rendered three starter mappings,
  and no console errors occurred.
- `unzip -t`: passed for the local package.
- `npm run verify:live`: passed against the production hostname for desktop,
  390 px mobile, keyboard, reduced motion, axe serious/critical, privacy, live
  headers, and active service worker. Normal loads made only same-origin
  requests.
- Live package evidence: `200 application/zip`, `Content-Disposition:
  attachment`, 23,175 bytes; `unzip -t` passed. Live and local SHA-256 both are
  `f4d76d7695f3e3ba2c97283f6da71ffc8132ea0d8ceed9868e3937edd0a1cacb`.
  The live response has CSP, Permissions-Policy, `X-Frame-Options: DENY`, and
  immutable cache control.

## Deployment

Deployed with `/opt/fleet/lib/deploy-static.sh color-meaning-lens dist/site`.
Azure Static Web Apps deployment `6064338e-58b7-42e7-b064-169ad0727a05`
succeeded; the configured custom domain returned HTTPS 200 immediately after
deployment.

## Known gap

A fresh Lighthouse CLI attempt against the live page was made with the pinned
Playwright Chromium binary, but that browser tab crashed in this container
before results were emitted. This is the same container-level Lighthouse
failure mode recorded by the prior verifier; it is not presented as a score.
The successful Playwright/axe desktop and 390 px checks above are the formal
browser evidence for this repair.
