import { getShopAdmin } from "@/lib/shopify";

// Daily (vercel.json): deletes demo orders older than 7 days from the Shopify
// development store (DEMO-STANDARD.md rule 8). Shopify carts expire by
// themselves; Stripe test data costs nothing and is left.

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const before = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const deleted = await getShopAdmin().deleteDemoOrdersBefore(before);
  return Response.json({ deleted });
}
