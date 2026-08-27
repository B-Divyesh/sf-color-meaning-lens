# Color Meaning Lens — independent QA handoff

## FAIL — public deployment does not meet acceptance

**Verified candidate:** `8232e074ca5240f8d1ba2d6a5126509f6513d55d`
**Required URL:** `https://color-meaning-lens.sociobot.in/`
**Date:** 2026-08-27 UTC

The candidate artifact passed local install, unit/type checks, exact production
build, site/extension Playwright smoke tests, axe serious/critical checks,
390px mobile checks, focus/reduced-motion checks, PWA update plus offline
reload, privacy/request inspection, and bundle budgets. It is **not releasable**
because the mandatory public URL is unavailable and does not serve this
candidate.

### Blocking deployment defect

- Normal Chromium navigation fails with `net::ERR_CERT_COMMON_NAME_INVALID`.
  The certificate is for Azure `*.msha-slice-7-eus2-1-ase.p.azurewebsites.net`,
  not `color-meaning-lens.sociobot.in`.
- Diagnostic `curl -k` returned `404 Site Not Found` for `/` (2,667 B; SHA-256
  `1e0878f232e32cf44e87ba00bd6957c1ebdfc9bc7c1c0a1389f8c62e6ae3311a`), while
  local candidate `dist/site/index.html` is 8,158 B (SHA-256
  `f39b3503e9a3eda8c59c38f93cda569340bcf43e289b0ab878d424c72b829fd0`).
  The candidate hashed JS asset and `/sw.js` are also 404; only `/privacy/`
  returned 200, indicating a partial/stale deployment.

Required next step: bind the hostname to the complete `dist/site/` deployment,
install the correct certificate, then rerun live QA. Full evidence is in
`.factory/verification.md`.

## Original builder handoff (superseded by the FAIL above)

## Shipped

- WXT + TypeScript Manifest V3 extension with a compact popup, full settings
  page, browser action, and `Alt+Shift+L` command.
- Local per-site mappings with useful PASS/dots, WARN/stripes, and
  FAIL/crosshatch defaults. Users can add, edit, disable, reset, and remove
  mappings.
- On-page user-action color sampler using the EyeDropper API, plus a DOM
  element-picker fallback. Both open an on-page editor and save locally.
- Reversible, pointer-transparent overlays that add pattern, symbol, and label
  redundancy without editing page source. Focused elements are skipped so
  native focus indicators remain visible. Canvas pixels are never read.
- Responsive static product site, interactive seeded proof sheet, install
  guide, privacy page, terms page, web app manifest, offline service worker,
  robots/sitemap, and downloadable packaged extension.
- Optional $12 one-time Sociobot supporter license. Return-token capture,
  once-daily verification cache, restore field, revoked/invalid handling, and
  offline fallback follow the billing contract. It unlocks only named local
  setup snapshots; core accessibility features stay free. No product ID is
  hardcoded.
- Original generated halftone hero in AVIF/WebP variants and a hand-authored
  extension icon. Full prompt and provenance are in `.factory/design.md` and
  `assets/src/inspection-proof.prompt.json`.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run verify:site
npm run verify:extension
```

Build output:

- Static deploy root: `dist/site/index.html`
- Download: `dist/site/downloads/color-meaning-lens-chrome.zip`
- Unpacked extension: `dist/extension/chrome-mv3/`

Verification on 2026-08-27:

- `npm test`: TypeScript strict check plus 5/5 Vitest tests passed.
- `npm run build`: site, extension, icons, imagery, and ZIP built cleanly.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- Playwright + axe on `/`, `/privacy/`, and `/terms/`: no console errors, no
  serious/critical issues, exactly one `h1` and `main`, valid `lang`/title/alt.
- 390 × 844 viewport: 0 px horizontal overflow; demo interaction passed.
- Loaded-extension Chromium smoke test: content script injected, starter PASS
  mapping rendered, runtime toggle removed the mark, options page rendered all
  three starter mappings, and no console errors occurred.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.1 s, LCP 1.1 s, TBT 0 ms, CLS 0. INP was not observed in the
  synthetic no-input run; the measured max potential input delay was 70 ms.
- Bundles: landing initial JS 3.22 KB raw total, CSS 9.88 KB; extension 40.41
  KB total; mobile hero AVIF 6.4 KB and desktop AVIF 65.6 KB.

## Known gaps and next steps

- The factory must register the product/return URL with the Sociobot billing
  service before checkout can complete in production. Verification failures
  leave the free tool usable and show a quiet retry message.
- The downloadable ZIP is an unpacked/developer-mode Chromium package. Store
  signing and listing are deployment work outside this repository.
- The lens intentionally handles computed DOM colors, not pixels painted
  inside canvas, video, or cross-origin images. Dense pages are capped at the
  first 1,800 elements and 120 simultaneous marks to avoid degrading the host.
- The EyeDropper API depends on browser support; the element picker is the
  supported fallback.
