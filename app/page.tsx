import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { colors } from "@/lib/brand/marks";
import { ProductDrawing, ProductLogo, StoreLogo, primaryButton, secondaryButton } from "@/components/ui";

// The landing page (DEMO-STANDARD.md): it sells the app by itself, looks
// right on a phone, and has one door into the demo. "Try the demo" is a plain
// link: opening the demo writes nothing (carts are made on "Add", a POST).
// Words: no prices, no statistics, no phone (CLAUDE.md).

const steps = [
  { n: "1", title: "They shop", body: "Your products, in a store built for your business, on any phone." },
  { n: "2", title: "They leave at checkout", body: "It happens all day. The shop notices and keeps their cart." },
  { n: "3", title: "A reminder brings them back", body: "One short email or text, then a last one, then it stops. They tap once and pay." },
];

const parts = [
  { title: "Online ordering", body: "Customers pick, pay and choose pickup or delivery. Orders land where you already work." },
  { title: "A store that fits", body: "Your products come from your store system and show in a site made for you, not a stock template." },
  { title: "Carts that come back", body: "Left carts get a friendly reminder, and you see how many were left and how many came back." },
];

export default function Home() {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[76rem] items-center justify-between px-4 py-4 sm:px-8">
          <ProductLogo />
          <Link href="/demo" className={secondaryButton}>
            Try the demo
          </Link>
        </div>
      </header>

      <main id="main" className="flex-1">
        <section className="mx-auto grid max-w-[76rem] items-center gap-10 px-4 pt-12 pb-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-20 lg:pb-20">
          <div>
            <h1 className="font-display text-display">
              The shopper left. <em className="text-back">The cart came back.</em>
            </h1>
            <p className="mt-5 max-w-[34ch] text-[1.1875rem] leading-relaxed text-muted">
              A store built to fit your business. Customers order and pay online. When someone leaves at checkout, your shop sends a friendly reminder and takes them straight back to their cart.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/demo" className={primaryButton}>
                Try the demo
              </Link>
              <span className="text-label text-muted">No sign-up. Opens a sample coffee shop.</span>
            </div>
          </div>
          <Stage />
        </section>

        <section aria-label="How it works" className="border-y border-line">
          <ol className="mx-auto grid max-w-[76rem] sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.n} className={`px-4 py-8 sm:px-8 ${i > 0 ? "border-t border-line sm:border-t-0 sm:border-l" : ""}`}>
                <span className="font-display text-[2.5rem] leading-none text-back">{s.n}</span>
                <h2 className="mt-2 text-title font-semibold">{s.title}</h2>
                <p className="mt-1.5 text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-[76rem] px-4 py-14 sm:px-8 lg:py-20">
          <h2 className="max-w-[22ch] font-display text-headline lg:text-[2.5rem]">Three things a small shop needs online, built as one.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {parts.map((p) => (
              <div key={p.title} className="rounded-xl border border-line bg-surface p-5">
                <h3 className="text-title font-semibold">{p.title}</h3>
                <p className="mt-2 text-muted">{p.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-[60ch] text-muted">
            <strong className="font-semibold text-ink">Real parts, in test mode.</strong> The sample shop&rsquo;s products and carts live in Shopify, and payment runs through Stripe. In the demo nothing is charged and no email or text is sent.
          </p>
        </section>

        <section className="bg-ink text-paper">
          <div className="mx-auto flex max-w-[76rem] flex-col items-start gap-6 px-4 py-14 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-headline lg:text-[2.5rem]">Shop, leave, come back.</p>
              <p className="mt-2 max-w-[44ch] text-paper-dim">Play the shopper and the store owner at {BRAND.name}, a made-up roaster in Miami.</p>
            </div>
            <Link href="/demo" className={`${primaryButton} bg-sand text-ink hover:bg-sand-deep`}>
              Try the demo
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-3 px-4 py-5 text-label text-muted sm:px-8">
          <span>Cart Reminders</span>
          <span>
            Built by{" "}
            <a href="https://tekguyz.com" className="inline-flex min-h-11 items-center underline underline-offset-4">
              TEKGUYZ
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}

/** The hero picture: a left cart, the reminder, and the path back (mockup A). Drawn, not a screenshot. */
function Stage() {
  return (
    <div aria-hidden className="relative mx-auto h-[27rem] w-full max-w-[34rem] sm:h-[25rem]">
      <svg viewBox="0 0 500 400" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d="M290 150C420 150 440 230 390 250" fill="none" stroke={colors.back} strokeWidth="2" strokeDasharray="5 6" />
        <path d="M120 360C40 360 30 260 90 230" fill="none" stroke={colors.back} strokeWidth="2" strokeDasharray="5 6" />
        <path d="M84 238 92 228l8 8" fill="none" stroke={colors.back} strokeWidth="2" />
      </svg>
      <div className="absolute top-6 left-0 w-[86%] sm:w-[62%] rounded-xl border border-line bg-surface p-4 shadow-[0_20px_40px_-26px_rgba(0,0,0,0.4)]">
        <p className="mb-2 text-micro font-semibold tracking-[0.08em] text-muted uppercase">Cart · left at checkout</p>
        {[
          { name: "Jinotega, whole bean", q: 1, band: colors.sky },
          { name: "Madriz natural", q: 2, band: colors.cherry },
        ].map((r, i) => (
          <div key={r.name} className={`flex items-center gap-3 py-2 text-label ${i ? "border-t border-hair" : ""}`}>
            <ProductDrawing drawing="bag" band={r.band} className="h-11 w-9" />
            {r.name}
            <span className="ml-auto text-muted">× {r.q}</span>
          </div>
        ))}
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-left-soft px-2.5 py-1 text-micro font-semibold text-left-deep">
          <i className="size-1.5 rounded-full bg-current" />
          Left 1 hour ago
        </span>
      </div>
      <div className="absolute right-0 bottom-2 w-[82%] sm:w-[66%] rounded-xl border border-line border-t-4 border-t-cherry bg-surface p-4 shadow-[0_20px_40px_-26px_rgba(0,0,0,0.4)]">
        <StoreLogo size="size-5" className="text-[1rem]" />
        <p className="mt-2 font-shop text-[1.35rem] leading-tight text-char">Your coffee is still waiting</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-lg bg-char px-3.5 py-2.5 text-micro font-semibold text-bone">Back to your cart</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-back-soft px-2.5 py-1 text-micro font-semibold text-back-deep">
            <i className="size-1.5 rounded-full bg-current" />
            Came back
          </span>
        </div>
      </div>
    </div>
  );
}
