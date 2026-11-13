import "server-only";
import { headers } from "next/headers";
import { getCheckout } from "@/lib/checkout";
import { fakeMode, getShop, getShopAdmin } from "@/lib/shopify";
import { createService, type Service } from "./service";

// The one service instance for this server process, wired to the real
// Shopify store and Stripe (or the fakes for local work).

const g = globalThis as unknown as { __service?: Service };

export function getService(): Service {
  if (g.__service) return g.__service;
  const secret = process.env.REMINDER_LINK_SECRET ?? (fakeMode() ? "local-fake-secret" : "");
  if (!secret) throw new Error("REMINDER_LINK_SECRET is not set");
  return (g.__service = createService({ shop: getShop(), admin: getShopAdmin(), checkout: getCheckout(), secret }));
}

/** The visitor's IP, for Shopify's buyer-IP header. */
export async function visitorIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "127.0.0.1";
}
