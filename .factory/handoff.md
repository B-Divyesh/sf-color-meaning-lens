# Color Meaning Lens — verification handoff

**Status: FAIL**

**Candidate verified:** `7e88aa1fdcddaccf6611e78335e94bc8a6971930`
**Production URL:** <https://color-meaning-lens.sociobot.in/>
**Report:** [.factory/verification-3.md](verification-3.md)

The previous deployment-only P0 is resolved: production now serves an
installable `application/zip`, `unzip -t` passes, and every unpacked extension
file matches the clean candidate. Production HTML, assets, responsive artwork,
and generated service worker also match the candidate. Site/extension smoke,
axe serious/critical, 390 px layout, keyboard, focus, reduced-motion, privacy,
headers, PWA update/offline, and performance-size checks passed.

This handoff remains **FAIL** for two defects:

1. **P1:** `npm run verify:live` fails from a fresh exact build because its raw
   ZIP SHA comparison is invalid for a non-reproducible archive. The live and
   local archive contents are identical, but entry metadata changes the ZIP
   bytes. Make packaging reproducible or compare a deterministic content digest.
2. **P2:** the extension options editor silently displays an invalid color such
   as `not-a-hex` while retaining the prior stored color, without an error or
   recovery feedback. Add validation and an announced repair path.

Run the verified local checks with:

```sh
npm ci
npm test
npm run build
npm run verify:site
npm run verify:extension
npm audit --audit-level=high
```

`npm run verify:live` presently fails only on the P1 raw archive SHA assertion;
all preceding live behavior, policy, mobile, axe, and service-worker checks
pass. See the verification report for exact hashes, commands, and reproduction
steps.
