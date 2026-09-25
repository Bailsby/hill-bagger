import { describe, expect, it } from "vitest";
import { parseAscentInput, parseHillId } from "./ascent-input";

const known = (hillId: number) => hillId === 2783;
const today = "2026-09-25";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([name, value]) => data.set(name, value));
  return data;
};

const valid = { hillId: "2783", climbedOn: "2026-09-12", notes: "  Clear day, busy summit.  " };

describe("parseAscentInput", () => {
  it("accepts a valid ascent, trimming notes", () => {
    expect(parseAscentInput(form(valid), today, known)).toEqual({
      ok: true,
      value: { hillId: 2783, climbedOn: "2026-09-12", notes: "Clear day, busy summit." },
    });
  });

  it("treats blank notes as none", () => {
    expect(parseAscentInput(form({ ...valid, notes: "   " }), today, known)).toMatchObject({
      ok: true,
      value: { notes: null },
    });
  });

  it("accepts today, and tomorrow for anyone ahead of UK time", () => {
    expect(parseAscentInput(form({ ...valid, climbedOn: today }), today, known).ok).toBe(true);
    expect(parseAscentInput(form({ ...valid, climbedOn: "2026-09-26" }), today, known).ok).toBe(true);
  });

  it("refuses dates further in the future, or implausibly old", () => {
    expect(parseAscentInput(form({ ...valid, climbedOn: "2026-09-27" }), today, known)).toEqual({
      ok: false,
      error: "That date is in the future.",
    });
    expect(parseAscentInput(form({ ...valid, climbedOn: "1899-12-31" }), today, known).ok).toBe(false);
  });

  it("refuses a missing or impossible date", () => {
    ["", "2026-02-30", "yesterday"].forEach((climbedOn) =>
      expect(parseAscentInput(form({ ...valid, climbedOn }), today, known)).toEqual({
        ok: false,
        error: "Please choose the date you climbed it.",
      }),
    );
  });

  it("refuses notes over the limit", () => {
    expect(parseAscentInput(form({ ...valid, notes: "x".repeat(1001) }), today, known).ok).toBe(false);
    expect(parseAscentInput(form({ ...valid, notes: "x".repeat(1000) }), today, known).ok).toBe(true);
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
