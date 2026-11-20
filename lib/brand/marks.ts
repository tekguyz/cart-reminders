// The marks and drawings, drawn once. The favicon (app/icon.svg), the
// home-screen icon, the link preview, the README banner, the logo on the page
// and the product labels all use these.
//
// An SVG string cannot read CSS variables, so these hex values copy the
// tokens in app/globals.css. Change both together (DESIGN.md first).

export const colors = {
  paper: "#F4F0E8",
  surface: "#FFFFFF",
  line: "#DCD3C3",
  ink: "#221E1B",
  muted: "#6A625A",
  back: "#3E5747",
  backDeep: "#2C4134",
  backSoft: "#E4E7DF",
  left: "#A2702F",
  leftSoft: "#F0E5D1",
  sand: "#E2C79A",
  // the shop
  cream: "#F4EBDC",
  bone: "#FBF6EE",
  char: "#2A2320",
  cherry: "#8E3A2F",
  shade: "#4A5C47",
  gold: "#B58A43",
  clay: "#A3684A",
  sky: "#6C8290",
} as const;

/** Product mark, "Comes back": a cart whose path loops back to it, on coffee-leaf green. */
export const PRODUCT_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${colors.back}"/><path d="M7.5 10H10l2.2 9.5h9.6l1.8-6.5H11.2" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><circle cx="13.4" cy="23.4" r="1.7" fill="#fff"/><circle cx="20.6" cy="23.4" r="1.7" fill="#fff"/><path d="M24.8 8.6a4.2 4.2 0 1 0-1.2 3.2" fill="none" stroke="${colors.sand}" stroke-width="2" stroke-linecap="round"/><path d="M25.6 6.6 25 9.4l-2.6-.8" fill="none" stroke="${colors.sand}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** The Sample Business's own mark: a volcano and a sun inside a coffee bean. Shown only in the demo. */
export const STORE_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><ellipse cx="16" cy="16" rx="12" ry="14.5" fill="${colors.char}"/><path d="M8 22l6-9 3 3 2-3 5 9z" fill="${colors.cream}"/><circle cx="21" cy="9.5" r="2.6" fill="${colors.gold}"/><path d="M16 3q-4 13 0 26" fill="none" stroke="${colors.cherry}" stroke-width="1.4"/></svg>`;

/** A coffee bag label in one band color. */
export function bagSvg(band: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100"><path d="M14 14h52l4 82q0 2-2 2H12q-2 0-2-2z" fill="${colors.bone}" stroke="${colors.char}" stroke-width="1.6"/><path d="M14 14h52l-2-8H16z" fill="${band}" stroke="${colors.char}" stroke-width="1.6"/><path d="M22 10h36" stroke="${colors.bone}" stroke-width="1.2" stroke-dasharray="2 2"/><text x="40" y="25.5" text-anchor="middle" font-family="Gloock, Georgia, serif" font-size="6.4" letter-spacing=".6" fill="${colors.char}">SEGOVIA</text><rect x="18" y="30" width="44" height="52" rx="3" fill="${band}"/><path d="M18 66l12-14 5 5 9-13 18 22z" fill="${colors.char}" opacity=".9"/><path d="M41 47l3-3 3 3" fill="none" stroke="${colors.bone}" stroke-width="1.2"/><circle cx="51" cy="38" r="4" fill="${colors.bone}" opacity=".85"/><rect x="22" y="70" width="36" height="3" rx="1.5" fill="${colors.bone}"/><rect x="26" y="76" width="28" height="2" rx="1" fill="${colors.bone}" opacity=".7"/></svg>`;
}

/** A cup, for drinks made at the roastery. */
export function cupSvg(band: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100"><path d="M18 34h44l-5 56q-1 4-5 4H28q-4 0-5-4z" fill="${band}" stroke="${colors.char}" stroke-width="1.6"/><rect x="15" y="26" width="50" height="9" rx="3" fill="${colors.bone}" stroke="${colors.char}" stroke-width="1.6"/><path d="M26 54h28M28 62h24" stroke="${colors.bone}" stroke-width="2" stroke-linecap="round"/><path d="M34 20q4-6 0-12M44 20q4-6 0-12" fill="none" stroke="${colors.char}" stroke-width="1.4" stroke-linecap="round" opacity=".5"/></svg>`;
}

/** A basket of rosquillas (baked corn and cheese rings). */
export function ringsSvg(band: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100"><path d="M10 52h60l-6 36q-1 4-5 4H21q-4 0-5-4z" fill="${band}" stroke="${colors.char}" stroke-width="1.6"/><path d="M16 64h48M18 76h44" stroke="${colors.char}" stroke-width="1" opacity=".35"/><g fill="${colors.gold}" stroke="${colors.char}" stroke-width="1.4"><circle cx="28" cy="44" r="10"/><circle cx="52" cy="44" r="10"/><circle cx="40" cy="36" r="10"/></g><g fill="${colors.bone}" stroke="${colors.char}" stroke-width="1.2"><circle cx="28" cy="44" r="3.6"/><circle cx="52" cy="44" r="3.6"/><circle cx="40" cy="36" r="3.6"/></g></svg>`;
}

export type Drawing = "bag" | "cup" | "rings";

export function drawingSvg(kind: Drawing, band: string): string {
  return kind === "cup" ? cupSvg(band) : kind === "rings" ? ringsSvg(band) : bagSvg(band);
}
