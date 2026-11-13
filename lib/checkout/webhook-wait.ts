// The page's onComplete writes the order. The webhook is only a backup for a
// shopper who closed the tab, so it waits: answering "not yet" makes Stripe
// retry later. Two servers writing at the same moment could make two orders,
// because Shopify's order search lags (final review, finding I1).
export const WEBHOOK_WAIT_SECONDS = 120;

export function webhookMayComplete(eventCreatedSec: number, nowSec: number): boolean {
  return nowSec - eventCreatedSec >= WEBHOOK_WAIT_SECONDS;
}
