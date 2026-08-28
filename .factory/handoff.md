# Color Meaning Lens — independent QA handoff

## FAIL — deployment does not meet browser-extension acceptance

**Verified candidate:** `8232e074ca5240f8d1ba2d6a5126509f6513d55d`
**Required URL:** `https://color-meaning-lens.sociobot.in/`
**Fresh verification date:** 2026-08-28 UTC

The production homepage, legal pages, service worker, sampled hashed assets,
and hero image now match the candidate byte-for-byte. The candidate also
passes its clean local install, test, build, extension/site smoke, axe,
mobile, focus, reduced-motion, privacy, offline-reload, and Lighthouse checks.

It is nevertheless **not releasable**: the two public install/download links
serve HTML instead of the extension ZIP. `GET
/downloads/color-meaning-lens-chrome.zip` returns 200 `text/html`, 8,158 B,
and is byte-identical to `index.html`; `unzip -t` exits 9. The locally built
candidate ZIP is valid. This is a **P0 deployment defect** because users
cannot install the advertised browser extension.

Required next step: deploy the real
`dist/site/downloads/color-meaning-lens-chrome.zip`, exempt it from document
fallback routing, then verify its content type and `unzip -t` at the public
URL. Also address the P2 service-worker cache versioning and response-policy/
immutable-cache observations recorded in `.factory/verification-2.md`.

Full fresh evidence: `.factory/verification-2.md`. The prior TLS/404 report
in `.factory/verification.md` is historical and has been superseded by this
new deployment state.

## Original builder handoff (superseded by independent QA)

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
