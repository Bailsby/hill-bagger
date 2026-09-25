import { describe, expect, it } from "vitest";
import type { ListId } from "@/data/hill-data";
import {
  dataSource,
  getList,
  hillLists,
  hills,
  hillsById,
  listProgress,
  listsContaining,
} from "./hills";

// These run against the committed src/data/hills.json, so a DoBIH update that
// changes something unexpectedly fails here as well as in the import.

const byName = (name: string) => {
  const hill = hills.find((candidate) => candidate.name.startsWith(name));
  if (!hill) throw new Error(`No hill named ${name}`);
  return hill;
};

const list = (id: ListId) => {
  const found = getList(id);
  if (!found) throw new Error(`No list ${id}`);
  return found;
};

describe("the hill data", () => {
  it("has every list at its known size", () => {
    expect(Object.fromEntries(hillLists.map((l) => [l.id, l.hillIds.length]))).toEqual({
      munros: 282,
      wainwrights: 214,
      "welsh-3000s": 15,
      ethels: 95,
      "yorkshire-three-peaks": 3,
      "dales-30": 30,
    });
  });

  it("resolves every list member to a hill, and stores each hill once", () => {
    hillLists.forEach((l) => l.hillIds.forEach((id) => expect(hillsById.has(id)).toBe(true)));
    expect(hillsById.size).toBe(hills.length);
  });

  it("keeps only hills that are on a list", () => {
    const listed = new Set(hillLists.flatMap((l) => l.hillIds));
    expect(hills.every((hill) => listed.has(hill.id))).toBe(true);
  });

  it("places every summit within Great Britain", () => {
    hills.forEach((hill) => {
      expect(hill.lat).toBeGreaterThan(49.9);
      expect(hill.lat).toBeLessThan(60.9);
      expect(hill.lng).toBeGreaterThan(-8.7);
      expect(hill.lng).toBeLessThan(1.8);
      expect(hill.gridRef).toMatch(/^[HNST][A-Z]\d{6}$/);
    });
  });

  it("has the landmarks where they should be", () => {
    expect(byName("Ben Nevis").metres).toBeGreaterThan(1344);
    expect(listsContaining(byName("Ben Nevis").id).map((l) => l.id)).toEqual(["munros"]);
    expect(listsContaining(byName("Scafell Pike").id).map((l) => l.id)).toEqual(["wainwrights"]);
    expect(listsContaining(byName("Snowdon").id).map((l) => l.id)).toEqual(["welsh-3000s"]);
  });

  it("puts every Welsh 3000 over 3,000 ft", () => {
    list("welsh-3000s").hillIds.forEach((id) =>
      expect(hillsById.get(id)?.metres).toBeGreaterThanOrEqual(914.4),
    );
  });

  it("puts every Dales 30 hill over 2,000 ft, and leaves out Nine Standards Rigg", () => {
    list("dales-30").hillIds.forEach((id) =>
      expect(hillsById.get(id)?.metres).toBeGreaterThanOrEqual(609.6),
    );
    expect(hills.some((hill) => hill.name === "Nine Standards Rigg")).toBe(false);
  });

  it("has the Yorkshire Three Peaks, all of which are also Dales 30 hills", () => {
    const peaks = list("yorkshire-three-peaks").hillIds.map((id) => hillsById.get(id)?.name);
    expect(peaks).toEqual(["Whernside", "Ingleborough", "Pen-y-ghent"]);
    const dales = new Set(list("dales-30").hillIds);
    expect(list("yorkshire-three-peaks").hillIds.every((id) => dales.has(id))).toBe(true);
  });

  it("carries attribution for the source data", () => {
    expect(dataSource).toMatchObject({
      name: "The Database of British and Irish Hills",
      licence: "CC BY 4.0",
    });
    expect(dataSource.version).toMatch(/^\d+\.\d+$/);
  });
});

describe("listProgress", () => {
  it("counts a single tick towards every list the hill is on", () => {
    const penYGhent = byName("Pen-y-ghent").id;
    const ticked = new Set([penYGhent]);

    expect(listProgress(list("yorkshire-three-peaks"), ticked)).toEqual({ done: 1, total: 3 });
    expect(listProgress(list("dales-30"), ticked)).toEqual({ done: 1, total: 30 });
    expect(listProgress(list("munros"), ticked)).toEqual({ done: 0, total: 282 });
  });

  it("ignores ticks for hills that aren't on the list", () => {
    expect(listProgress(list("ethels"), new Set([byName("Ben Nevis").id, -1]))).toEqual({
      done: 0,
      total: 95,
    });
  });

  it("reaches the full total when every hill is ticked", () => {
    const all = new Set(hills.map((hill) => hill.id));
    hillLists.forEach((l) => expect(listProgress(l, all)).toEqual({ done: l.hillIds.length, total: l.hillIds.length }));
  });
});
