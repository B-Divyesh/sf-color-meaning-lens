# Review 1 — Add labels and patterns to color-coded work

**Verdict: FAIL**

- Work order: `color-meaning-lens-review-1`
- Live URL: <https://color-meaning-lens.sociobot.in/>
- Review date: 2026-09-05 UTC
- Implementation reviewed: `c2e5b53ccdbb62574e6b15c4600c7d34c9727fbc`
- Documentation head reviewed: `0d3f6b8a923fb08d5f059990aeb2e9cedab2433d`
- Findings: **9** (3 high, 4 medium, 2 low)
- Untested public claims: **21**

The implementation commit is the last commit that changes product files. The
later commits change README and verification reports. A clean build at the
documentation head produced the same product, and all 18 deployable files
except host-only `staticwebapp.config.json` matched the live bytes.

## Job, audience, and first action

The job is to add user-chosen labels and patterns to color-coded status,
chart, and diff elements. The audience is a color-blind technical worker.

Before scrolling, the live page shows “Keep the color. Add the meaning.” Its
first action is **Download for Chromium**. The required first action is **Try
it with sample data**. The first screen does not name color-blind technical
workers.

## Findings

### R1 — High — The advertised purchase cannot start

Both the site and extension settings link to:

`https://api.sociobot.in/api/v1/products/color-meaning-lens/checkout`

On 2026-09-05 the endpoint returned HTTP 404 and
`{"error":"enabled factory product","status":404}`. The site advertises a
$12 one-time license, but a buyer cannot reach checkout. The invalid-license
verification endpoint does work and returns a clear recovery result.

Required: register or enable this product in the Sociobot billing engine, then
test checkout, return-token capture, restore, entitlement, and revocation.

### R2 — High — The required one-click sample sandbox is absent

The first screen has a secondary **Try the proof sheet** anchor. It scrolls to
a static example, then needs a second click on **Apply demo lens**. `/demo`
returns the ordinary home page and home title. The example has no persistent
“Demo — sample data, nothing is saved” label, no **Reset demo**, and no **Start
for real**. `.factory/demo.md` is also absent.

The populated output itself is useful: it shows API, web, and schema states as
PASS, WARN, and FAIL with symbols and three patterns. A clean desktop context
had empty local/session storage before and after use, so the current proof
sheet did not change real data.

Required: add the specified first-screen action and direct demo URL, enter the
populated state in one click, keep the sample label visible, provide reset and
exit actions, isolate demo storage, and document it.

### R3 — High — Public claims have no required claim tests

`.factory/claims.json` is absent. No test contains an `@claim:` tag. There are
therefore no declared claim commands to run, although the site, legal pages,
README, popup, and settings make 21 distinct testable promises. The generic
test and verification scripts cover some behavior, but they do not satisfy
the required clean-demo claim contract.

| ID | Public promise without a claim entry and tagged test |
| --- | --- |
| U1 | Adds patterns, symbols, and labels to matching page colors |
| U2 | Keeps mappings separate for each site |
| U3 | Samples colors with the browser eyedropper |
| U4 | Samples colors with the element-picker fallback |
| U5 | `Alt+Shift+L` removes or restores every mark |
| U6 | Shade tolerance catches nearby interface colors |
| U7 | Mappings and named setups stay in browser storage |
| U8 | Work-page colors and mappings are not sent away |
| U9 | The lens does not change source page data |
| U10 | The extension captures no screenshots and reads no cross-origin canvas pixels |
| U11 | The site has no analytics, advertising trackers, or analytics cookies |
| U12 | The product loads no remote fonts or runtime CDN scripts |
| U13 | The product works offline and the site has an offline shell |
| U14 | The download is an installable Chromium MV3 package |
| U15 | Core mappings, patterns, keyboard access, and data remain free |
| U16 | The supporter purchase is $12 once, with no account or subscription |
| U17 | A license adds up to 20 named local setup snapshots |
| U18 | Per-site setup takes 30 seconds |
| U19 | Export remains free |
| U20 | A license token stays local and is sent only to Sociobot for verification |
| U21 | The product does not perform medical correction, infer meaning, edit images, or present labels as ground truth |

Required: create the claim registry and one observable clean-sandbox test for
each retained claim. Remove claims that cannot be proved.

### R4 — Medium — The extension claims an export that does not exist

After a cached valid supporter verdict, extension settings say “Core lens
features and export remain free.” There is no export control, export code, or
export test in the source or built extension. This is a false feature claim.

Required: remove the word “export” or implement and test a real export path.

### R5 — Medium — The first screen and site copy do not meet the plain-words contract

The headline is a metaphor, not the job. The audience is absent. Download is
primary while the sample is secondary. The three facts are combined into one
small line instead of three short facts. Labels such as “test bench,”
“supporter ink,” “inspection proof,” and “current sheet” use theme language
instead of direct task names. `.factory/copy-audit.md` is absent.

Four legal-page sentences exceed the 22-word limit (25 and 27 words on
Privacy; 24 and 23 on Terms).

Required: name the job in the headline, name the audience, make the sample the
first action, use direct section names, and add the required copy audit.

### R6 — Medium — Unknown routes do not return a designed 404

`/does-not-exist` and `/404` return HTTP 200 with the home page, home title,
and home canonical URL. There is no `404.html` or response override. This is
not the expected deliberate HTTP 404; it is an incorrect successful response
that hides bad links.

Required: ship a product-styled 404 page with a way home and return HTTP 404.

### R7 — Medium — Required route metadata and shared site structure are incomplete

