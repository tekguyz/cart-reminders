import "server-only";
import { adminTokenSource, createShopAdmin } from "./admin";
import { createFakeAdmin, createFakeShop } from "./fake";
import { createStorefrontShop } from "./storefront";
import type { Shop, ShopAdmin } from "./types";

// Picks the real Shopify store from env, or the fake for local work
// (SHOP_MODE=fake). The fake is refused on Vercel production.

export function fakeMode(): boolean {
  if (process.env.SHOP_MODE !== "fake") return false;
  if (process.env.VERCEL_ENV === "production") throw new Error("SHOP_MODE=fake is not allowed in production");
  return true;
}

// One instance per server process, so the fake keeps its carts between requests.
const g = globalThis as unknown as { __shop?: Shop; __admin?: ShopAdmin };

export function getShop(): Shop {
  if (g.__shop) return g.__shop;
  if (fakeMode()) return (g.__shop = createFakeShop());
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  if (!domain || !token) throw new Error("Shopify is not set up: SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_PRIVATE_TOKEN");
  return (g.__shop = createStorefrontShop({ domain, token }));
}

export function getShopAdmin(): ShopAdmin {
  if (g.__admin) return g.__admin;
  if (fakeMode()) return (g.__admin = createFakeAdmin());
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) throw new Error("Shopify is not set up: SHOPIFY_STORE_DOMAIN");
  return (g.__admin = createShopAdmin({ domain, getToken: adminTokenSource(process.env) }));
}

export type { Attr, Cart, CartLine, Product, Shop, ShopAdmin, Variant } from "./types";
