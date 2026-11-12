import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PRODUCT_MARK_SVG, bagSvg, colors } from "@/lib/brand/marks";
import { siteName } from "@/lib/site";

// The link-preview card, drawn by the app in its own look (DEMO-STANDARD.md):
// the headline on ink, and the reminder that brings a cart back.
export const alt = `${siteName}. The shopper left. The cart came back: an online store whose left carts get a friendly reminder.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontDir = join(process.cwd(), "app/_og");
const [serif, serifItalic, body400, body600, shop] = await Promise.all([
  readFile(join(fontDir, "instrument-serif-400.woff")),
  readFile(join(fontDir, "instrument-serif-italic.woff")),
  readFile(join(fontDir, "hanken-400.woff")),
  readFile(join(fontDir, "hanken-600.woff")),
  readFile(join(fontDir, "gloock-400.woff")),
]);

const svg = (s: string) => `data:image/svg+xml,${encodeURIComponent(s)}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: colors.ink, color: colors.paper, fontFamily: "Hanken", padding: "60px 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={svg(PRODUCT_MARK_SVG)} width={54} height={54} alt="" />
            <div style={{ fontSize: 30, fontWeight: 600 }}>{siteName}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 46, fontFamily: "Instrument", fontSize: 84, lineHeight: 1 }}>
            <span>The shopper left.</span>
            <span style={{ fontStyle: "italic", color: colors.sand }}>The cart came back.</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 27, color: "#C9C1B5", maxWidth: 560 }}>An online store with ordering, payment and friendly cart reminders.</div>
          <div style={{ display: "flex", marginTop: "auto" }}>
            <div style={{ display: "flex", padding: "14px 26px", borderRadius: 12, background: colors.sand, color: colors.ink, fontSize: 24, fontWeight: 600 }}>Try the demo · no sign-up</div>
          </div>
        </div>
        <div style={{ display: "flex", width: 330, marginLeft: 30, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", width: 330, borderRadius: 20, background: colors.bone, color: colors.char, borderTop: `8px solid ${colors.cherry}`, padding: "26px 26px 28px", gap: 14 }}>
            <span style={{ fontSize: 17, color: colors.muted }}>Coquimba Coffee · reminder</span>
            <span style={{ fontFamily: "Gloock", fontSize: 32, lineHeight: 1.1 }}>Your coffee is still waiting</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 12, padding: "10px 14px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={svg(bagSvg(colors.sky))} width={44} height={55} alt="" />
              <span style={{ fontSize: 19 }}>Jinotega · whole bean</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ display: "flex", padding: "11px 16px", borderRadius: 9, background: colors.cherry, color: "#fff", fontSize: 18, fontWeight: 600 }}>Back to your cart</div>
              <div style={{ display: "flex", padding: "6px 12px", borderRadius: 99, background: colors.backSoft, color: colors.backDeep, fontSize: 16, fontWeight: 600 }}>Came back</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument", data: serif, weight: 400, style: "normal" },
        { name: "Instrument", data: serifItalic, weight: 400, style: "italic" },
        { name: "Hanken", data: body400, weight: 400, style: "normal" },
        { name: "Hanken", data: body600, weight: 600, style: "normal" },
        { name: "Gloock", data: shop, weight: 400, style: "normal" },
      ],
    },
  );
}
