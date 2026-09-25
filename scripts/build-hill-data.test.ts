import { describe, expect, it } from "vitest";
import type { ListDefinition } from "../src/data/list-definitions";
import { buildHillData, serialiseHillData, type DobihRecord } from "./build-hill-data";

const record = (overrides: Partial<DobihRecord>): DobihRecord => ({
  Number: "1",
  Name: "Hill",
  Metres: "700.04",
  "Grid ref": "SD839733",
  Latitude: "54.155432",
  Longitude: "-2.249117",
  Area: "Yorkshire Dales - Southern Fells",
  Region: "35B: Central Pennines",
  M: "0",
  W: "0",
  E: "0",
  ...overrides,
});

const records = [
  record({ Number: "10", Name: "Big Munro", Metres: "1100", M: "1", Area: "" }),
  record({ Number: "20", Name: "Fell", W: "1" }),
  record({ Number: "30", Name: "Shared Peak " }),
  record({ Number: "40", Name: "Not On Any List" }),
];

const definitions: ListDefinition[] = [
  {
    id: "munros",
    name: "Munros",
    region: "",
    description: "",
    source: { kind: "dobih-column", column: "M" },
    expectedCount: 1,
  },
  {
    id: "yorkshire-three-peaks",
    name: "Three",
    region: "",
    description: "",
    source: { kind: "hill-numbers", numbers: [30, 20] },
    expectedCount: 2,
  },
  {
    id: "dales-30",
    name: "Dales",
    region: "",
    description: "",
    source: { kind: "hill-numbers", numbers: [30] },
    expectedCount: 1,
  },
];

describe("buildHillData", () => {
  const data = buildHillData(records, definitions, "18.6");

  it("takes classified lists from DoBIH's column and pinned lists from hill numbers", () => {
    expect(data.lists).toEqual({
      munros: [10],
      "yorkshire-three-peaks": [20, 30],
      "dales-30": [30],
    });
  });

  it("stores each hill once, however many lists it's on, and skips unlisted hills", () => {
    expect(data.hills.map((hill) => hill.id)).toEqual([10, 20, 30]);
  });

  it("trims names, rounds figures and falls back to the region, without its code, for the area", () => {
    expect(data.hills[0]).toEqual({
      id: 10,
      name: "Big Munro",
      metres: 1100,
      gridRef: "SD839733",
      lat: 54.15543,
      lng: -2.24912,
      area: "Central Pennines",
    });
    expect(data.hills[2].name).toBe("Shared Peak");
    expect(data.hills[1].metres).toBe(700);
  });

  it("records the source and version for attribution", () => {
    expect(data.source).toMatchObject({ version: "18.6", licence: "CC BY 4.0" });
  });

  it("refuses a list whose size doesn't match expectations", () => {
    const wrongCount = [{ ...definitions[0], expectedCount: 2 }];
    expect(() => buildHillData(records, wrongCount, "18.6")).toThrow(/expected 2 hills, found 1/);
  });

  it("refuses a pinned hill number DoBIH doesn't have", () => {
    const missing = [{ ...definitions[2], source: { kind: "hill-numbers" as const, numbers: [99] } }];
    expect(() => buildHillData(records, missing, "18.6")).toThrow(/no hill numbered 99/);
  });

  it("refuses a hill listed twice in one list", () => {
    const twice = [
      { ...definitions[1], source: { kind: "hill-numbers" as const, numbers: [20, 20] } },
    ];
    expect(() => buildHillData(records, twice, "18.6")).toThrow(/listed twice/);
  });

  it("refuses malformed figures rather than writing NaN", () => {
    const broken = [record({ Number: "10", M: "1", Latitude: "" })];
    expect(() => buildHillData(broken, [definitions[0]], "18.6")).toThrow(/malformed/);
  });
});

describe("serialiseHillData", () => {
  it("round-trips through JSON, one hill per line", () => {
    const data = buildHillData(records, definitions, "18.6");
    const text = serialiseHillData(data);
    expect(JSON.parse(text)).toEqual(data);
    expect(text.split("\n").filter((line) => line.includes('"gridRef"'))).toHaveLength(3);
  });
});
