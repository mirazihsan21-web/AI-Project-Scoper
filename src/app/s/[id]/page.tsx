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

/**
 * Placeholder in the shape of the finished page and at least a screen tall, so nothing visible moves
 * when the scope streams in (a one-line placeholder gave a desktop CLS of 0.82 in Lighthouse).
 */
function ScopeSkeleton() {
  const bar = "rounded-lg bg-rule/60";
  return (
    <div aria-busy="true" className="mt-6 min-h-svh animate-pulse motion-reduce:animate-none">
      <p className="sr-only">Loading your scope…</p>
      <div className={`h-11 w-3/4 max-w-2xl sm:h-14 ${bar}`} />
      <div className={`mt-5 h-5 w-full max-w-3xl ${bar}`} />
      <div className={`mt-2 h-5 w-2/3 max-w-2xl ${bar}`} />
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="leaf h-96 lg:col-start-2 lg:row-start-1" />
        <div className="space-y-4 lg:col-start-1 lg:row-start-1">
          <div className={`h-7 w-48 ${bar}`} />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-16 ${bar}`} />
          ))}
        </div>
      </div>
    </div>
  );
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
      <Suspense fallback={<ScopeSkeleton />}>
        <ScopeContent params={props.params} />
      </Suspense>
    </main>
  );
}
