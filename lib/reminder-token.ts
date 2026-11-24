import { createHmac, timingSafeEqual } from "node:crypto";

// The reminder link carries the cart ID and an expiry, signed so it can't be
// guessed or edited. Server-only (node:crypto).

/** A link lives about as long as the Shopify cart it opens. */
export const TOKEN_DAYS = 10;

const b64 = (b: Buffer) => b.toString("base64url");
const sign = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest();

export function signCartToken(cartId: string, secret: string, nowMs: number = Date.now()): string {
  const exp = Math.floor(nowMs / 1000) + TOKEN_DAYS * 86400;
  const body = b64(Buffer.from(JSON.stringify({ c: cartId, e: exp }), "utf8"));
  return `${body}.${b64(sign(body, secret))}`;
}

export function verifyCartToken(token: string, secret: string, nowMs: number = Date.now()): string | null {
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const expected = sign(body, secret);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { c, e } = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { c?: unknown; e?: unknown };
    if (typeof c !== "string" || typeof e !== "number" || e * 1000 <= nowMs) return null;
    return c;
  } catch {
    return null;
  }
}
