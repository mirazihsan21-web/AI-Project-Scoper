import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-16 sm:px-8">
      <h1 className="text-4xl font-extrabold tracking-tight">This scope doesn&apos;t exist</h1>
      <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-ink-soft">
        The link may be incomplete. Check that you copied all of it, or scope a new brief.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-pen px-6 py-3 text-lg font-bold text-white hover:bg-pen-dark"
      >
        Scope a brief
      </Link>
    </main>
  );
}
