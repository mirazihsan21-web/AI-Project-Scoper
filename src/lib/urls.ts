/** The public share link for a scope, e.g. https://example.com/s/<uuid>. */
export function scopeUrl(appUrl: string, scopeId: string): string {
  return `${appUrl.replace(/\/+$/, "")}/s/${scopeId}`;
}
