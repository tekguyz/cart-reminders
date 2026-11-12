// Writes docs/banner.svg from the product mark (README-STANDARD.md). Run: npx tsx scripts/make-banner.ts
import { writeFileSync } from "node:fs";
import { PRODUCT_MARK_SVG, colors } from "../lib/brand/marks";

const mark = PRODUCT_MARK_SVG.replace("<svg ", '<svg x="80" y="96" width="108" height="108" ');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 300" width="1280" height="300"><rect width="1280" height="300" fill="${colors.paper}"/>${mark}<text x="216" y="148" font-family="Georgia, serif" font-size="64" fill="${colors.back}">Cart Reminders</text><text x="218" y="198" font-family="Arial, sans-serif" font-size="28" fill="${colors.ink}">The shopper left. The cart came back.</text><rect y="298" width="1280" height="2" fill="${colors.back}"/></svg>\n`;
writeFileSync("docs/banner.svg", svg);
console.log("Wrote docs/banner.svg");
