/**
 * Whether a GitHub account id is the owner's. Fails closed: with
 * OWNER_GITHUB_ID unset, nobody is the owner, so a deployment that forgets to
 * configure it is read-only rather than open to anyone with a GitHub account.
 */
export const isOwner = (
  githubId: string | null | undefined,
  ownerGithubId: string | undefined = process.env.OWNER_GITHUB_ID,
): boolean => Boolean(ownerGithubId?.trim()) && githubId === ownerGithubId?.trim();
