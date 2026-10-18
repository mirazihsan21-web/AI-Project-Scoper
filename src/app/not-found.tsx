import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-16 sm:px-8 lg:px-12">
      <h1 className="text-4xl font-extrabold tracking-tight">This scope doesn&apos;t exist</h1>
      <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-moss">
        The link may be incomplete. Check that you copied all of it, or scope a new brief.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-fern px-7 py-3 text-lg font-bold text-white hover:bg-fern-dark"
      >
        Scope a brief
      </Link>
    </main>
  );
}
