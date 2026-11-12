// The product's public address and the words every link preview uses.
// The product has a plain name, never TEKGUYZ (DEMO-STANDARD.md). The demo
// plays a made-up Sample Business: see lib/brand/index.ts.

export const siteName = "Cart Reminders";
export const siteTagline = "The shopper left. The cart came back.";
export const siteDescription =
  "An online store built to fit the business. Customers order and pay online, and a shopper who leaves at checkout gets a friendly reminder that takes them straight back to their cart. Try the one-click demo.";

/**
 * The address search engines and link previews should use. On Vercel this is
 * the project's production domain (or SITE_URL when the domain differs);
 * locally it is localhost.
 */
export function siteUrl(): URL {
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL);
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(production ? `https://${production}` : "http://localhost:3000");
}
