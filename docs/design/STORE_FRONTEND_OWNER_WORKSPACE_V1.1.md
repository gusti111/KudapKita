# KudapKita — Storefront & Owner Workspace Design v1.1

## Product design direction

**Warm Modern Artisanal**: a contemporary, welcoming visual system inspired by handmade snack packaging and the warm character of a neighborhood food business.

- Storefront: cream/off-white surfaces, cocoa headings, terracotta purchase actions, restrained sage availability signals, product photography as the key visual.
- Owner workspace: calm light neutral canvas, white panels, cocoa text, terracotta for primary actions, semantic status chips.
- Typography: serif display headings, readable sans-serif UI/body.
- Shapes: 12–20px card radius, restrained border, minimal shadow, 44px minimum interactive controls.
- Motion: subtle only; respect `prefers-reduced-motion`.

## Token baseline

| Token | Value | Use |
|---|---|---|
| Cocoa | `#493127` | Brand and heading |
| Cream | `#F8F4EC` | Storefront background |
| Terracotta | `#B85D2E` | Primary action |
| Sage | `#54745B` | Availability/positive signal |
| Ink | `#2D2622` | Body text |
| Muted | `#82766D` | Secondary text |
| Stroke | `#E8DED2` | Borders and dividers |

## Screens represented in the design reference

1. Desktop storefront home — brand header, hero, product highlights, how-to-order information, footer.
2. Mobile storefront home — compressed hero, single primary CTA, curated product snippets.
3. Owner dashboard — navigation, operation metrics, latest orders, production/stock cues, separate order and payment states.
4. Planned implementation surfaces — catalog/detail, cart/checkout, order queue/detail, product/category management, production, inventory, direct sales, reports, settings.

The screens currently authored in the SVG Lab design board are reference compositions, not deployed application screens. The React app is the implementation source of truth.

## Content and imagery rules

- The six initial menu names are Doko-Doko Bugis, risol kentang bengkuang, risol mayo, onde-onde, dadar gulung, and apam.
- Real product photos are not included in the repo at this stage. Do not present stock/illustration placeholders as actual photos.
- Public price remains “Harga dikonfirmasi admin” while owner leaves price blank.
- Availability must be set by owner; do not invent stock.
- Do not display HPP, recipe, bank data, or internal operational notes on the public site.

## Interaction rules

- Storefront CTA sends customers to catalog and checkout, never to an automatic paid order.
- Owner navigation is fixed across desktop/mobile and active state is visible.
- Critical actions (archive product, verify payment) use a confirmation dialog with clear consequence.
- Tables are horizontally scrollable on narrow screens; key actions stay accessible.
- Product forms distinguish price from HPP and explain HPP is private.
- Empty state, loading state, error state, and success feedback should use consistent components.
