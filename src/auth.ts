import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { isOwner } from "@/lib/owner";
import { prisma } from "@/lib/prisma";

declare module "@auth/core/types" {
  interface Session {
    /** The signed-in GitHub account's numeric id. */
    githubId?: string;
  }
}

// Sign-in is GitHub only, and only the owner's account: anyone else is refused
// at the callback and never gets a session. Sessions are JWTs in a cookie, so
// signing in needs no session table. Client id and secret come from
// AUTH_GITHUB_ID / AUTH_GITHUB_SECRET.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  pages: { signIn: "/signin", error: "/signin" },
  // Browsers share cookies across ports, so on localhost the default cookie name
  // collides with other Auth.js apps: each fails to read the other's session and
  // signing into one signs you out of the other. Deployed, the host is unique
  // and the secure default name stands.
  ...(process.env.NODE_ENV === "development" && {
    cookies: {
      sessionToken: {
        name: "hill-bagger.session-token",
        options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
      },
    },
  }),
  callbacks: {
    signIn: ({ account }) => account?.provider === "github" && isOwner(account.providerAccountId),
    jwt: ({ token, account }) => (account ? { ...token, githubId: account.providerAccountId } : token),
    session: ({ session, token }) => ({
      ...session,
      githubId: typeof token.githubId === "string" ? token.githubId : undefined,
    }),
  },
  events: {
    // Keep the owner's record, and their display name, in step with GitHub.
    signIn: async ({ account, profile }) => {
      if (!account) return;
      const name = typeof profile?.name === "string" ? profile.name : null;
      await prisma.user.upsert({
        where: { githubId: account.providerAccountId },
        update: { name },
        create: { githubId: account.providerAccountId, name },
      });
    },
  },
});

/**
 * The signed-in owner's GitHub id, or null. Checked again on every request
 * rather than trusted from sign-in, so changing OWNER_GITHUB_ID takes effect
 * immediately for sessions already issued.
 */
export const currentOwnerGithubId = async (): Promise<string | null> => {
  const session = await auth();
  return session?.githubId && isOwner(session.githubId) ? session.githubId : null;
};
