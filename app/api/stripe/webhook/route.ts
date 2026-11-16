import Stripe from "stripe";
import { isOwnSession } from "@/lib/checkout/own-session";
import { webhookMayComplete } from "@/lib/checkout/webhook-wait";
import { getService } from "@/lib/demo/server";

// Backup path for writing the Shopify order when a checkout completes. The
// main path is the page's own onComplete call; it waits two minutes so it never races the page (lib/checkout/webhook-wait.ts). Vercel
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
    // The Stripe account is shared with Coquimba Coffee: skip its sessions.
    if (!isOwnSession(event.data.object.metadata)) return Response.json({ received: true, ignored: true });
    // Too soon: the page is still writing the order. Stripe retries later.
    if (!webhookMayComplete(event.created, Math.floor(Date.now() / 1000))) return new Response("Not yet", { status: 503 });
    await getService().completeOrder(event.data.object.id, "127.0.0.1");
  }
  return Response.json({ received: true });
}
