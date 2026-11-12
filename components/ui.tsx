import { BRAND } from "@/lib/brand";
import { PRODUCT_MARK_SVG, STORE_MARK_SVG, drawingSvg, type Drawing } from "@/lib/brand/marks";
import { siteName } from "@/lib/site";

// Shared pieces for the landing page and the demo. Button looks are 44px tall at least.

export const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-back px-6 text-label font-semibold text-white transition-colors duration-150 hover:bg-back-deep disabled:opacity-60";
export const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-line bg-surface px-5 text-label font-semibold text-ink transition-colors duration-150 hover:bg-sunk disabled:opacity-60";
export const shopButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-char px-4 text-label font-semibold text-bone transition-colors duration-150 hover:bg-roast disabled:opacity-60";

// The marks are one SVG source each (lib/brand/marks.ts), drawn inline.
export function Mark({ svg, className }: { svg: string; className: string }) {
  return <span aria-hidden className={`inline-block shrink-0 [&>svg]:h-full [&>svg]:w-full ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function ProductLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-[1.0625rem] font-bold tracking-tight ${className}`}>
      <Mark svg={PRODUCT_MARK_SVG} className="size-8" />
      {siteName}
    </span>
  );
}

export function StoreLogo({ className = "", size = "size-7" }: { className?: string; size?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-shop text-[1.3rem] leading-none text-char ${className}`}>
      <Mark svg={STORE_MARK_SVG} className={size} />
      {BRAND.name}
    </span>
  );
}

export function ProductDrawing({ drawing, band, className }: { drawing: Drawing; band: string; className: string }) {
  return <Mark svg={drawingSvg(drawing, band)} className={className} />;
}

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
/** Sample prices, in cents, shown only inside the shop and the cart. */
export function money(cents: number): string {
  return fmt.format(cents / 100);
}
