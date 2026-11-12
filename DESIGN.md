---
name: Cart Reminders
description: Warm paper and coffee-leaf green frame a small Miami roaster. The app is calm ink and paper; the shop inside it has drawn bag labels in dusty regional colors. Green only means "came back"; ochre only means "left".
colors:
  paper: "#F4F0E8"
  surface: "#FFFFFF"
  sunk: "#ECE6DA"
  line: "#DCD3C3"
  ink: "#221E1B"
  muted: "#6A625A"
  back: "#3E5747"
  back-deep: "#2C4134"
  back-soft: "#E4E7DF"
  left: "#A2702F"
  left-deep: "#6B4518"
  left-soft: "#F0E5D1"
  sand: "#E2C79A"
  cream: "#F4EBDC"
  bone: "#FBF6EE"
  char: "#2A2320"
  roast: "#5E5148"
  cherry: "#8E3A2F"
  shade: "#4A5C47"
  gold: "#B58A43"
  clay: "#A3684A"
  sky: "#6C8290"
typography:
  display: { fontFamily: "Instrument Serif", fontSize: "2.75rem (4rem from 1024px)", fontWeight: 400, lineHeight: 1 }
  shop: { fontFamily: "Gloock", use: "the store's name, product names, the reminder email headline" }
  body: { fontFamily: "Hanken Grotesk", fontSize: "1rem", fontWeight: 400, lineHeight: 1.55 }
---

# Design rules

The rulebook for every screen. Tokens live in `app/globals.css`; hex copies for drawn images live in `lib/brand/marks.ts`. Change this file first. The look is mockup A with the v2 colors, picked by the founder on 2026-11-12 (`tekguyz-one` `docs/superpowers/specs/cart-reminders-mockups/a-opus.html`).

## The idea

Two things on one page. **Cart Reminders** (the app) is calm ink on warm paper with an italic serif, like a well-made printed card. **Coquimba Coffee** (the shop) lives inside it, in a small browser frame: cream paper, a volcano line under its header, and drawn coffee bags, one dusty color per region. The app frames the shop; they never share a color role.

## Color

1. **Coffee-leaf green** (`back`) means "came back" or "you can act": the main button, ticked chips, won-back carts. Never bright, never a gradient.
2. **Ochre** (`left`) means one thing: a cart left at checkout, and its reminders.
3. The shop's own colors (`cherry`, `char`, `cream`, `bone` and the label bands `sky`, `clay`, `gold`, `cherry`, `shade`) stay inside the shop and the reminder email.
4. `danger` only on error lines.
5. Light theme only. The demo banner is the one ink band.

## Type

Instrument Serif for the app's display and panel titles (italic for the turn of a headline). Gloock for the shop: its name, product names, the reminder headline. Hanken Grotesk for everything else. Sizes are tokens only (`text-display`, `text-headline`, `text-title`, `text-body`, `text-label`, `text-micro`); Tailwind's own sizes are off. Money uses tabular figures.

## Layout

- Landing: one column up to 1024px, two from there; max width 76rem; 16px side gutter on phones.
- Demo: from 1024px, the shop (in a browser frame with the `.example` address) on the left, the owner panel on the right. Below 1024px, two tabs, "Shop" and "Store owner"; the owner tab gets an ochre dot when something lands there.
- A "Things to try" row of five chips ticks off as the visitor goes.
- Touch targets at least 44px.

## Logo

**"Comes back"**: a cart whose path loops back to it, white on coffee-leaf green, with a sand arrow. Drawn once as `PRODUCT_MARK_SVG` in `lib/brand/marks.ts`; the favicon, home-screen icon, link preview and the landing header use it. From the picked mockup; no options page (founder's brief).

The Sample Business has its own mark (`STORE_MARK_SVG`): a volcano and a sun inside a coffee bean. It shows only inside the demo.

## Motion

Only `.arrive` on a reminder or new cart row as it lands, and `.hairline-draw` on the demo clock line. Nothing loops. Reduced motion removes both and hides nothing.
