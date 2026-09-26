import type { Metadata } from "next";
import Link from "next/link";
import { hillLists } from "@/lib/hills";

export const metadata: Metadata = { title: "Page not found" };

// Shown for any unknown address, and for a list the site doesn't track
// (/lists/corbetts), so it points back to what does exist.
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:py-20">
      <p className="text-sm font-medium text-brand">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">No summit here</h1>
      <p className="mt-3 max-w-xl text-muted">
        That page doesn&apos;t exist. The address may be mistyped, or it&apos;s a hill list this
        site doesn&apos;t track.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          Browse the lists
        </Link>
        <Link
          href="/map"
          className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold hover:border-brand"
        >
          Open the map
        </Link>
      </div>

      <h2 className="mt-12 text-sm font-medium text-muted">The lists this site tracks</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {hillLists.map((list) => (
          <li key={list.id}>
            <Link
              href={`/lists/${list.id}`}
              className="block rounded-lg border border-line bg-surface px-4 py-3 hover:border-brand"
            >
              <span className="font-medium">{list.name}</span>
              <span className="block text-sm text-muted">{list.region}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
