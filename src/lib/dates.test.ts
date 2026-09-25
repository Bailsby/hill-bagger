import { describe, expect, it } from "vitest";
import {
  addDays,
  formatCalendarDate,
  fromCalendarDate,
  isCalendarDate,
  toCalendarDate,
  todayIn,
} from "./dates";

describe("isCalendarDate", () => {
  it("accepts real dates only", () => {
    expect(isCalendarDate("2026-09-12")).toBe(true);
    expect(isCalendarDate("2024-02-29")).toBe(true);
    ["2026-02-30", "2025-02-29", "2026-9-12", "12/09/2026", "", null, 20260912].forEach((value) =>
      expect(isCalendarDate(value)).toBe(false),
    );
  });
});

describe("todayIn", () => {
  it("uses the given zone's calendar, not UTC's", () => {
    // 23:30 UTC in summer is already tomorrow in London.
    expect(todayIn("Europe/London", new Date("2026-06-02T23:30:00Z"))).toBe("2026-06-03");
    expect(todayIn("Europe/London", new Date("2026-12-02T23:30:00Z"))).toBe("2026-12-02");
  });
});

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("database round trip", () => {
  it("keeps the calendar date across a DST change", () => {
    expect(toCalendarDate(fromCalendarDate("2026-03-29"))).toBe("2026-03-29");
    expect(toCalendarDate(fromCalendarDate("2026-10-25"))).toBe("2026-10-25");
  });
});

describe("formatCalendarDate", () => {
  it("formats in British style without shifting the day", () => {
    expect(formatCalendarDate("2026-09-12")).toMatch(/^12 Sept? 2026$/);
    expect(formatCalendarDate("2026-01-01")).toBe("1 Jan 2026");
  });
});
