// The Stripe account and Shopify store are shared with Coquimba Coffee
// (tekguyz/coquimba-coffee), whose sessions carry metadata.app = "coquimba".
// A session with no app is ours: sessions opened before this check existed.

export function isOwnSession(metadata: Record<string, string> | null | undefined): boolean {
  return !metadata?.app || metadata.app === "cart-reminders";
}
