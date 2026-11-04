# Art direction: the house style

The site is one painted room. Every object on the wall should look as if the same hand painted it on
the same paper, under the same warm light. This page holds the rules.

## 1. The source of truth: the original paintings

The originals set the style. They are **never redrawn or filtered**:

- portrait and gold frame
- nameplate
- track lights
- light switch
- 3D-model busts shelf
- flowers
- easel and chair
- game shelf
- the vase photo watercolor (phone)

These are the qualities to match:

- **No outlines.** Form comes from washes of value, not ink lines.
- **Soft, ragged edges.** Pigment bleeds slightly past the shape.
- **Uneven washes.** Color pools and thins within a shape, and paper texture shows through.
- **Black is never pure.** Darks are soft charcoal (the track lights, the console), never #000.
- **Rich but warm.** Saturated where it matters (gold, roses), always under a warm room light.

## 2. Drawings added to the room: the house finish

Every new wall drawing is drawn as an SVG, rendered to PNG, then passed through **one shared
recipe**, the house finish ([tools/house-finish.html](tools/house-finish.html)). The recipe applies these steps in order:

1. **Hand wobble:** a slow displacement (scale 9) plus a fine ragged edge (scale 3.5).
2. **Ink lift:** black lifts to warm sepia (`ink=` default) or soft charcoal (`ink=charcoal`, for
   screens and bezels). Saturation is 0.88 (0.92 for charcoal).
3. **Wash:** low-frequency pigment variation, multiplied in at 79–100%.
4. **Pooling:** a soft darker band inside the silhouette.
5. **Paper grain:** cold-press noise, multiplied in at 82–100%.
6. **Softening:** a 0.7px blur takes the vector crispness off.

To run it:

```powershell
tools\house-finish.ps1 -Src images\thing.png -Out images\thing-painted.png -W 1200 -H 900 [-Ink charcoal]
```

Assets carrying the finish:

| Asset | Ink | File |
| --- | --- | --- |
| Software cart | sepia | `software-cart-painted.png` |
| Noteboard | sepia | `noteboard-painted.png` |
| Noteboard (phone) | sepia | `noteboard-vertical-painted.png` |
| Digital Art display | charcoal | `digital-window-painted.png` |
| Meta Quest 3 overlay | sepia | `gametable-vr-painted.png` |
| Phone game shelf | sepia (recomposited) | `gametable-horizontal-painted.png` |

The pre-finish versions (`software-cart.png`, `noteboard.png`, `digital-window.svg` and the rest)
stay in `images/` as the editable sources.

**Where the finish does not go:** page imagery. That covers artwork photos, Daily Texan
illustrations, game screenshots and the Color Studio cover (`software/colorstudio-thumb.jpg`).
These sit beside real artwork and must stay crisp. The finish on a full-bleed image reads as grime.

## 3. Color

Wall objects are brought to one light by the **TONE BALANCE** block in `style.css`, which applies a
saturate/contrast/sepia filter to each item box. Because the painted assets are already softened,
they get a gentle lift there (saturate 1.08–1.18) rather than a cut.

| Token | Value | Use |
| --- | --- | --- |
| `--c-wall` | `#F1EBE1` | plaster, page grounds, monogram |
| `--c-ink` | `#2E2420` | text, icons by day |
| `--c-night` | `#17120F` | night room, dark pages |
| `--c-accent` | `#D9B98A` | brass: rules, rings, focus |
| `--c-rose` / `--c-sage` / `--c-sky` | | small accents, sticky notes |

New drawings take their fills from the originals: gold `#C98A4E`, rose `#F2A0A8`, sage `#9DBB6C`,
sky `#9FB8D6`, and cream casing `#E8DAC2`.

## 4. Type

These are the font roles. The tokens live in `style.css` under TYPE + UI SYSTEM.

- **Cormorant Garamond** (`--f-serif`): titles and names.
- **DM Sans** (`--f-sans`): interface text, captions in spaced capitals.
- **Caveat** (`--f-hand`): sticky notes only.

## 5. Icons and marks

- **Icon set:** `images/icons/close.svg`, `chevron-left.svg`, `chevron-right.svg`.
  - Drawn on a 24-unit grid with a 1.4 stroke, round caps and slightly hand-bowed lines.
  - Used as CSS masks (`<i class="ico ico-close">`) filled with `currentColor`, so they follow day and night mode and scale with the button's font size.
  - Never type ✕ ‹ › as text.
- **Monogram:** "RL" in Cormorant italic on wall-cream, with a brass ring and a hairline ink ring.
  - Files: `images/icons/monogram-512.png` (master), `-180` (Apple touch), `-32` (favicon).

## 6. Checklist for a new wall object

1. Use the colors of its painted neighbors, with no pure black, and outlines at most 2.5px in a dark
   shade of the fill.
2. Render the SVG to PNG at 2× display size, run the house finish, and save as `name-painted.png`.
3. Look at it **on the wall** next to its neighbors, in both day and night mode, then set its
   TONE BALANCE line.
4. Write the alt text if it carries meaning. If it is decorative inside a labeled button, use `alt=""`.
