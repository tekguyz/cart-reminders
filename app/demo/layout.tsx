import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

// Every demo screen is kept out of search (DEMO-STANDARD.md, Search engines).
export const metadata: Metadata = {
  title: { default: `Demo: ${BRAND.name}`, template: "%s · Cart Reminders" },
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return children;
}
