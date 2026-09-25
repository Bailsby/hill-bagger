import { describe, expect, it } from "vitest";
import { viewHills, type HillRow } from "./list-view";

const row = (id: number, name: string, metres: number, area = "Somewhere"): HillRow => ({
  id,
  name,
  metres,
  area,
  gridRef: "NN000000",
  lat: 56,
  lng: -4,
  alsoOn: [],
});

const rows = [
  row(1, "Ben Nevis [Beinn Nibheis]", 1344.5, "Fort William"),
  row(2, "Beinn a' Ghlò - Càrn nan Gabhar", 1121.9, "Blair Atholl"),
  row(3, "Ben Lomond", 973.7, "Loch Lomond"),
  row(4, "Ben Chonzie", 930.4, "Loch Tay to Perth"),
];

const names = (result: HillRow[]) => result.map((r) => r.id);
const all = { sort: "height" as const, show: "all" as const, query: "" };

describe("viewHills", () => {
  it("sorts highest first by default", () => {
    expect(names(viewHills(rows, new Set(), all))).toEqual([1, 2, 3, 4]);
  });

  it("sorts alphabetically", () => {
    expect(names(viewHills(rows, new Set(), { ...all, sort: "name" }))).toEqual([2, 4, 3, 1]);
  });

  it("shows only done or only to-do hills", () => {
    const ticks = new Set([1, 3]);
    expect(names(viewHills(rows, ticks, { ...all, show: "done" }))).toEqual([1, 3]);
    expect(names(viewHills(rows, ticks, { ...all, show: "todo" }))).toEqual([2, 4]);
  });

  it("searches names and areas, ignoring case and accents", () => {
    expect(names(viewHills(rows, new Set(), { ...all, query: "carn" }))).toEqual([2]);
    expect(names(viewHills(rows, new Set(), { ...all, query: "  LOMOND " }))).toEqual([3]);
    expect(names(viewHills(rows, new Set(), { ...all, query: "perth" }))).toEqual([4]);
  });

  it("does not reorder its input", () => {
    const input = [...rows].reverse();
    viewHills(input, new Set(), all);
    expect(names(input)).toEqual([4, 3, 2, 1]);
  });
});
