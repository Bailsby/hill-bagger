import type { ClimbDate } from "./climb-date";
import { addDays, isCalendarDate, type CalendarDate } from "./dates";

export type AscentInput = { hillId: number; climbed: ClimbDate; notes: string | null };

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export const MAX_NOTES = 1000;
export const EARLIEST_YEAR = 1900;
const EARLIEST_DATE = `${EARLIEST_YEAR}-01-01`;

/** The latest date a climb can have: a day's grace for anyone already into tomorrow. */
export const latestClimbDate = (today: CalendarDate): CalendarDate => addDays(today, 1);

/** A hill id from a form: a positive integer the hill data knows about. */
export const parseHillId = (
  value: FormDataEntryValue | null,
  isKnownHill: (hillId: number) => boolean,
): Parsed<number> => {
  const hillId = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : Number.NaN;
  return Number.isSafeInteger(hillId) && hillId > 0 && isKnownHill(hillId)
    ? { ok: true, value: hillId }
    : { ok: false, error: "That hill isn't on any list." };
};

/**
 * When it was climbed, at the precision the form chose. A form without a
 * precision is treated as an exact date, which is what it used to be.
 */
export const parseClimbDate = (form: FormData, today: CalendarDate): Parsed<ClimbDate> => {
  const precision = form.get("precision") ?? "day";
  const latest = latestClimbDate(today);

  if (precision === "unknown") return { ok: true, value: { precision: "unknown" } };

  if (precision === "year") {
    const raw = form.get("climbedYear");
    const year = typeof raw === "string" && /^\d{4}$/.test(raw.trim()) ? Number(raw.trim()) : null;
    if (year === null) return { ok: false, error: "Please enter the year you climbed it." };
    if (year > Number(latest.slice(0, 4))) return { ok: false, error: "That year is in the future." };
    if (year < EARLIEST_YEAR) return { ok: false, error: "That year is too far in the past." };
    return { ok: true, value: { precision: "year", year } };
  }

  if (precision !== "day") return { ok: false, error: "Please choose how well you know the date." };

  const date = form.get("climbedOn");
  if (!isCalendarDate(date)) return { ok: false, error: "Please choose the date you climbed it." };
  if (date > latest) return { ok: false, error: "That date is in the future." };
  if (date < EARLIEST_DATE) return { ok: false, error: "That date is too far in the past." };
  return { ok: true, value: { precision: "day", date } };
};

/** Validates an ascent from the form. `today` is the owner's today. */
export const parseAscentInput = (
  form: FormData,
  today: CalendarDate,
  isKnownHill: (hillId: number) => boolean,
): Parsed<AscentInput> => {
  const hillId = parseHillId(form.get("hillId"), isKnownHill);
  if (!hillId.ok) return hillId;

  const climbed = parseClimbDate(form, today);
  if (!climbed.ok) return climbed;

  const rawNotes = form.get("notes");
  const notes = typeof rawNotes === "string" ? rawNotes.trim() : "";
  if (notes.length > MAX_NOTES) {
    return { ok: false, error: `Please keep notes under ${MAX_NOTES} characters.` };
  }

  return {
    ok: true,
    value: { hillId: hillId.value, climbed: climbed.value, notes: notes === "" ? null : notes },
  };
};
