"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown when a page fails to render, e.g. the database is unreachable while loading a scope.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-16 sm:px-8 lg:px-12">
      <h1 className="text-4xl font-extrabold tracking-tight">This page didn&apos;t load</h1>
      <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-moss">
        Something went wrong on our side. Your scope is saved, so trying again usually works.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-fern px-7 py-3 text-lg font-bold text-white hover:bg-fern-dark"
        >
          Try again
        </button>
        <Link href="/" className="font-semibold text-fern underline decoration-2 underline-offset-4 hover:text-fern-dark">
          Scope a new brief
        </Link>
      </div>
    </main>
  );
}
