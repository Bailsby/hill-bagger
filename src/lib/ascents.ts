import { prisma } from "@/lib/prisma";
import type { AscentInput } from "./ascent-input";
import { fromCalendarDate, toCalendarDate, type CalendarDate } from "./dates";

export type Ascent = { hillId: number; climbedOn: CalendarDate; notes: string | null };

export const findUserByGithubId = (githubId: string) =>
  prisma.user.findUnique({ where: { githubId } });

/**
 * Everything a user has climbed, most recent first. Notes are private, so
 * they're only read when the owner is the one looking.
 */
export const listAscents = async (
  userId: string,
  { includeNotes }: { includeNotes: boolean },
): Promise<Ascent[]> => {
  const rows = await prisma.ascent.findMany({
    where: { userId },
    orderBy: [{ climbedOn: "desc" }, { hillId: "asc" }],
    select: { hillId: true, climbedOn: true, notes: includeNotes },
  });
  return rows.map((row) => ({
    hillId: row.hillId,
    climbedOn: toCalendarDate(row.climbedOn),
    notes: includeNotes ? (row.notes ?? null) : null,
  }));
};

/** Records a hill as climbed, or corrects the date and notes if it already is. */
export const saveAscent = async (userId: string, input: AscentInput): Promise<void> => {
  const data = { climbedOn: fromCalendarDate(input.climbedOn), notes: input.notes };
  await prisma.ascent.upsert({
    where: { userId_hillId: { userId, hillId: input.hillId } },
    create: { userId, hillId: input.hillId, ...data },
    update: data,
  });
};

/** Un-ticks a hill. Removing one that isn't there is not an error. */
export const removeAscent = async (userId: string, hillId: number): Promise<void> => {
  await prisma.ascent.deleteMany({ where: { userId, hillId } });
};
