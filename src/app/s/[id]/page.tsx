import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ScopeView } from "@/components/ScopeView";
import { loadScope } from "@/lib/db/load-scope";

export async function generateMetadata(props: PageProps<"/s/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const stored = await loadScope(id);
  return {
    title: stored?.scope.projectTitle ?? "Scope not found",
    // Briefs can hold private business details; share links work, search engines stay out.
    robots: { index: false, follow: false },
  };
}

async function ScopeContent({ params }: Pick<PageProps<"/s/[id]">, "params">) {
  const { id } = await params;
  const stored = await loadScope(id);
  if (!stored) notFound();
  return <ScopeView stored={stored} />;
}

export default function ScopePage(props: PageProps<"/s/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 sm:px-8 lg:px-12">
      <Link
        href="/"
        className="font-semibold text-fern underline decoration-2 underline-offset-4 hover:text-fern-dark"
      >
        Scope another brief
      </Link>
      <Suspense fallback={<p className="mt-10 text-lg text-moss">Loading your scope…</p>}>
        <ScopeContent params={props.params} />
      </Suspense>
    </main>
  );
}
