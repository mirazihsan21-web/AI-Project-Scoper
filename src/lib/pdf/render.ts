import path from "node:path";
import { Font, renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { StoredScope } from "@/lib/db/scopes";
import { scopeUrl } from "@/lib/urls";
import { ScopeDocument } from "./ScopeDocument";

// Static TTFs (react-pdf cannot use the variable or woff2 web fonts). Traced for deployment in next.config.ts.
const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");

let fontsRegistered = false;

function registerFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: "Schibsted",
    fonts: [
      { src: path.join(FONT_DIR, "SchibstedGrotesk-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "SchibstedGrotesk-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(FONT_DIR, "SchibstedGrotesk-ExtraBold.ttf"), fontWeight: 800 },
    ],
  });
  // react-pdf hyphenates long words by default, which breaks feature names mid-word.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

/** Renders the scope as an A4 PDF; `appUrl` builds the "view online" link in the footer. */
export async function renderScopePdf(stored: StoredScope, appUrl: string): Promise<Uint8Array<ArrayBuffer>> {
  registerFonts();
  const document = createElement(ScopeDocument, {
    stored,
    scopeUrl: scopeUrl(appUrl, stored.id),
  }) as unknown as ReactElement<DocumentProps>;
  return new Uint8Array(await renderToBuffer(document));
}

/** "Yoga Studio Booking & Payments" → "yoga-studio-booking-payments-scope.pdf". */
export function pdfFilename(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return slug ? `${slug}-scope.pdf` : "project-scope.pdf";
}
