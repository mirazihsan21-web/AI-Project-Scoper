import { loadScope } from "@/lib/db/load-scope";
import { pdfFilename, renderScopePdf } from "@/lib/pdf/render";

export async function GET(request: Request, ctx: RouteContext<"/api/scope/[id]/pdf">) {
  const { id } = await ctx.params;
  const stored = await loadScope(id);
  if (!stored) return Response.json({ error: "This scope doesn't exist." }, { status: 404 });

  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  const pdf = await renderScopePdf(stored, appUrl);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename(stored.scope.projectTitle)}"`,
      // A scope never changes, but share links are unlisted, so keep it out of shared caches.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
