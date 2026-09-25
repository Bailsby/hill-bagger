import { formatCalendarDate, type CalendarDate } from "./dates";

/**
 * When a hill was climbed, as precisely as it's remembered. Old climbs often
 * survive only as a year, or not at all; a guessed date would quietly distort
 * anything that charts progress over time.
 */
export type ClimbDate =
  | { precision: "day"; date: CalendarDate }
  | { precision: "year"; year: number }
  | { precision: "unknown" };

export type Precision = ClimbDate["precision"];

export const formatClimbDate = (climbed: ClimbDate): string => {
  switch (climbed.precision) {
    case "day":
      return formatCalendarDate(climbed.date);
    case "year":
      return String(climbed.year);
    case "unknown":
      return "Date unknown";
  }
};

/** The value for a `<time dateTime>` attribute: a full date or a bare year. */
export const machineReadable = (climbed: ClimbDate): string | null => {
  switch (climbed.precision) {
    case "day":
      return climbed.date;
    case "year":
      return String(climbed.year);
    case "unknown":
      return null;
  }
};

/** Whether a climb can be placed in time at all — timelines skip the rest. */
export const isDated = (climbed: ClimbDate): boolean => climbed.precision !== "unknown";
