import Stripe from "stripe";
import { getService } from "@/lib/demo/server";

// Backup path for writing the Shopify order when a checkout completes. The
// main path is the page's own onComplete call; both are idempotent. Vercel
// blocks webhooks to protected preview URLs, so this only runs on production.

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return new Response("Not set up", { status: 503 });
  let event: Stripe.Event;
  try {
    event = new Stripe(key).webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    await getService().completeOrder(event.data.object.id, "127.0.0.1");
  }
  return Response.json({ received: true });
}
