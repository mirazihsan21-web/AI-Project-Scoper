import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import Link from "next/link";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${schibsted.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="mx-auto w-full max-w-3xl px-5 pt-6 sm:px-8">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-ink">
            {BRAND_NAME}
          </Link>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="mx-auto w-full max-w-3xl px-5 py-10 text-sm text-ink-soft sm:px-8">
          Estimates use assumed rates and are a starting point for a conversation, not a quote.
        </footer>
      </body>
    </html>
  );
}
