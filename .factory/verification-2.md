# Independent verification 2 — FAIL

**Work order:** `color-meaning-lens-verify-2`
**Candidate:** `8232e074ca5240f8d1ba2d6a5126509f6513d55d`
**Public URL:** `https://color-meaning-lens.sociobot.in/`
**Verified:** 2026-08-28 UTC

## Verdict

**FAIL — the deployed browser-extension package is not downloadable.** Fresh
evidence supersedes the deployment state in `verification.md`: TLS and the
site now work, and sampled site files are byte-identical to the candidate, but
the required downloadable extension URL serves the HTML application shell
instead of the candidate ZIP. A user following the install path cannot obtain
an installable browser extension.

## Release-blocking defect

### P0 — `/downloads/color-meaning-lens-chrome.zip` is routed to HTML fallback

- `GET https://color-meaning-lens.sociobot.in/downloads/color-meaning-lens-chrome.zip`
  returned **HTTP 200**, `content-type: text/html`, `content-length: 8158`.
- Its SHA-256 is
  `f39b3503e9a3eda8c59c38f93cda569340bcf43e289b0ab878d424c72b829fd0`,
  exactly the SHA-256 of the deployed/local `index.html`, not the candidate
  ZIP.
- `unzip -t` on the live response exits **9**: missing end-of-central-directory
  signature. The clean candidate's `dist/site/downloads/color-meaning-lens-chrome.zip`
  passes `unzip -t` and has SHA-256
  `b36f38089d23ea27974baf912d49be738ba29e3c3b026317765684bed3810ef2`.
- Both visible download links point at this path. The documented install flow
  therefore fails before an end user can load the MV3 package.

**Required resolution:** deploy `dist/site/downloads/color-meaning-lens-chrome.zip`
as a real static binary and configure the static host so that this path is not
rewritten to the SPA/document fallback. Recheck the URL's content type and
`unzip -t` after deployment.

## Fresh deployment identity and response evidence

The supplied origin now has valid HTTPS and served HTTP 200 for the tested
paths. These live responses byte-match the clean candidate build:

| Path | Result |
| --- | --- |
| `/`, `/privacy/`, `/terms/`, `/sw.js` | exact SHA-256 match |
| `/assets/home-DOhCKQsA.css`, `/assets/home-DmYeN8S9.js`, `/assets/modulepreload-polyfill-B5Qt9EMX.js` | exact SHA-256 match |
| `/assets/inspection-proof.avif` | exact SHA-256 match |
| `/downloads/color-meaning-lens-chrome.zip` | **does not match; HTML fallback (P0)** |

Live headers provide HTTPS/HSTS, `nosniff`, and
`strict-origin-when-cross-origin`. They do **not** provide `Content-Security-Policy`,
`Permissions-Policy`, or `X-Frame-Options`; hashed JS/CSS assets use only
`cache-control: public, must-revalidate, max-age=30`, rather than immutable
long-lived caching.

### Non-blocking deployment/product observations

- **P2 — PWA updates are fragile.** The service worker is cache-first and uses
  a static cache name (`color-meaning-lens-v1`). Its script contains no build
  identity and does not precache the hashed JS/CSS files. A future asset-only
  release can leave a client controlled by the unchanged worker and receiving
  its old cached shell. Fresh live registration succeeded and an offline reload
  passed; `registration.update()` found no new worker for the identical live
  candidate. Version the cache/service worker from the build and test an
  actual old-to-new upgrade before claiming update safety.
- **P2 — response policy/caching hardening is absent.** Add an appropriate CSP
  and permissions policy and immutable caching for content-hashed static
  assets. This did not cause the P0 failure.
- `/site.webmanifest` is served as `application/octet-stream`, not a manifest
  media type. This is a low-priority compatibility issue.

## Clean-checkout quality gates

Candidate checkout: detached worktree at
`8232e074ca5240f8d1ba2d6a5126509f6513d55d`; Node `v22.23.2`, npm `10.9.8`.
Playwright `1.62` required installing matching Chromium 151 because the
preinstalled browser cache was for another revision.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 269 packages audited, 0 vulnerabilities |
| `npm test` | PASS; WXT prepare, strict `tsc --noEmit`, 5/5 Vitest tests |
| `npm run build` | PASS; exact site build, MV3 build, assets, and ZIP |
| Candidate package | PASS locally; ZIP integrity test succeeds |
| `npm run verify:site` | PASS; `/`, `/privacy/`, `/terms/` each have title, `lang=en`, exactly one `h1`/`main`, no missing alt, no console errors, and no axe serious/critical findings |
| `npm run verify:extension` | PASS; content script injected, starter mapping rendered, runtime toggle removed marks, options showed 3 starter mappings, no console errors |
| Extension options/popup axe | PASS; 0 serious/critical findings |
| Local 390 px check | PASS; 0 px overflow and demo toggle works |
| Live desktop/390 px check | PASS; 0 px mobile overflow, keyboard Space toggles the demo, visible 3 px focus rings on skip link and demo button |
| Reduced motion | PASS; live `prefers-reduced-motion` gives `transitionDuration: 0s` and `scrollBehavior: auto` |
| Live mobile Lighthouse | PASS; Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP/LCP 0.9 s, TBT 80 ms, CLS 0, interactive 1.1 s |

## Workflow, boundary, privacy, and PWA evidence

- The loaded MV3 extension rendered the starter PASS mapping over a seeded
  control and removed it through its verified runtime toggle. Its default
  mappings are PASS/dots, WARN/stripes, and FAIL/crosshatch; labels are shown
  as user notes rather than inferred facts. Focused page elements are excluded
  from overlays, preserving native focus treatment.
- The loaded-extension settings smoke confirmed the three starter mappings and
  no console errors. The site's invalid license restore response says the token
  is inactive while keeping the free demo/tool available; the token and verdict
  are local browser storage.
- No analytics, third-party fonts, CDN scripts, canvas-pixel reads, or normal
  landing-page cross-origin requests were found. A live fresh load made
  same-origin requests only. Static source review found the sole programmed
  remote fetch is the Sociobot license verification endpoint, after explicit
  license restore/unlock. Extension configuration uses `browser.storage.local`;
  mappings are local. Its broad `<all_urls>` host permission is necessary for
  the stated across-site overlay scope.
- Live service-worker registration became active with cache
  `color-meaning-lens-v1`; after the initial load, an offline reload returned
  200 with the correct title and no page errors. See P2 above for the separate
  upgrade-versioning limitation.

## Performance budgets

- Initial site JavaScript: **3,219 B raw** (2,508 B application + 711 B
  module-preload polyfill), under the 200 KB budget.
- Landing CSS: **9,880 B raw**, under the 50 KB budget.
- Mobile hero AVIF: **6,415 B**, under the 300 KB budget.
- MV3 output: **40,413 B** total; valid local ZIP: **23,175 B**.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run verify:site
npm run verify:extension
curl -sS -D - -o live.zip \
  https://color-meaning-lens.sociobot.in/downloads/color-meaning-lens-chrome.zip
unzip -t live.zip
```

No product source was modified during this verification; only this report and
the QA handoff were updated.
