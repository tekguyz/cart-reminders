import { DemoApp } from "@/components/demo/demo-app";
import { fakeMode, getShop } from "@/lib/shopify";

// The demo. Reading the catalog is the only thing this GET does; carts are
// made by Server Actions (POST) when the visitor presses "Add".
export const dynamic = "force-dynamic";

export default async function DemoPage({ searchParams }: PageProps<"/demo">) {
  const { checkout } = await searchParams;
  let products: Awaited<ReturnType<ReturnType<typeof getShop>["listProducts"]>> = [];
  let down = false;
  try {
    products = await getShop().listProducts();
  } catch {
    down = true;
  }
  if (down) {
    return (
      <main className="mx-auto grid max-w-xl flex-1 place-items-center px-4 py-24 text-center">
        <div>
          <h1 className="font-display text-headline">The sample store is not connected.</h1>
          <p className="mt-3 text-muted">The demo&rsquo;s Shopify store did not answer. Try again in a moment.</p>
        </div>
      </main>
    );
  }
  return <DemoApp products={products} fake={fakeMode()} openCheckoutOnLoad={checkout === "1"} />;
}
