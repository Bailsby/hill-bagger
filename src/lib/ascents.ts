import type { DatePrecision } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { AscentInput } from "./ascent-input";
import type { ClimbDate } from "./climb-date";
import { fromCalendarDate, toCalendarDate } from "./dates";

export type Ascent = { hillId: number; climbed: ClimbDate; notes: string | null };

// A year is stored as its 1 January, an unknown date as null; `precision` says
// which. The database checks the two agree.
const toColumns = (climbed: ClimbDate): { climbedOn: Date | null; precision: DatePrecision } => {
  switch (climbed.precision) {
    case "day":
      return { climbedOn: fromCalendarDate(climbed.date), precision: "DAY" };
    case "year":
      return { climbedOn: fromCalendarDate(`${climbed.year}-01-01`), precision: "YEAR" };
    case "unknown":
      return { climbedOn: null, precision: "UNKNOWN" };
  }
};

const fromColumns = (climbedOn: Date | null, precision: DatePrecision): ClimbDate => {
  if (precision === "UNKNOWN" || climbedOn === null) return { precision: "unknown" };
  if (precision === "YEAR") return { precision: "year", year: climbedOn.getUTCFullYear() };
  return { precision: "day", date: toCalendarDate(climbedOn) };
};

export const findUserByGithubId = (githubId: string) =>
  prisma.user.findUnique({ where: { githubId } });

/**
 * Everything a user has climbed, most recent first, with undated climbs last.
 * Notes are private, so they're only read when the owner is the one looking.
 */
export const listAscents = async (
  userId: string,
  { includeNotes }: { includeNotes: boolean },
): Promise<Ascent[]> => {
  const rows = await prisma.ascent.findMany({
    where: { userId },
    orderBy: [{ climbedOn: { sort: "desc", nulls: "last" } }, { hillId: "asc" }],
    select: { hillId: true, climbedOn: true, precision: true, notes: includeNotes },
  });
  return rows.map((row) => ({
    hillId: row.hillId,
    climbed: fromColumns(row.climbedOn, row.precision),
    notes: includeNotes ? (row.notes ?? null) : null,
  }));
};

/** Records a hill as climbed, or corrects the date and notes if it already is. */
export const saveAscent = async (userId: string, input: AscentInput): Promise<void> => {
  const data = { ...toColumns(input.climbed), notes: input.notes };
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
