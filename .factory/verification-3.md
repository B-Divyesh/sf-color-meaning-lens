# Independent verification 3 — FAIL

**Work order:** `color-meaning-lens-verify-3`  
**Candidate:** `7e88aa1fdcddaccf6611e78335e94bc8a6971930`  
**Production URL:** <https://color-meaning-lens.sociobot.in/>  
**Verified:** 2026-08-28 UTC

## Verdict

**FAIL.** The earlier deployment-only P0 is repaired: production serves a real,
installable extension ZIP and its unpacked contents exactly match a clean build
of this candidate. This candidate still misses the complete acceptance contract:
the supplied live verification gate fails after a fresh exact build because ZIP
bytes are non-reproducible, and the options UI silently accepts invalid mapping
colors while retaining a different saved value. The latter has no required
invalid-input error/recovery feedback.

No product source was changed during this verification.

## Defects

### P1 — fresh `verify:live` rejects a content-identical released package

`npm run verify:live` rebuilds the ZIP and compares its raw SHA-256 to
production. It failed at `scripts/verify-live.mjs:44`:

```
Error: Live ZIP is not the built extension package: 200 application/zip
9e8e4db49bbae9aec9155849ff487f9ce325c44ff5dd57d0a6bccd12be31a32d
```

- Fresh local ZIP SHA-256: `f14b678b178606443be40c4f2a4796e5fa3ebd45439c82aa7cd48abbb7267c4b`.
- Live ZIP SHA-256: `9e8e4db49bbae9aec9155849ff487f9ce325c44ff5dd57d0a6bccd12be31a32d`.
- Both are 23,175 bytes; `unzip -t` passes for both.
- `diff -qr` of the two fully unpacked ZIPs produced no differences across all
  16 shipped files, including manifest, content script, options, popup, and icons.

The archive builder does not set deterministic entry metadata. Raw archive
equality is therefore not a valid identity check after a clean rebuild, and the
documented production gate fails even when the deployed extension is
content-identical. Make packaging deterministic or compare a deterministic
unpacked-content manifest.

### P2 — invalid mapping colors are silently left unsaved

In a loaded MV3 extension on a seeded dashboard, I created a `#2563EB`
per-site `REVIEW`/stripes mapping, confirmed one overlay mark appeared, then
removed it and confirmed zero marks. Entering `not-a-hex` into that mapping's
visible Color field and moving focus away left the field displaying
`not-a-hex`, while `chrome.storage.local` still held `#2563EB`. The UI showed
no validation error, repair action, or accurate save feedback.

The user can recover by entering a valid hex, but this violates the requested
invalid-input/error-state behavior and can make a user believe a mapping will
apply when it will not. Validate the field, restore/retain the valid displayed
value, and announce a clear recovery message.

## Passed evidence

The checkout was clean and exactly at the candidate SHA before testing. Node
was `v22.23.2`; npm was `10.9.8`.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 269 packages; audit reported 0 vulnerabilities |
| `npm test` | PASS — WXT prepare, `tsc --noEmit`, 5/5 Vitest tests |
| `npm run build` | PASS — static site, versioned SW, MV3 output, ZIP |
| `npm run verify:site` | PASS — structure, axe, desktop/390px, keyboard, motion, headers, ZIP route, SW update/offline |
| `npm run verify:extension` | PASS — injected content script, starter mark, removal, options smoke, no console errors |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run verify:live` | FAIL only on P1 raw-ZIP assertion |

Independent extension smoke confirmed normal add/apply/remove behavior above.
Keyboard Enter on **Add mapping** increased mappings from 3 to 4. Axe found no
serious/critical findings in options or popup, and neither had page/console
errors. The packaged MV3 manifest requests only `storage` and `activeTab` and
Chromium reports the declared `Alt+Shift+L` command as registered.

Landing, privacy, and terms each had title, `lang=en`, one `h1`, one `main`, no
missing image alt, no console errors, and no axe serious/critical findings. At
390 x 844 there was 0 px horizontal overflow; keyboard Space toggled the proof
sheet, focus outline was 3 px, and reduced motion produced `0s` transitions and
automatic scrolling. Visual review showed intentional stacking and no clipped
fixed UI.

Invalid license recovery was also exercised live: `?license=not-a-real-license`
was removed from the URL, saved locally, verified, and displayed `License no
longer active (invalid). The free extension still works.` without page errors.

## Deployment, privacy, PWA, and budgets

Live HTML, hashed assets, responsive artwork, and generated service worker
byte-match the clean candidate. The archive differs only in ZIP metadata; its
fully unpacked files match as documented under P1.

- Production download is HTTP 200 `application/zip` with `Content-Disposition:
  attachment` and immutable one-year caching. A missing ZIP gives 404, not the
  document fallback.
- HSTS, CSP, Permissions-Policy, `X-Frame-Options: DENY`, `nosniff`, and strict
  referrer policy are present. Hashed JS is immutable, `sw.js` is `no-cache`,
  and the web manifest is `application/json` with a one-day cache.
- The SW cache is content-versioned (`color-meaning-lens-b94d3d56b694c976`),
  precaches shell assets, replaces stale caches, takes control after update, and
  served the local offline reload test.
- Normal live loads made same-origin requests only. Source and network review
  found no analytics, ads, remote fonts, runtime CDNs, screenshot capture, or
  canvas-pixel reads. Mappings are in `browser.storage.local`; the only remote
  fetch is Sociobot license verification after license activity. The invalid
  license flow contacted only the product origin and `https://api.sociobot.in`.

| Asset | Raw size | Budget | Result |
| --- | ---: | ---: | --- |
| Initial JS (application + preload) | 3,213 B | 200 KB | PASS |
| Landing CSS | 9,880 B | 50 KB | PASS |
| Mobile hero AVIF | 6,415 B | 300 KB | PASS |
| Unpacked MV3 | 40,413 B | — | PASS |
| Install ZIP | 23,175 B | — | PASS |

## Reproduce

```sh
npm ci
npm test
npm run build
npm run verify:site
npm run verify:extension
npm audit --audit-level=high
npm run verify:live # currently fails on non-deterministic ZIP bytes
curl -sS -o live.zip https://color-meaning-lens.sociobot.in/downloads/color-meaning-lens-chrome.zip
unzip -t live.zip
```

The release-blocking deployment failure in `verification-2.md` is resolved, but
the two defects above must be addressed before a PASS handoff.

