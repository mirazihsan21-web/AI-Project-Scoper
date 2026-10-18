import { loadScope } from "@/lib/db/load-scope";
import { scopePdf } from "@/lib/pdf/cached";
import { pdfFilename } from "@/lib/pdf/render";

export async function GET(request: Request, ctx: RouteContext<"/api/scope/[id]/pdf">) {
  const { id } = await ctx.params;
  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  const [stored, pdf] = await Promise.all([loadScope(id), scopePdf(id, appUrl)]);
  if (!stored || !pdf) return Response.json({ error: "This scope doesn't exist." }, { status: 404 });

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename(stored.scope.projectTitle)}"`,
      // A scope never changes, but share links are unlisted, so keep it out of shared caches.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
