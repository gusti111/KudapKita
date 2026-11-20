# KudapKita — Brand & Image Asset Notes

## Brand direction

**Positioning:** a friendly, modern home-snack brand with Indonesian traditional roots.

**Visual direction:** Warm Modern Artisanal. Use warm cream surfaces, cocoa typography, terracotta actions, and muted sage accents. Keep food imagery prominent and avoid excessive decorative gradients.

| Token | Hex | Usage |
|---|---|---|
| Cocoa | `#493127` | Primary text, footer, primary buttons |
| Cream | `#F8F4EC` | Main page background |
| Terracotta | `#B85D2E` | Primary accent and calls to action |
| Sage | `#54745B` | Availability/positive supporting accents |
| Butter | `#E9C98F` | Warm highlights |
| Ink | `#2D2622` | Body text |

**Tagline:** Teman ngemil, dekat di hati.

## Logo assets

- `apps/web/public/brand/kudapkita-mark.svg`: crisp scalable mark for web navigation and favicon.
- `apps/web/public/brand/kudapkita-symbol-generated.png`: generated illustrative brand symbol, transparent PNG.
- `apps/web/public/brand/kudapkita-lockup.png`: logo preview with wordmark and tagline.
- `apps/web/public/brand/icon-192.png` and `icon-512.png`: installable app icons.

The mark is a warm snack parcel wrapped in leaves, with two rising steam strokes. The icon should appear with the wordmark “KudapKita”; do not distort the icon or use the mark as a substitute for product photography.

## Product reference photo sources

The images referenced in `apps/web/src/data/fixtures/product-image-references.ts` are openly licensed Wikimedia Commons references. They are not pictures of KudapKita's own production and the UI labels them as references. The owner should replace them with real product photographs before public commercial promotion.

| Product visual | Source / creator | License |
|---|---|---|
| Kue Bugis (visual reference for Doko-Doko Bugis) | [Kue bugis.JPG](https://commons.wikimedia.org/wiki/File:Kue_bugis.JPG), Midori | CC BY 3.0 / GFDL 1.2+ |
| Risoles (visual reference for potato-bengkuang risol) | [Risoles 2.jpg](https://commons.wikimedia.org/wiki/File:Risoles_2.jpg), Adnamiraatig | CC BY-SA 4.0 |
| Risoles with vegetables and mayonnaise (visual reference for Risol Mayo) | [Risoles dengan Isi.jpg](https://commons.wikimedia.org/wiki/File:Risoles_dengan_Isi.jpg), RT. Hakimi | CC BY-SA 4.0 |
| Onde-onde | [Ondeonde.jpg](https://commons.wikimedia.org/wiki/File:Ondeonde.jpg), JAGO | CC BY-SA 3.0 |
| Dadar gulung / Dadara | [Dadar Gulung aka Dadara isi Unti Kelapa.jpg](https://commons.wikimedia.org/wiki/File:Dadar_Gulung_aka_Dadara_isi_Unti_Kelapa.jpg), Supardisahabu | CC BY-SA 4.0 |
| Apem | [Kue apem.jpg](https://commons.wikimedia.org/wiki/File:Kue_apem.jpg), Taman Renyah | CC BY 3.0 |

Images are loaded through Wikimedia Commons' `Special:FilePath` endpoint. If an image is unavailable, confirm the current file page and license before replacing it. Preserve creator attribution and license information when reusing any image.

## Content integrity rules

- Never treat reference photographs as actual KudapKita product photographs.
- Do not publish prices, HPP, ingredients, allergens, net weight, shelf life, or delivery charges unless the owner confirms them.
- Public product data must be separated from owner-only operational data.
- Owner-provided product images must take precedence over reference images.
