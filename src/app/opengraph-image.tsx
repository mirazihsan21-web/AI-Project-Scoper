import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND_NAME } from "@/lib/brand";

// Link-preview card (LinkedIn, Slack, WhatsApp, X). Built once at build time; scope pages inherit it.
export const alt = `${BRAND_NAME}: turn a rough brief into a project scope`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fonts = join(process.cwd(), "src/lib/pdf/fonts");

export default async function Image() {
  const [extraBold, regular] = await Promise.all([
    readFile(join(fonts, "SchibstedGrotesk-ExtraBold.ttf")),
    readFile(join(fonts, "SchibstedGrotesk-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px 120px",
          background: "linear-gradient(to bottom, #e3f0ec, #f1f6ec)",
          fontFamily: "Schibsted",
          color: "#1d3a2a",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* LeafMark (src/components/nature.tsx) */}
          <svg width="132" height="132" viewBox="2 3 28 28">
            <path d="M16 29V15" stroke="#2e7a44" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M16 17C16 10 11 6 4 6c0 7 5 11 12 11Z" fill="#78b464" />
            <path d="M16 14c0-6 4.5-10 12-10 0 6.5-4.5 10-12 10Z" fill="#2e7a44" />
          </svg>
          <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -3 }}>{BRAND_NAME}</div>
        </div>
        <div style={{ marginTop: 36, fontSize: 40, color: "#4b6352", maxWidth: 900, lineHeight: 1.3 }}>
          Paste a rough brief. Get features, risks, milestones and a price range.
        </div>
        {/* Hills from the home page landscape */}
        <svg
          width="1200"
          height="150"
          viewBox="0 140 1440 120"
          preserveAspectRatio="none"
          style={{ position: "absolute", left: 0, bottom: 0 }}
        >
          <path d="M0 170C180 120 360 135 540 160s360 25 540-10 270-40 360-20V260H0Z" fill="#cfe6be" />
          <path d="M0 200c220-55 420-30 600 0s400 30 560-10 210-30 280-20V260H0Z" fill="#a7d18a" />
          <path d="M0 228c180-35 380-25 560 0s420 20 600-5 220-15 280-5V260H0Z" fill="#78b464" />
          <path d="M0 246c240-18 520-12 760 2s460 8 680-6V260H0Z" fill="#4e8d4f" />
        </svg>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Schibsted", data: extraBold, weight: 800, style: "normal" },
        { name: "Schibsted", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