The home page has no Open Graph fields, Twitter card fields, or Apple touch
icon. Privacy and Terms have no canonical URL or meta description. Legal pages
do not use the standard header navigation or product footer. The footer does
not include “Built by Param Factory” or a version/build ID. The sitemap has no
demo route.

Required: complete metadata on every route and use the required shared header
and footer. Add the direct demo route to the sitemap.

### R8 — Low — Several phone touch targets are under 44 pixels high

At a fresh 390-pixel phone viewport, nine visible home-page links measured
15–30 CSS pixels high. They include the header wordmark, Download, the sample
link, legal links, and footer links. The extension options wordmark is 22
pixels high and its skip link is 42 pixels high.

Required: give each interactive target a hit area of at least 44 by 44 CSS
pixels without changing its visual weight.

### R9 — Low — Mapping deletion has no undo or confirmation

In a clean installed extension, **Restore starter mappings** immediately
removed the custom REVIEW mapping and returned the count from four to three.
Individual **Remove** buttons also delete immediately. Neither path offers
undo or confirmation.

Required: confirm the exact site and affected mappings, or offer an undo that
restores the previous local configuration.

## Live and installed-product evidence

Fresh Chromium contexts were used at 1440×900 and an iPhone 13 profile with a
390-pixel CSS viewport.

| Check | Result |
| --- | --- |
| Home, Privacy, Terms | 200; correct `lang`; one `h1`; one `main`; no missing alt; no console/page errors |
| Automated accessibility | Playwright axe and `@axe-core/cli` found 0 violations on Home, Privacy, and Terms |
| Keyboard | Skip link and controls had 3-pixel visible focus; Space operated the proof sheet; no tab trap |
| Reduced motion | Transitions were `0s`; scroll behavior was `auto`; no active animations |
| Phone layout | 0 pixels horizontal overflow; content stacked without clipping |
| Offline | Live service worker controlled the page; offline reload retained title and main content |
| Normal page requests | Same-origin only; no analytics, CDN, or font request |
| License recovery | Invalid token called only the documented Sociobot verify endpoint and showed a clear invalid result |
| Links | Home, Privacy, Terms, source, and ZIP worked; checkout alone returned 404 |
| Package | Live ZIP is 22,992 bytes, passes `unzip -t`, and matches the clean build SHA-256 `7518e7373f439896dfbe14cb110bf672074dfebda2773f650a47f5e286484a10` |
| Installed extension | Three starter marks rendered; picker added REVIEW; focus hid only the focused mark; Escape preserved data; other hostname kept only starter mappings |
| Boundaries and recovery | Label input stopped at 16 characters; invalid hex restored the last valid value; reset returned to three starter mappings |
| Extension accessibility | Options and popup had no axe serious/critical finding or console error |
| Performance | Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices, 100 SEO; FCP 0.9 s, LCP 1.0 s, TBT 0 ms, CLS 0 |
| Asset budgets | Initial JS 3,213 bytes raw; CSS 9,880 bytes raw; mobile AVIF 6,415 bytes |

The proof-sheet labels and patterns were visible after activation. Storage was
unchanged by that sample flow. Screenshots and raw JSON are under
`/work/.evidence/` with the `cml-review-1-` prefix.

## Clean-checkout commands

The clean checkout was at documentation head `0d3f6b8`, with Node `v22.23.2`,
npm `10.9.8`, and repository-pinned Playwright `1.58.2`.

| Command | Result |
| --- | --- |
| `npm ci` | PASS; 269 packages, 0 vulnerabilities |
| `npm test` | PASS; TypeScript plus 5/5 Vitest tests |
| `npm run build` | PASS; site, service worker, extension, and ZIP produced |
| `npm run verify:package` | PASS; deterministic ZIP hash matched |
| `npm run verify:site` | PASS; declared site checks, SW upgrade, and offline reload |
| `npm run verify:extension` | PASS; installed MV3 smoke and invalid-color recovery |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |
| `npm run verify:live` | PASS; declared live checks and ZIP identity |
| `unzip -t dist/site/downloads/color-meaning-lens-chrome.zip` | PASS; all 15 entries |
| `/opt/fleet/lib/verify-url.sh ...` | PASS; 200, structure present, no console errors |
| `npx @axe-core/cli ...` | PASS after installing its matching Chrome/driver prerequisite; 0 violations on three routes |
| Declared claim commands | FAIL; no claim registry or commands exist |

There is no declared lint command. The live verifier passes because it does
not check checkout, demo requirements, unknown-route status, metadata
completeness, touch target size, or claim registration.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1: invalid TLS and missing root deployment | Resolved; valid HTTPS and root HTTP 200 |
| Verification 1: incomplete live header/cache/PWA evidence | Resolved; live headers, cache policy, SW control, and offline reload passed |
| Verification 1: Lighthouse run crashed | Resolved; current mobile run completed with 100/100/100/100 |
| Verification 2: download path served HTML instead of ZIP | Resolved; live `application/zip`, attachment, valid archive, exact hash |
| Verification 2: static service-worker cache and fragile updates | Resolved; content-versioned cache and simulated update passed |
| Verification 2: missing CSP, permissions policy, immutable assets | Resolved; all present live |
| Verification 2: wrong web-manifest media type | Resolved; live `application/json` |
| Verification 3: non-deterministic ZIP failed live comparison | Resolved; repeated packaging and live comparison match exactly |
| Verification 3: invalid mapping colors stayed visible without feedback | Resolved; invalid text restores the saved hex and announces recovery |

## Final decision

**FAIL.** The core free extension works, the current deployment matches the
implementation candidate, and every previously reported defect is resolved.
The product cannot pass this review while nine findings remain and 21 public
claims lack the required claim tests.
