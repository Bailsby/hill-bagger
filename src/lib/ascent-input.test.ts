import { describe, expect, it } from "vitest";
import { parseAscentInput, parseClimbDate, parseHillId } from "./ascent-input";

const known = (hillId: number) => hillId === 2783;
const today = "2026-09-25";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([name, value]) => data.set(name, value));
  return data;
};

describe("parseAscentInput", () => {
  const valid = { hillId: "2783", precision: "day", climbedOn: "2026-09-12", notes: "  Clear day.  " };

  it("accepts a valid ascent, trimming notes", () => {
    expect(parseAscentInput(form(valid), today, known)).toEqual({
      ok: true,
      value: {
        hillId: 2783,
        climbed: { precision: "day", date: "2026-09-12" },
        notes: "Clear day.",
      },
    });
  });

  it("treats blank notes as none", () => {
    expect(parseAscentInput(form({ ...valid, notes: "   " }), today, known)).toMatchObject({
      ok: true,
      value: { notes: null },
    });
  });

  it("refuses notes over the limit", () => {
    expect(parseAscentInput(form({ ...valid, notes: "x".repeat(1001) }), today, known).ok).toBe(false);
    expect(parseAscentInput(form({ ...valid, notes: "x".repeat(1000) }), today, known).ok).toBe(true);
  });

  it("refuses a hill it doesn't know before looking at anything else", () => {
    expect(parseAscentInput(form({ ...valid, hillId: "1" }), today, known)).toEqual({
      ok: false,
      error: "That hill isn't on any list.",
    });
  });
});

describe("parseClimbDate", () => {
  describe("an exact date", () => {
    const day = (climbedOn: string) => parseClimbDate(form({ precision: "day", climbedOn }), today);

    it("accepts today, and tomorrow for anyone ahead of UK time", () => {
      expect(day(today)).toEqual({ ok: true, value: { precision: "day", date: today } });
      expect(day("2026-09-26").ok).toBe(true);
    });

    it("refuses dates further in the future, or before 1900", () => {
      expect(day("2026-09-27")).toEqual({ ok: false, error: "That date is in the future." });
      expect(day("1899-12-31")).toEqual({ ok: false, error: "That date is too far in the past." });
    });

    it("refuses a missing or impossible date", () => {
      ["", "2026-02-30", "yesterday"].forEach((climbedOn) =>
        expect(day(climbedOn)).toEqual({ ok: false, error: "Please choose the date you climbed it." }),
      );
    });

    it("is what a form without a precision means", () => {
      expect(parseClimbDate(form({ climbedOn: "2026-09-12" }), today)).toEqual({
        ok: true,
        value: { precision: "day", date: "2026-09-12" },
      });
    });
  });

  describe("a year only", () => {
    const year = (climbedYear: string, onDay = today) =>
      parseClimbDate(form({ precision: "year", climbedYear }), onDay);

    it("accepts a past year and the current one, ignoring stray spaces", () => {
      expect(year("2015")).toEqual({ ok: true, value: { precision: "year", year: 2015 } });
      expect(year(" 2026 ")).toEqual({ ok: true, value: { precision: "year", year: 2026 } });
    });

    it("accepts next year only on New Year's Eve, for anyone already in it", () => {
      expect(year("2027").ok).toBe(false);
      expect(year("2027", "2026-12-31").ok).toBe(true);
    });

    it("refuses future years, years before 1900 and anything that isn't a year", () => {
      expect(year("2030")).toEqual({ ok: false, error: "That year is in the future." });
      expect(year("1899")).toEqual({ ok: false, error: "That year is too far in the past." });
      ["", "15", "2015.5", "twenty", "02015"].forEach((value) =>
        expect(year(value)).toEqual({ ok: false, error: "Please enter the year you climbed it." }),
      );
    });

    it("ignores any exact date also sent", () => {
      const both = form({ precision: "year", climbedYear: "2015", climbedOn: "2026-09-12" });
      expect(parseClimbDate(both, today)).toEqual({ ok: true, value: { precision: "year", year: 2015 } });
    });
  });

  describe("an unknown date", () => {
    it("needs nothing else, and ignores any date sent", () => {
      expect(parseClimbDate(form({ precision: "unknown", climbedOn: "nonsense" }), today)).toEqual({
        ok: true,
        value: { precision: "unknown" },
      });
    });
  });

  it("refuses a precision it doesn't recognise", () => {
    expect(parseClimbDate(form({ precision: "decade" }), today)).toEqual({
      ok: false,
      error: "Please choose how well you know the date.",
    });
  });
});

describe("parseHillId", () => {
  it("accepts only positive integers the hill data knows", () => {
    expect(parseHillId("2783", known)).toEqual({ ok: true, value: 2783 });
    ["2784", "0", "-2783", "2783.5", "abc", ""].forEach((value) =>
      expect(parseHillId(value, known).ok).toBe(false),
    );
    expect(parseHillId(null, known).ok).toBe(false);
  });
});
