import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import Link from "next/link";
import { LeafMark } from "@/components/nature";
import { BRAND_NAME } from "@/lib/brand";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${BRAND_NAME}: turn a rough brief into a project scope`, template: `%s | ${BRAND_NAME}` },
  description:
    "Paste a client email, call notes or a chat. Get features by priority, integrations, risks, milestones and a price range.",
};

export const viewport: Viewport = { themeColor: "#f1f6ec" };

// One gutter for every full-width row, so the logo, content and footer line up on every screen size.
const GUTTER = "px-5 sm:px-8 lg:px-12";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${schibsted.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className={`relative z-10 w-full ${GUTTER} pt-5`}>
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-extrabold tracking-tight text-forest">
            <LeafMark className="size-8" />
            {BRAND_NAME}
          </Link>
        </header>
        <div className="flex-1">{children}</div>
        <footer className={`w-full ${GUTTER} border-t border-rule py-8 text-sm text-moss`}>
          Estimates use assumed rates and are a starting point for a conversation, not a quote.
        </footer>
      </body>
    </html>
  );
}
