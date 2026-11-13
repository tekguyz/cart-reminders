import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { getService, visitorIp } from "@/lib/demo/server";
import { BackToCart } from "./back-to-cart";

// The reminder's "Back to your cart" link. It only reads: it checks the signed
// token and finds the cart in Shopify. The page then makes that cart current
// in the visitor's own storage and opens checkout.
export const dynamic = "force-dynamic";

export default async function Back({ params }: PageProps<"/demo/back/[token]">) {
  const { token } = await params;
  const found = await getService()
    .restore(token, await visitorIp())
    .catch(() => null);
  if (!found || found.state.status === "paid") {
    return (
      <main id="main" className="mx-auto grid max-w-xl flex-1 place-items-center px-4 py-24 text-center">
        <div>
          <h1 className="font-display text-headline">{found ? "That cart is already paid." : "This link has expired."}</h1>
          <p className="mt-3 text-muted">{BRAND.name} keeps a cart for a little while. Start a fresh one in the demo.</p>
          <Link href="/demo" className="mt-6 inline-flex min-h-12 items-center rounded-[10px] bg-back px-6 text-label font-semibold text-white">
            Open the demo
          </Link>
        </div>
      </main>
    );
  }
  return <BackToCart cartId={found.cart.id} />;
}
