import type { OwnerCart } from "./owner";

// A fixed, made-up week of carts, so the owner panel is not empty on first
// open. Shopper names are first names with an initial. Clearly sample data.

export type SampleCart = OwnerCart & { who: string; day: string; items: string };

export const SAMPLE_CARTS: SampleCart[] = [
  { who: "Marisol T.", day: "Tue", items: "Matagalpa, Rosquillas", status: "paid", wonBack: true, reminded: true, everLeft: true },
  { who: "Kevin R.", day: "Mon", items: "House espresso × 2", status: "reminded-1", wonBack: false, reminded: true, everLeft: true },
  { who: "Ana L.", day: "Mon", items: "Decaf", status: "paid", wonBack: false, reminded: false, everLeft: false },
  { who: "Jorge P.", day: "Sun", items: "Nueva Segovia", status: "paid", wonBack: true, reminded: true, everLeft: true },
  { who: "Lucía M.", day: "Sun", items: "Pinolillo × 2", status: "paid", wonBack: false, reminded: false, everLeft: false },
  { who: "Tom B.", day: "Sat", items: "Jinotega, Madriz", status: "reminded-2", wonBack: false, reminded: true, everLeft: true },
  { who: "Rosa V.", day: "Sat", items: "Matagalpa", status: "paid", wonBack: false, reminded: false, everLeft: false },
  { who: "Ian C.", day: "Fri", items: "Madriz × 2", status: "left", wonBack: false, reminded: false, everLeft: true },
  { who: "Elena G.", day: "Fri", items: "House espresso", status: "paid", wonBack: false, reminded: false, everLeft: false },
];

export const SAMPLE_HISTORY: OwnerCart[] = SAMPLE_CARTS;
