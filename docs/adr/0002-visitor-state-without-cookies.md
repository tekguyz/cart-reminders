# Visitor state without cookies

The demo must work inside the portfolio's frame on an iPhone, and Safari blocks third-party cookies in frames. So the visitor's cart IDs live in the page's own storage (`localStorage`, which a frame still gets, partitioned by the top site), with an in-memory fallback when storage is blocked. Each cart's demo state (status, when it was left, the demo clock, the Stripe session, won back, the order number) is kept on the Shopify cart as attributes whose keys start with `_cr_`, so the server trusts Shopify, not the browser.

A cart ID is a long random Shopify ID. Knowing it is the only way to read that cart, and the server only reads carts the page names.
