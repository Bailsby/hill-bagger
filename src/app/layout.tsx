import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { currentOwnerGithubId } from "@/auth";
import { dataSource } from "@/lib/hills";
import { signOutAction } from "./actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Hill Bagger", template: "%s · Hill Bagger" },
  description:
    "Progress across the Munros, Wainwrights, Welsh 3000s, Ethels, Yorkshire Three Peaks and Dales 30.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const signedIn = (await currentOwnerGithubId()) !== null;

  return (
    <html lang="en-GB" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight hover:text-brand">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 text-brand" fill="currentColor">
                <path d="M9.5 5 2 19h20l-5.5-9.5-3 5z" opacity="0.55" />
                <path d="M9.5 5 2 19h15z" />
              </svg>
              Hill Bagger
            </Link>

            {signedIn ? (
              <form action={signOutAction}>
                <button type="submit" className="text-sm text-muted hover:text-ink">
                  Sign out
                </button>
              </form>
            ) : (
              <Link href="/signin" className="text-sm text-muted hover:text-ink">
                Sign in
              </Link>
            )}
          </div>
        </header>

        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-12">{children}</div>

        {/* Attribution required by the data's CC BY 4.0 licence. */}
        <footer className="border-t border-line">
          <p className="mx-auto max-w-4xl px-4 py-6 text-center text-sm text-muted">
            Hill data:{" "}
            <a href={dataSource.url} className="underline hover:text-ink">
              {dataSource.name} v{dataSource.version}
            </a>
            , licensed{" "}
            <a href={dataSource.licenceUrl} className="underline hover:text-ink">
              {dataSource.licence}
            </a>
            .
          </p>
        </footer>
      </body>
    </html>
  );
}
