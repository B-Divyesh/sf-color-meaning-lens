# Independent verification — FAIL

**Work order:** `color-meaning-lens-verify-1`
**Candidate:** `8232e074ca5240f8d1ba2d6a5126509f6513d55d`
**Public URL checked:** `https://color-meaning-lens.sociobot.in/`
**Verification date:** 2026-08-27 UTC

## Verdict

**FAIL — deployment blocker.** The candidate builds and works locally, but the
required public URL neither has a valid certificate for its hostname nor
serves the candidate root. It cannot be used by an end user, so the
browser-extension product has not passed end-to-end acceptance.

## Blocker

### B1 — Public product URL is unavailable and does not match the candidate

- A normal Chromium navigation to the supplied URL failed with
  `net::ERR_CERT_COMMON_NAME_INVALID`.
- The presented certificate subject is
  `CN=*.msha-slice-7-eus2-1-ase.p.azurewebsites.net`; its SAN list contains
  only Azure web/mobile/SCM names, not `color-meaning-lens.sociobot.in`.
- With TLS verification intentionally disabled only to inspect the response,
  `GET /` returned `404 Site Not Found`, `Content-Length: 2667`. Its SHA-256
  was `1e0878f232e32cf44e87ba00bd6957c1ebdfc9bc7c1c0a1389f8c62e6ae3311a`.
  The locally built candidate `dist/site/index.html` is 8,158 bytes and SHA-256
  `f39b3503e9a3eda8c59c38f93cda569340bcf43e289b0ab878d424c72b829fd0`.
- The candidate's hashed JS asset and `/sw.js` also returned the same 404.
  `/privacy/` alone returned 200, demonstrating a partial/stale deployment,
  not a working release.
- Consequently production response headers, production asset caching, real
  PWA registration, and live browser UX cannot be accepted. The root 404 did
  not provide the candidate's expected security/cache policy.

**Required resolution:** bind the hostname to the correct static deployment,
install a certificate covering `color-meaning-lens.sociobot.in`, deploy the
complete `dist/site/` tree, then rerun this verification against the public
URL.

## Local candidate evidence

All checks below were run from a clean checkout at the candidate commit using
Node `v22.23.2` and npm `10.9.8`. Playwright's matching Chromium 151 binary
was installed because the repository resolves Playwright 1.62 while the
preinstalled cache was for another version.

| Check | Evidence | Result |
| --- | --- | --- |
| Dependency install | `npm ci` | PASS; 0 audit vulnerabilities |
| Typecheck and unit tests | `npm test` | PASS; WXT prepare, `tsc --noEmit`, 5/5 Vitest tests |
| Exact production build | `npm run build` | PASS; site, MV3 extension, optimized assets, and ZIP built |
| Static site structure/a11y | `npm run verify:site` | PASS; `/`, `/privacy/`, `/terms/` each have title, `lang=en`, one `h1`, one `main`, no missing image alt, no console errors, and no axe serious/critical findings |
| 390 px mobile | repository verifier plus options-page check | PASS; 0 px horizontal overflow; demo toggle works; options has 0 px overflow |
| Extension smoke | `npm run verify:extension` | PASS; content script injected, starter mark rendered, runtime toggle removed marks, options displayed 3 starter mappings, no console errors |
| Options normal/boundary paths | independent loaded-extension Chromium test | PASS; add changed 3→4 mappings, 16-character label boundary enforced, remove returned to 3, reset restored 3 |
| Invalid/recovery path | intercepted invalid then valid license responses | PASS; empty restore field is natively required; invalid token explains that free features remain available; later valid response unlocks |
| Focus, keyboard configuration, reduced motion | independent Chromium extension test | PASS; 390 px options focus ring is solid 3 px; reduced-motion transition is `0s`; `chrome.commands.getAll()` reports `toggle-lens` as `Alt+Shift+L`; focused page state is omitted from overlays, preserving the native focus outline |
| PWA update/offline | HTTPS local static harness, with a simulated changed `/sw.js` | PASS; service-worker `controllerchange` occurred after `registration.update()` and an offline root reload retained the correct title/main with no page errors |
| Privacy/outbound requests | source and request capture | PASS for normal local use; initial landing load made 5 same-origin requests only. No analytics, remote fonts, CDN scripts, canvas reads, screenshots, or extension network calls were found. The only remote request in source is Sociobot license verification after explicit restore/unlock. |
| Package | `unzip -l dist/site/downloads/color-meaning-lens-chrome.zip` | PASS; archive contains the complete 40,413-byte unpacked MV3 output including manifest, scripts, styles, and icons |

## Product-workflow coverage

The built extension was loaded into Chromium against a seeded dashboard page
with exact PASS (`#16A34A`), WARN (`#CA8A04`), and FAIL (`#DC2626`) controls.
It rendered three redundant marks. Focusing PASS reduced the mark count from
3 to 2 and left the page's native `outline: auto` focus indicator visible.
The repository's loaded-extension verifier also sent the runtime toggle message
and observed the mark count go to zero. Browser automation cannot inject a
browser-level accelerator through a page key event, but the installed command
is registered with Chromium and targets the same verified runtime handler.

The site demo switch was tested at 390 × 844, and the restore form exercised
empty, invalid, and recovery cases. The content picker/editor is encapsulated
in a deliberately closed shadow root; its rendered default/mapping behavior
is covered by the loaded-extension tests above. No source or product code was
changed during verification.

## Performance and cache evidence

- Landing initial JavaScript: 2,508 B application chunk + 711 B module preload
  polyfill = **3,219 B raw** (budget: ≤200 KB).
- Landing CSS: **9,880 B raw** (budget: ≤50 KB).
- Mobile hero AVIF: **6,415 B** (budget: ≤300 KB); desktop AVIF: 65,623 B.
- Entire extension output: **40,413 B**; downloadable ZIP: 23,175 B.
- The service worker precaches shell/image resources, calls `skipWaiting()` and
  `clients.claim()`, deletes obsolete named caches, and passed the simulated
  update plus offline reload test above.
- A mobile Lighthouse run emitted preliminary category scores of 100/100/100/100
  and FCP/LCP 1.012 s, TBT 0 ms, CLS 0, but its final full-page screenshot
  target crashed (`TARGET_CRASHED`) in this container. Those preliminary
  Lighthouse scores are therefore not claimed as a clean formal run; the
  Playwright/axe and browser-flow results above are the accepted local evidence.

## Remaining non-blocking observations

- The local test server used for static-artifact checks does not reproduce
  production cache headers. Production cache/security response policy remains
  unverified solely because the supplied production root is unavailable.
- The product intentionally does not read canvas/video/image pixels. That is
  consistent with the brief's privacy and cross-origin-canvas constraint.
