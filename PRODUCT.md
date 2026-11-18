# Product

<!-- impeccable:product-schema 1 -->

Drafted 2026-11-18 from `tekguyz-one/projects/cart-reminders/about.md`, which wins if the two disagree.

## Platform

web

## Users

Visitors to a TEKGUYZ demo: owners of small shops that sell online or want to (a roaster, a boutique, a food maker). They play two roles in the demo: the shopper, who gets a short reminder that takes them straight back to their cart, and the owner, who sees carts started, left, reminded and won back.

## Product Purpose

A landing page and a one-click demo of an online store whose left carts come back. Line: "The shopper left. The cart came back." Success: an owner sees, in a minute, that a store built to fit their business can win back a sale they never knew they lost.

## Positioning

A store built to fit the business, not a plugin: the shop, the checkout and the reminders are one piece, and the owner sees the numbers.

## Operating Context

The demo runs as Coquimba Coffee, a made-up coffee roaster in Miami. Products and carts come from a real Shopify store; payment is Stripe embedded checkout in test mode. A demo clock lets the visitor skip ahead 1 hour and 24 hours to read the two reminders.

## Capabilities and Constraints

- Never charges a card; live Stripe keys are refused.
- Never sends an email or a text; the reminder is drawn on screen and marked "Not sent".
- Never sets a visitor cookie, so it works inside a frame.
- Two reminders (1 hour, 24 hours), then it stops.

## Brand Commitments

- The shipped look in `DESIGN.md` is binding. This is a shipped demo: never restyle it or roll a new visual world unless the founder names this demo and asks for that (`claude-config/LOOKS.md`, rule 1).
- Say: "The shopper left. The cart came back." "A store built to fit the business." "Reminders are drawn on screen, never sent."
- Never say anything is sent or charged, or that Coquimba Coffee is real.

## Evidence on Hand

Real Shopify products in the demo store. No customers, testimonials or numbers exist: never show a TEKGUYZ price, a statistic or a phone number.

## Product Principles

- Show the whole loop in one sitting: add, leave, skip ahead, come back, pay.
- Honest about the demo: every simulated step says so.
- The owner's numbers are the payoff; make them easy to read.
