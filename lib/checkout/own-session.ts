// The Stripe account and Shopify store are shared with Coquimba Coffee
// (tekguyz/coquimba-coffee), whose sessions carry metadata.app = "coquimba".
// A session with no app is ours: sessions opened before this check existed.

export function isOwnSession(metadata: Record<string, string> | null | undefined): boolean {
  return !metadata?.app || metadata.app === "cart-reminders";
}

/** A session that counts toward the hourly cap: ours, and opened for a cart. */
export function countsTowardCap(metadata: Record<string, string> | null | undefined): boolean {
  return isOwnSession(metadata) && !!metadata?.cart_id;
}

/** Counts capped sessions, stopping once `max` is reached so it never pages further than it must. */
export async function countCapped(sessions: AsyncIterable<{ metadata: Record<string, string> | null }>, max: number): Promise<number> {
  let n = 0;
  for await (const s of sessions) {
    if (countsTowardCap(s.metadata) && ++n >= max) break;
  }
  return n;
}
