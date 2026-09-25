import { cache } from "react";
import { currentOwnerGithubId } from "@/auth";
import { findUserByGithubId, listAscents, type Ascent } from "./ascents";

export type OwnerProgress = {
  /** The owner's name from GitHub, once they've signed in at least once. */
  ownerName: string | null;
  ascents: ReadonlyMap<number, Ascent>;
  /** Most recent first. */
  history: readonly Ascent[];
  /** Whether the person looking is the signed-in owner. */
  canEdit: boolean;
};

/**
 * The owner's progress, as the current visitor may see it: everyone sees what
 * was climbed and when; only the owner sees notes. Cached per request, since
 * the layout and page both ask.
 */
export const getProgress = cache(async (): Promise<OwnerProgress> => {
  const ownerGithubId = process.env.OWNER_GITHUB_ID?.trim();
  const [viewerGithubId, owner] = await Promise.all([
    currentOwnerGithubId(),
    ownerGithubId ? findUserByGithubId(ownerGithubId) : null,
  ]);
  const canEdit = viewerGithubId !== null;
  const history = owner ? await listAscents(owner.id, { includeNotes: canEdit }) : [];

  return {
    ownerName: owner?.name ?? null,
    ascents: new Map(history.map((ascent) => [ascent.hillId, ascent])),
    history,
    canEdit,
  };
});
