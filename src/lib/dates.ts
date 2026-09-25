/**
 * A day on the calendar, as `YYYY-MM-DD`. Deliberately a string rather than a
 * Date: "climbed on 12 September" is a date, not an instant, and a Date would
 * drift by a day for anyone reading it in a different zone.
 */
export type CalendarDate = string;

/** The owner is UK-based; "today" for defaults and validation means today there. */
export const HOME_TIME_ZONE = "Europe/London";

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const utcMidnight = (date: CalendarDate) => new Date(`${date}T00:00:00Z`);

export const isCalendarDate = (value: unknown): value is CalendarDate =>
  typeof value === "string" &&
  CALENDAR_DATE.test(value) &&
  // Round-tripping rejects dates like 2026-02-30.
  !Number.isNaN(utcMidnight(value).getTime()) &&
  utcMidnight(value).toISOString().slice(0, 10) === value;

export const addDays = (date: CalendarDate, days: number): CalendarDate =>
  new Date(utcMidnight(date).getTime() + days * MS_PER_DAY).toISOString().slice(0, 10);

export const todayIn = (timeZone: string, now: Date = new Date()): CalendarDate => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(now)
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};

/** Prisma returns a `@db.Date` column as a Date at UTC midnight. */
export const toCalendarDate = (date: Date): CalendarDate => date.toISOString().slice(0, 10);

export const fromCalendarDate = (date: CalendarDate): Date => utcMidnight(date);

/** e.g. "12 Sept 2026". Formatted at UTC so the calendar date can't shift. */
export const formatCalendarDate = (date: CalendarDate): string =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcMidnight(date));
