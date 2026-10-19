import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Scope links are private-by-obscurity; never send their path to other sites.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          // No script-src: Next.js needs inline scripts, and nonces would force every page to render dynamically.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
        ],
      },
      {
        // Scope pages and their PDFs hold private briefs. The <meta robots> tag is streamed into the body with the
        // rest of the scope's metadata, which crawlers may ignore, so say it in a header that cannot be missed.
        source: "/s/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  // The PDF renderer reads these fonts from disk at runtime, so they must ship with the API functions.
  outputFileTracingIncludes: {
    "/api/**": ["./src/lib/pdf/fonts/**"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
