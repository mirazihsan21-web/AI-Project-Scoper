/**
 * The visitor's IP as reported by the hosting proxy. On Vercel, x-real-ip and x-forwarded-for are set by
 * the platform. Locally, the Next.js server sets x-forwarded-for to the loopback address (::1).
 */
export function clientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
