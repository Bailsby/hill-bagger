import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("splits rows and fields", () => {
    expect(parseCsv("a,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles CRLF line endings and a missing final newline", () => {
    expect(parseCsv("a,b\r\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps commas, newlines and doubled quotes inside quoted fields", () => {
    expect(parseCsv('name,note\n"Sails, Lunds Fell","said ""hi""\nthen left"\n')).toEqual([
      ["name", "note"],
      ["Sails, Lunds Fell", 'said "hi"\nthen left'],
    ]);
  });

  it("keeps empty fields", () => {
    expect(parseCsv("a,,c\n,,\n")).toEqual([
      ["a", "", "c"],
      ["", "", ""],
    ]);
  });
});
