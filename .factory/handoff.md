# Color Meaning Lens — repair handoff

**Status: PASS**

**Repair commit:** `c2e5b53ccdbb62574e6b15c4600c7d34c9727fbc`
**Base / verifier report:** `01b046a0fb220925bf07ea10102fd08c258036d7`,
[verification-3.md](verification-3.md)
**Production URL:** <https://color-meaning-lens.sociobot.in/>
**Deployment:** Azure Static Web Apps production deployment
`3dd72639-0a43-4340-9516-c5f33a09d1d8`

## Repairs

1. The Chrome extension archive is now reproducible. Packaging walks files in
   lexical order, buffers each entry before appending it (so asynchronous source
   reads cannot reorder entries), pins every ZIP entry to the ZIP epoch, and
   fixes archive modes. `scripts/verify-package.mjs` changes only an input
   mtime, repackages twice, and requires identical archive SHA-256 values.
   This fixes the former P1 raw-archive identity failure.
2. The options color editor now validates every changed color before save. An
   invalid value is immediately replaced with its last valid hex value; inline
   and page-level polite status messages explain the recovery, and invalid data
   is never written. The loaded-MV3 regression creates `REVIEW/#2563EB/stripes`,
   attempts `not-a-hex`, and asserts the visible, announced, and stored recovery.
   This fixes P2.
3. `npm run build:site` prepares WXT types itself, so the deployment build is
   safe from a fresh install without relying on a prior test command.

## Verification evidence

Executed on Node `v22.23.2`, npm `10.9.8`:

```sh
npm ci
npm test
npm run build:site
npm run verify:package
npm run verify:site
npm run verify:extension
npm audit --audit-level=high
npm run verify:live
npm run build
unzip -t dist/site/downloads/color-meaning-lens-chrome.zip
```

- Clean install: 269 packages; `npm audit --audit-level=high` reported 0
  vulnerabilities.
- Typecheck and unit tests: 5/5 passed.
- Production static build, MV3 build, and standalone clean `npm run build`:
  passed. The static deploy root is `dist/site/` and retains the original
  browser-extension artifact class.
- Package consumer: `unzip -t` passed for all 15 MV3 files. The exact
  reproducible ZIP SHA-256 is
  `7518e7373f439896dfbe14cb110bf672074dfebda2773f650a47f5e286484a10`
  (22,992 B). The mtime-only regression check passed.
- Loaded Chromium extension: content injection rendered a starter mark, runtime
  toggle removed it, options showed three starter mappings, the new valid →
  invalid color recovery preserved `#2563EB` in storage and UI, and no console
  errors occurred.
- Local browser/site gate: landing, privacy, and terms have title, `lang=en`,
  exactly one `h1` and `main`, no missing image alt text, no console errors,
  and no axe serious/critical findings. At 390×844 there was 0 px overflow;
  the demo responded to keyboard Space with a 3 px focus ring; reduced motion
  reported `0s` transition and `scroll-behavior: auto`.
- Local response/PWA gate: downloadable ZIP is `application/zip` with
  attachment behavior; missing ZIP is a real 404; CSP, Permissions-Policy,
  and immutable asset caching are present. The versioned service worker
  updated after `registration.update()` and served the shell offline.
- Live gate: production has the same ZIP SHA-256, 0 px mobile overflow, working
  keyboard demo, reduced-motion/focus behavior, response policy, active service
  worker, and no normal-load origin except
  `https://color-meaning-lens.sociobot.in`. Landing, privacy, and terms again
  had no axe serious/critical findings.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP/LCP 1.0 s, TBT 20 ms, CLS 0.

## Known gaps / next steps

None. The original local-first mappings, no-canvas-read constraint, privacy
policy, supporter license behavior, visual system, and deployment class remain
unchanged.
