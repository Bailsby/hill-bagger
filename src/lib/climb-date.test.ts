import { describe, expect, it } from "vitest";
import { formatClimbDate, isDated, machineReadable, type ClimbDate } from "./climb-date";

const day: ClimbDate = { precision: "day", date: "2026-01-12" };
const year: ClimbDate = { precision: "year", year: 2015 };
const unknown: ClimbDate = { precision: "unknown" };

describe("climb dates", () => {
  it("formats each precision for people", () => {
    expect(formatClimbDate(day)).toBe("12 Jan 2026");
    expect(formatClimbDate(year)).toBe("2015");
    expect(formatClimbDate(unknown)).toBe("Date unknown");
  });

  it("gives a valid <time> value where there is one", () => {
    expect(machineReadable(day)).toBe("2026-01-12");
    expect(machineReadable(year)).toBe("2015");
    expect(machineReadable(unknown)).toBeNull();
  });

  it("knows which climbs can go on a timeline", () => {
    expect([day, year, unknown].map(isDated)).toEqual([true, true, false]);
  });
});
