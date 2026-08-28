# Color Meaning Lens

Color Meaning Lens is a local-first Chromium extension for color-blind
technical workers. It adds user-authored patterns, symbols, and short labels
to status colors in dashboards, diffs, and charts. It does not infer meaning
or alter source data.

Live product page: <https://color-meaning-lens.sociobot.in>

## What ships

- A Manifest V3 extension with local per-site mappings, an on-page eyedropper,
  element-picker fallback, and `Alt+Shift+L` toggle.
- A static landing site with an interactive proof sheet, privacy/terms pages,
  offline shell, extension download, and optional one-time supporter license.
- Starter PASS/dots, WARN/stripes, and FAIL/crosshatch mappings.

The free extension is fully useful. A $12 one-time supporter license only adds
named local setup snapshots; it does not gate core accessibility behavior.

## Run and verify

Requires Node 20 or newer.

```sh
npm ci
npm test
npm run build
npm run verify:package
npm run verify:site
npm run verify:extension
```

`npm run build` outputs the static deploy at `dist/site/index.html`, the
unpacked extension at `dist/extension/chrome-mv3/`, and the installable archive
at `dist/site/downloads/color-meaning-lens-chrome.zip`.

The static deployment command is intentionally `npm run build:site`: it builds
the landing site, MV3 extension, and ZIP together so the advertised download
cannot be omitted from a clean deploy. The deploy root also includes
`staticwebapp.config.json`, which keeps `/downloads/*.zip` out of the document
fallback and applies the site's security and cache policy.

For development:

```sh
npm run dev        # WXT extension dev mode
npm run dev:site   # landing site on Vite
```

To try the production extension, unzip the archive, open
`chrome://extensions`, enable Developer mode, and choose **Load unpacked**.

## Privacy and scope

Mappings and named presets stay in browser storage. The extension reads
computed DOM styles; it does not take screenshots or read cross-origin canvas
pixels. License tokens are sent only to the Sociobot billing API for
verification. There are no analytics, ads, remote fonts, or runtime CDNs.

See [.factory/design.md](.factory/design.md) for the product-specific visual
system and [LICENSE](LICENSE) for the MIT license.
