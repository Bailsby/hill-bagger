import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentOwnerGithubId } from "@/auth";
import { firstParam } from "@/lib/search-params";
import { signInAction } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

// Auth.js sends failed sign-ins here with ?error=<code>.
const errors: Record<string, string> = {
  AccessDenied:
    "That GitHub account isn't the owner's, so it can't sign in here. Everything on this site is public to view — no sign-in needed.",
  Configuration: "Sign-in isn't set up on this server yet.",
};

export default async function SignIn({ searchParams }: PageProps<"/signin">) {
  if (await currentOwnerGithubId()) redirect("/");

  const code = firstParam((await searchParams).error);
  const error = code ? (errors[code] ?? "Sign-in didn't work. Please try again.") : null;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-muted">
        This is a personal tracker. Only its owner can sign in to record climbs; everyone else
        can <Link href="/" className="text-brand underline">browse the lists</Link> without signing in.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-danger-soft p-4 text-sm">
          {error}
        </p>
      )}

      <form action={signInAction} className="mt-8">
        <input type="hidden" name="returnTo" value="/" />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 font-semibold text-white hover:bg-ink/90"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-5" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          Sign in with GitHub
        </button>
      </form>
    </main>
  );
}
