"use server";

import { revalidatePath } from "next/cache";
import { currentOwnerGithubId, signIn, signOut } from "@/auth";
import { parseAscentInput, parseHillId } from "@/lib/ascent-input";
import { removeAscent, saveAscent } from "@/lib/ascents";
import { HOME_TIME_ZONE, todayIn } from "@/lib/dates";
import { hillsById } from "@/lib/hills";
import { prisma } from "@/lib/prisma";

export type ActionResult = { ok: true } | { ok: false; error: string };

const notAllowed: ActionResult = {
  ok: false,
  error: "Only the owner can record climbs. Your session may have expired — please sign in again.",
};

// Server actions can be called with a direct POST, so each one checks the
// session itself rather than trusting that the page hid the controls.
const ownerUserId = async (): Promise<string | null> => {
  const githubId = await currentOwnerGithubId();
  if (!githubId) return null;
  // The row is created at sign-in; upsert covers a database reset since.
  const user = await prisma.user.upsert({ where: { githubId }, update: {}, create: { githubId } });
  return user.id;
};

const isKnownHill = (hillId: number) => hillsById.has(hillId);

export async function saveAscentAction(form: FormData): Promise<ActionResult> {
  const userId = await ownerUserId();
  if (!userId) return notAllowed;

  const parsed = parseAscentInput(form, todayIn(HOME_TIME_ZONE), isKnownHill);
  if (!parsed.ok) return parsed;

  await saveAscent(userId, parsed.value);
  // Every page shows progress, so refresh them all, not just this one.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAscentAction(form: FormData): Promise<ActionResult> {
  const userId = await ownerUserId();
  if (!userId) return notAllowed;

  const hillId = parseHillId(form.get("hillId"), isKnownHill);
  if (!hillId.ok) return hillId;

  await removeAscent(userId, hillId.value);
  revalidatePath("/", "layout");
  return { ok: true };
}

// Only same-site paths, so the sign-in flow can't be used to bounce someone
// to another site.
const safeReturnPath = (value: FormDataEntryValue | null): string =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";

export async function signInAction(form: FormData) {
  await signIn("github", { redirectTo: safeReturnPath(form.get("returnTo")) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
