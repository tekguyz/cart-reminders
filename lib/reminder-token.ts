import { createHmac, timingSafeEqual } from "node:crypto";

// The reminder link carries the cart ID, signed so it can't be guessed or
// edited. Server-only (node:crypto).

const b64 = (b: Buffer) => b.toString("base64url");

export function signCartToken(cartId: string, secret: string): string {
  const body = b64(Buffer.from(cartId, "utf8"));
  const sig = b64(createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyCartToken(token: string, secret: string): string | null {
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return Buffer.from(body, "base64url").toString("utf8");
}
