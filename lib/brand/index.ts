import { colors } from "./marks";

// One code, two brands (DEMO-STANDARD.md, "A client app is one code with two
// names"). Everything that names the store lives here; BRAND picks it. Only
// the demo brand exists today. A real store gets its own entry, its own
// Shopify store (env) and the `shopify` checkout kind.

export type Brand = {
  key: string;
  /** The store's name, shown inside the demo. */
  name: string;
  /** The made-up address drawn in the demo's small browser frame. */
  address: string;
  tagline: string;
  intro: string;
  /** The made-up shopper's email, set on checkout so visitors never type their own. */
  checkoutEmail: string;
  shopperName: string;
  pickupLabel: string;
  checkout: "stripe-embedded" | "shopify";
  /** True only for the public demo: test keys only, sample data, nothing sent. */
  demo: boolean;
  colors: typeof colors;
};

const coquimba: Brand = {
  key: "coquimba",
  name: "Coquimba Coffee",
  address: "coquimba.example",
  tagline: "Roasted in Miami. Grown in Nicaragua.",
  intro: "Ship to your door, or order ahead and pick up at the roastery.",
  checkoutEmail: "dana.sample@coquimba.example",
  shopperName: "Dana",
  pickupLabel: "Pickup at the roastery",
  checkout: "stripe-embedded",
  demo: true,
  colors,
};

const brands: Record<string, Brand> = { coquimba };

export function getBrand(key = process.env.BRAND ?? "coquimba"): Brand {
  const brand = brands[key];
  if (!brand) throw new Error(`Unknown BRAND "${key}"`);
  return brand;
}

export const BRAND = getBrand();
