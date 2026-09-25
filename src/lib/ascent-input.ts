import { addDays, isCalendarDate, type CalendarDate } from "./dates";

export type AscentInput = { hillId: number; climbedOn: CalendarDate; notes: string | null };

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export const MAX_NOTES = 1000;
const EARLIEST = "1900-01-01";

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
 * Validates an ascent from the form. `today` is the owner's today; a day's
 * grace allows for recording from somewhere already into tomorrow.
 */
export const parseAscentInput = (
  form: FormData,
  today: CalendarDate,
  isKnownHill: (hillId: number) => boolean,
): Parsed<AscentInput> => {
  const hillId = parseHillId(form.get("hillId"), isKnownHill);
  if (!hillId.ok) return hillId;

  const climbedOn = form.get("climbedOn");
  if (!isCalendarDate(climbedOn)) return { ok: false, error: "Please choose the date you climbed it." };
  if (climbedOn > addDays(today, 1)) return { ok: false, error: "That date is in the future." };
  if (climbedOn < EARLIEST) return { ok: false, error: "That date is too far in the past." };

  const rawNotes = form.get("notes");
  const notes = typeof rawNotes === "string" ? rawNotes.trim() : "";
  if (notes.length > MAX_NOTES) {
    return { ok: false, error: `Please keep notes under ${MAX_NOTES} characters.` };
  }

  return { ok: true, value: { hillId: hillId.value, climbedOn, notes: notes === "" ? null : notes } };
};
