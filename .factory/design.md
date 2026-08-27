# Color Meaning Lens — visual thesis

## Direction: the inspection proof

The product borrows from a pre-digital print inspector's bench: registration
marks, ink swatches, coarse halftone screens, and pencilled annotations. That
world fits the job because the lens does not “correct” a person's vision. It
adds a second, inspectable channel of meaning to color. Every pattern and label
should feel deliberately overprinted onto the original page and easy to lift
off again.

This is a single light-paper treatment, not an automatic light/dark theme. The
warm explicit ground keeps the generated print texture coherent; the actual
extension overlay remains high-contrast and translucent over any host page.

## Tokens

| Role | Token | Value | Rationale |
| --- | --- | --- | --- |
| Paper | `--paper` | `#F4F0E7` | Warm inspection stock, low glare |
| Surface | `--sheet` | `#FFFDF7` | Clean work area against the paper |
| Ink | `--ink` | `#171A1F` | Near-black process ink, 15.2:1 on paper |
| Muted ink | `--ink-soft` | `#55584F` | Supporting copy, 6.4:1 on paper |
| Key blue | `--cobalt` | `#164B78` | Non-red/green primary action, 7.8:1 on paper |
| Blue wash | `--cobalt-pale` | `#D8E8F1` | Selected fields and diagrams |
| Signal orange | `--orange` | `#9B3E12` | Print-room registration accent, 6.4:1 on paper |
| Safe state | `--safe` | `#155B49` | Always paired with ✓ and dots |
| Warning state | `--warn` | `#7A4B00` | Always paired with ! and stripes |
| Failure state | `--fail` | `#8A2635` | Always paired with × and crosshatch |
| Rule | `--rule` | `#B7B1A5` | Quiet separators, never body copy |

No semantic status is communicated with color alone. In the marketing demo
and in the extension, PASS uses dot screen + check, WARN uses diagonal screen
+ exclamation, and FAIL uses crosshatch + cross.

## Type

- Display and labels: `Arial Narrow`, `Roboto Condensed`, `Aptos Narrow`,
  system sans-serif. Uppercase is reserved for short stamps and kicker text.
- Reading/UI: `Inter`, `Aptos`, `Segoe UI`, system sans-serif. No remote font
  request is made; the utility uses platform faces for speed and privacy.
- Scale: 14, 16, 20, 28, clamp(40–72) px. Body is never below 16 px. Data and
  color values use `ui-monospace` with tabular figures.

## Spacing and layout

An 8 px base rhythm with 4 px for optical corrections. The site uses a
12-column editorial grid at desktop and a single deliberate sequence at
390 px: thesis → illustrated result → three-step use → test bench → purchase.
Independent plans and test states may use bordered sheets; ordinary prose is
grouped by whitespace, not cards. Controls are at least 44 px tall.

## Interaction grammar

- Buttons depress by 2 px like a physical stamp; a hard 2 px ink shadow marks
  primary actions.
- Selected mappings gain a blue registration edge plus a textual state.
- The extension overlay is explicitly described as a user-authored note. Its
  labels say “Lens note,” and the UI never claims inferred ground truth.
- The popup is a compact inspector docket: site, master switch, mapping count,
  then the picker. Advanced editing lives in the full options page.
- Keyboard: `Alt+Shift+L` toggles the current tab. `Escape` exits picking.

## Motion

UI transitions run 160–220 ms and only move opacity/transform: stamps settle
down from a 3 px offset; the overlay labels fade in at their measured origin.
Nothing loops. Under `prefers-reduced-motion: reduce`, animations and smooth
scrolling are removed; hierarchy remains through rules, type, and texture.

## Original asset plan and provenance

The hero is a generated editorial still-life of a print-inspection light table:
three abstract dashboard tiles share similar ink intensity, while distinct
dot/stripe/crosshatch acetate overlays reveal their roles. It explains the
product without pretending to show an exact browser screenshot. CSS-authored
registration marks and pattern swatches complete the system; icons are
hand-authored inline SVG using simple geometry.

Prompt sheet:

> Use case: stylized-concept. Asset type: wide landing-page hero illustration.
> Scene: an overhead print inspector's workbench on warm uncoated paper, with
> three abstract browser dashboard tiles under transparent acetate lenses.
> Subject: the tiles begin as ambiguous muted status colors, then are made
> distinguishable by bold black dot, diagonal stripe, and crosshatch overlays;
> include subtle crop marks and loupe shadows. Style: refined editorial
> risograph and halftone print, tactile ink, crisp geometric composition,
> restrained cobalt blue and burnt orange with charcoal ink and cream paper.
> Composition: 3:2 landscape, central objects, breathing room at edges, no UI
> text. Light: soft angled studio light, reassuring precision. Avoid: people,
> hands, logos, readable text, letters, medical imagery, glossy 3D gradients,
> photoreal computer screens, watermarks, visual clutter.

- Generator: Azure AI Foundry factory image deployment via
  `/opt/fleet/lib/gen-image.sh`.
- Date: 2026-08-27.
- License/provenance: original generated asset commissioned for this product;
  no input images, brands, people, or copyrighted characters.
- Source PNG and prompt sidecar live in `assets/src/`; optimized WebP/AVIF are
  shipped by the site. Generated imagery is disclosed in the footer.
